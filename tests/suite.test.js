process.env.NODE_ENV = 'test';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const config = require('../src/config/env');
const { evaluateExpression } = require('../public/js/utils/math-evaluator.js');
const { startServer, stopServer } = require('../server.js');

let testPort = config.port || 5000;

function testEndpoint(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: testPort,
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
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body || '{}') }));
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

describe('Windows 10 Portfolio OS Node:Test Suite', () => {

    before(async () => {
        await startServer(testPort);
    });

    after(async () => {
        await stopServer();
    });

    describe('1. Math Evaluator Unit Tests', () => {
        test('Basic Addition (12 + 8)', () => {
            assert.equal(evaluateExpression('12 + 8'), '20');
        });

        test('Precedence & Multiplication (2 + 3 * 4)', () => {
            assert.equal(evaluateExpression('2 + 3 * 4'), '14');
        });

        test('Parentheses ((12 + 8) * 5)', () => {
            assert.equal(evaluateExpression('(12 + 8) * 5'), '100');
        });

        test('Modulo (10 % 3)', () => {
            assert.equal(evaluateExpression('10 % 3'), '1');
        });

        test('Zero Division Safety (10 / 0)', () => {
            assert.equal(evaluateExpression('10 / 0'), 'Error');
        });

        test('XSS / Function Code Execution Rejection (alert(1))', () => {
            assert.equal(evaluateExpression('alert(1)'), 'Error');
        });
    });

    describe('2. REST API & SECURITY TESTS', () => {
        const adminHeaders = { 'x-admin-token': config.adminToken };

        test('Auth Gate GET /api/messages (No Token -> 401)', async () => {
            const res = await testEndpoint('/api/messages');
            assert.equal(res.status, 401);
        });

        test('Auth Gate GET /api/messages (Valid Token -> 200)', async () => {
            const res = await testEndpoint('/api/messages', 'GET', null, adminHeaders);
            assert.equal(res.status, 200);
        });

        test('Contact Validation (Bad Email -> 400)', async () => {
            const res = await testEndpoint('/api/contact', 'POST', { name: 'Test', email: 'invalid-email', message: 'Hello' });
            assert.equal(res.status, 400);
        });

        test('Contact Submission (Valid -> 201)', async () => {
            const res = await testEndpoint('/api/contact', 'POST', { name: 'Sarah', email: 'sarah@techlab.org', message: 'Loved the OS portfolio!' });
            assert.equal(res.status, 201);
        });

        test('Prototype Pollution Guard (__proto__ -> 400)', async () => {
            const res = await testEndpoint('/api/vfs', 'POST', { fileName: '__proto__', content: 'hack' }, adminHeaders);
            assert.equal(res.status, 400);
        });

        test('Leaderboard Validation (Non-numeric score -> 400)', async () => {
            const res = await testEndpoint('/api/leaderboard', 'POST', { player: 'Bot', game: 'minesweeper', score: 'abc', time_seconds: 10 });
            assert.equal(res.status, 400);
        });

        test('Leaderboard Validation (0s time -> 400)', async () => {
            const res = await testEndpoint('/api/leaderboard', 'POST', { player: 'Cheater', game: 'minesweeper', score: 100, time_seconds: 0 });
            assert.equal(res.status, 400);
        });

        test('Leaderboard Validation (Unplausible Minesweeper Score -> 400)', async () => {
            const res = await testEndpoint('/api/leaderboard', 'POST', { player: 'Hacker', game: 'minesweeper', score: 9999, time_seconds: 5 });
            assert.equal(res.status, 400);
        });

        test('Leaderboard Submission (Valid Minesweeper Score -> 201)', async () => {
            const res = await testEndpoint('/api/leaderboard', 'POST', { player: 'Pro Gamer', game: 'minesweeper', score: 100, time_seconds: 15 });
            assert.equal(res.status, 201);
        });

        test('Real CPU Telemetry & Anonymized Host (200 OK)', async () => {
            const res = await testEndpoint('/api/system/stats');
            assert.equal(res.status, 200);
            assert.equal(res.data.system.hostname, 'WIN10-PORTFOLIO-DESKTOP');
        });
    });
});
