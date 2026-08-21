/**
 * Zero-PII Server Observability & Telemetry Middleware
 * Tracks request volume, response latency, status codes, and error metrics safely.
 */

const telemetryStore = {
    totalRequests: 0,
    errorCount: 0,
    statusCodes: {},
    recentDurations: [] // Sliding window of last 100 request response times (ms)
};

function observabilityMiddleware(req, res, next) {
    const startTime = process.hrtime();

    res.on('finish', () => {
        const diff = process.hrtime(startTime);
        const durationMs = parseFloat(((diff[0] * 1e3) + (diff[1] * 1e-6)).toFixed(2));

        telemetryStore.totalRequests++;

        const codeStr = String(res.statusCode);
        telemetryStore.statusCodes[codeStr] = (telemetryStore.statusCodes[codeStr] || 0) + 1;

        if (res.statusCode >= 400) {
            telemetryStore.errorCount++;
        }

        telemetryStore.recentDurations.push(durationMs);
        if (telemetryStore.recentDurations.length > 100) {
            telemetryStore.recentDurations.shift();
        }
    });

    next();
}

function getTelemetryMetrics() {
    const durations = telemetryStore.recentDurations;
    const avgLatency = durations.length > 0
        ? parseFloat((durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2))
        : 0;

    const errorRatePercent = telemetryStore.totalRequests > 0
        ? parseFloat(((telemetryStore.errorCount / telemetryStore.totalRequests) * 100).toFixed(1))
        : 0;

    return {
        total_requests: telemetryStore.totalRequests,
        error_count: telemetryStore.errorCount,
        error_rate_percent: errorRatePercent,
        avg_api_latency_ms: avgLatency,
        status_codes: { ...telemetryStore.statusCodes }
    };
}

function resetTelemetryMetrics() {
    telemetryStore.totalRequests = 0;
    telemetryStore.errorCount = 0;
    telemetryStore.statusCodes = {};
    telemetryStore.recentDurations = [];
}

module.exports = {
    observabilityMiddleware,
    getTelemetryMetrics,
    resetTelemetryMetrics
};
