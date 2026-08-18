/**
 * Lightweight Zero-Dependency Rate Limiter Middleware
 * Tracks request counts per client IP within a sliding window.
 * 
 * NOTE: In-memory rate limiting is intended for single-instance deployments.
 * For multi-process / distributed cluster deployments, a shared store (e.g. Redis) should be used.
 */
function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 60 * 1000; // 1 minute window
    const maxRequests = options.maxRequests || 5;    // 5 requests per window
    const ipHits = new Map();

    // Clean up expired IP entries every 2 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [ip, record] of ipHits.entries()) {
            if (now - record.startTime > windowMs) {
                ipHits.delete(ip);
            }
        }
    }, 2 * 60 * 1000);

    return function rateLimiter(req, res, next) {
        // Use Express req.ip (properly configured via app.set('trust proxy', 1))
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown-ip';
        const now = Date.now();

        let record = ipHits.get(clientIp);

        if (!record || (now - record.startTime > windowMs)) {
            record = { count: 1, startTime: now };
            ipHits.set(clientIp, record);
        } else {
            record.count += 1;
        }

        if (record.count > maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests. Please wait a minute before submitting again.'
            });
        }

        next();
    };
}

module.exports = {
    createRateLimiter
};
