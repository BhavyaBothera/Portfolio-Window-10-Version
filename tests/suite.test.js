const http = require('http');
const assert = require('assert');
const { evaluateExpression } = require('../public/js/utils/math-evaluator.js');

async function testEndpoint(path, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
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

async function runTestSuite() {
    console.log('\n==================================================');
    console.log('🧪 RUNNING PRODUCTION UPGRADE TEST SUITE');
    console.log('==================================================\n');

    let passed = 0;
    let failed = 0;

    function check(testName, condition) {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${testName}`);
            failed++;
        }
    }

    // 1. Math Evaluator Unit Tests
    console.log('--- 1. MATH EVALUATOR TESTS ---');
    check('Basic Addition (12 + 8)', evaluateExpression('12 + 8') === '20');
    check('Precedence & Multiplication (2 + 3 * 4)', evaluateExpression('2 + 3 * 4') === '14');
    check('Parentheses ((12 + 8) * 5)', evaluateExpression('(12 + 8) * 5') === '100');
    check('Modulo (10 % 3)', evaluateExpression('10 % 3') === '1');
    check('Zero Division Safety (10 / 0)', evaluateExpression('10 / 0') === 'Error');
    check('XSS / Function Code Execution Rejection (alert(1))', evaluateExpression('alert(1)') === 'Error');

    // 2. API & Security Integration Tests
    console.log('\n--- 2. REST API & SECURITY TESTS ---');

    const adminHeaders = { 'x-admin-token': 'bhavy-admin-secret-key-2026' };

    // Auth Test
    const tAuthNoToken = await testEndpoint('/api/messages');
    check('Auth Gate GET /api/messages (No Token -> 401)', tAuthNoToken.status === 401);

    const tAuthValidToken = await testEndpoint('/api/messages', 'GET', null, adminHeaders);
    check('Auth Gate GET /api/messages (Valid Token -> 200)', tAuthValidToken.status === 200);

    // Validation Test
    const tBadEmail = await testEndpoint('/api/contact', 'POST', { name: 'Test', email: 'invalid-email', message: 'Hello' });
    check('Contact Validation (Bad Email -> 400)', tBadEmail.status === 400);

    const tValidContact = await testEndpoint('/api/contact', 'POST', { name: 'Sarah', email: 'sarah@techlab.org', message: 'Loved the OS portfolio!' });
    check('Contact Submission (Valid -> 201)', tValidContact.status === 201);

    // Prototype Pollution Test
    const tProtoPollution = await testEndpoint('/api/vfs', 'POST', { fileName: '__proto__', content: 'hack' }, adminHeaders);
    check('Prototype Pollution Guard (__proto__ -> 400)', tProtoPollution.status === 400);

    // Leaderboard Plausibility Test
    const tBadScore = await testEndpoint('/api/leaderboard', 'POST', { player: 'Bot', game: 'minesweeper', score: 'abc', time_seconds: 10 });
    check('Leaderboard Validation (Non-numeric score -> 400)', tBadScore.status === 400);

    const tZeroTime = await testEndpoint('/api/leaderboard', 'POST', { player: 'Cheater', game: 'minesweeper', score: 100, time_seconds: 0 });
    check('Leaderboard Validation (0s time -> 400)', tZeroTime.status === 400);

    // Telemetry Test
    const tTelemetry = await testEndpoint('/api/system/stats');
    check('Real CPU Telemetry & Anonymized Host (200 OK)', tTelemetry.status === 200 && tTelemetry.data.system.hostname === 'WIN10-PORTFOLIO-DESKTOP');

    console.log('\n==================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('==================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch(err => {
    console.error('Test Suite Exception:', err);
    process.exit(1);
});
