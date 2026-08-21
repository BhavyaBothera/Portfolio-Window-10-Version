process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { startServer, stopServer } = require('../../server.js');

const ERR_PORT = 5030;

function rawRequest(path, method = 'GET', bodyString = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: ERR_PORT,
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
        if (bodyString) req.write(bodyString);
        req.end();
    });
}

describe('Security Test: API Error Resilience & Crash Protection', () => {

    before(async () => {
        await startServer(ERR_PORT);
    });

    after(async () => {
        await stopServer();
    });

    test('Unknown API Endpoint Returns Structured JSON 404 (No HTML stack trace leak)', async () => {
        const res = await rawRequest('/api/unknown-endpoint-xyz');
        assert.equal(res.status, 404);
        assert.equal(res.data.error, 'API endpoint not found');
    });

    test('Malformed JSON Request Body Returns 400 Bad Request (No Server Crash)', async () => {
        const res = await rawRequest('/api/contact', 'POST', '{ malformed json payload: ');
        assert.equal(res.status, 400);
        assert.ok(res.data.error, 'Error message must be returned');
    });

    test('Invalid Leaderboard Method Returns 404', async () => {
        const res = await rawRequest('/api/leaderboard/nonexistent', 'DELETE');
        assert.equal(res.status, 404);
    });
});
