process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const config = require('../../src/config/env');
const { startServer, stopServer } = require('../../server.js');

const TEST_PORT = 5010;
const adminHeaders = { 'x-admin-token': config.adminToken };

function requestAPI(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: TEST_PORT,
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

describe('Integration Test: Express REST API Endpoints', () => {

    before(async () => {
        await startServer(TEST_PORT);
    });

    after(async () => {
        await stopServer();
    });

    describe('1. Contact API (/api/contact)', () => {
        test('Bad Email Validation (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/contact', 'POST', { name: 'Test', email: 'bad-email', message: 'Hello' });
            assert.equal(res.status, 400);
        });

        test('Valid Contact Submission (-> 201 Created)', async () => {
            const res = await requestAPI('/api/contact', 'POST', { name: 'Sarah', email: 'sarah@techlab.org', message: 'Loved the OS!' });
            assert.equal(res.status, 201);
            assert.equal(res.data.success, true);
        });
    });

    describe('2. Leaderboard API (/api/leaderboard)', () => {
        test('Non-numeric score validation (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/leaderboard', 'POST', { player: 'Bot', game: 'minesweeper', score: 'abc', time_seconds: 10 });
            assert.equal(res.status, 400);
        });

        test('0s time validation (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/leaderboard', 'POST', { player: 'Cheater', game: 'minesweeper', score: 100, time_seconds: 0 });
            assert.equal(res.status, 400);
        });

        test('Unplausible Score validation (-> 400 Bad Request)', async () => {
            const res = await requestAPI('/api/leaderboard', 'POST', { player: 'Hacker', game: 'minesweeper', score: 9999, time_seconds: 5 });
            assert.equal(res.status, 400);
        });

        test('Valid High Score Submission (-> 201 Created)', async () => {
            const res = await requestAPI('/api/leaderboard', 'POST', { player: 'Pro Gamer', game: 'minesweeper', score: 100, time_seconds: 15 });
            assert.equal(res.status, 201);
        });

        test('Fetch Leaderboard List (-> 200 OK)', async () => {
            const res = await requestAPI('/api/leaderboard/minesweeper');
            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.data.data));
        });
    });

    describe('3. Messages & Authentication Gatekeeper (/api/messages)', () => {
        test('Unauthorized Request without Token (-> 401 Unauthorized)', async () => {
            const res = await requestAPI('/api/messages');
            assert.equal(res.status, 401);
        });

        test('Authorized Request with Valid Token (-> 200 OK)', async () => {
            const res = await requestAPI('/api/messages', 'GET', null, adminHeaders);
            assert.equal(res.status, 200);
            assert.ok(Array.isArray(res.data.data));
        });
    });
});
