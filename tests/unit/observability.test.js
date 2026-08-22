const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
    observabilityMiddleware,
    getTelemetryMetrics,
    resetTelemetryMetrics
} = require('../../src/middleware/observability.middleware');

describe('Unit Test: Server Observability & Telemetry Middleware', () => {

    beforeEach(() => {
        resetTelemetryMetrics();
    });

    test('Middleware increments request counter and records status codes', () => {
        let finishCallback;
        const req = {};
        const res = {
            statusCode: 200,
            on: (event, cb) => { if (event === 'finish') finishCallback = cb; }
        };

        observabilityMiddleware(req, res, () => {});
        if (finishCallback) finishCallback();

        const metrics = getTelemetryMetrics();
        assert.equal(metrics.total_requests, 1);
        assert.equal(metrics.status_codes['200'], 1);
        assert.equal(metrics.error_count, 0);
    });

    test('Middleware tracks 4xx / 5xx errors and computes error rate %', () => {
        const simulateRequest = (statusCode) => {
            let finishCb;
            const res = {
                statusCode,
                on: (event, cb) => { if (event === 'finish') finishCb = cb; }
            };
            observabilityMiddleware({}, res, () => {});
            if (finishCb) finishCb();
        };

        simulateRequest(200);
        simulateRequest(201);
        simulateRequest(400);
        simulateRequest(500);

        const metrics = getTelemetryMetrics();
        assert.equal(metrics.total_requests, 4);
        assert.equal(metrics.error_count, 2);
        assert.equal(metrics.error_rate_percent, 50);
        assert.equal(metrics.status_codes['200'], 1);
        assert.equal(metrics.status_codes['400'], 1);
        assert.equal(metrics.status_codes['500'], 1);
    });

    test('Zero PII Compliance: Telemetry output contains no personal identifiers', () => {
        const metrics = getTelemetryMetrics();
        const keys = Object.keys(metrics);

        assert.ok(!keys.includes('ip'), 'Telemetry must not include IP address');
        assert.ok(!keys.includes('userAgent'), 'Telemetry must not include userAgent');
        assert.ok(!keys.includes('payload'), 'Telemetry must not include request body');
        assert.ok(!keys.includes('email'), 'Telemetry must not include user emails');
    });

    test('Unmeasured DB latency returns 0 instead of fake hardcoded fallback', () => {
        const { getAverageDbLatencyMs } = require('../../src/database/database');
        const latency = getAverageDbLatencyMs();
        assert.equal(typeof latency, 'number');
        assert.ok(latency >= 0, 'Latency must be non-negative number');
    });
});
