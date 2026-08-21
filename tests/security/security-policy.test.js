process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const config = require('../../src/config/env');
const { startServer, stopServer } = require('../../server.js');

const SEC_PORT = 5020;
const adminHeaders = { 'x-admin-token': config.adminToken };

function requestAPI(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: SEC_PORT,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = {};
                try { parsed = JSON.parse(body || '{}'); } catch (e) { parsed = { raw: body }; }
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

describe('Security Test: Prototype Pollution, Headers, & Auth Bypass', () => {

    before(async () => {
        await startServer(SEC_PORT);
    });

    after(async () => {
        await stopServer();
    });

    describe('1. Prototype Pollution Protection', () => {
        test('__proto__ injection guard in VFS API (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/vfs', 'POST', { fileName: '__proto__', content: 'polluted' }, adminHeaders);
            assert.equal(res.status, 400);
            assert.equal(res.data.error, 'Invalid payload: Prototype pollution attempt detected');
        });

        test('constructor injection guard in Contact API (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/contact', 'POST', {
                name: 'Attacker',
                email: 'attacker@evil.com',
                constructor: { prototype: { admin: true } }
            });
            assert.equal(res.status, 400);
        });
    });

    describe('2. Input Boundary & Malformed Payload Rejection', () => {
        test('Malformed Email Address (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/contact', 'POST', { name: 'John', email: 'not-an-email', message: 'Hello' });
            assert.equal(res.status, 400);
        });

        test('Invalid Game Title (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/leaderboard', 'POST', { player: 'Gamer', game: 'invalid_title', score: 100, time_seconds: 10 });
            assert.equal(res.status, 400);
        });
    });

    describe('3. Helmet Headers & Auth Bypass Protection', () => {
        test('Content Security Policy (CSP) Header', async () => {
            const res = await requestAPI('/api/system/stats');
            assert.equal(res.status, 200);
            assert.ok(res.headers['content-security-policy']);
            assert.match(res.headers['content-security-policy'], /default-src\s+'self'/);
        });

        test('X-Frame-Options Clickjacking Header', async () => {
            const res = await requestAPI('/api/system/stats');
            assert.equal(res.status, 200);
            assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
        });

        test('Auth Gate Bypass Rejection (-> 401 Unauthorized)', async () => {
            const res = await requestAPI('/api/messages', 'GET', null, { 'x-admin-token': 'fake-token' });
            assert.equal(res.status, 401);
        });
    });
});
