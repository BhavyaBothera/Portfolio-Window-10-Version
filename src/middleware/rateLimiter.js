/**
 * Lightweight Zero-Dependency Rate Limiter Middleware
 * Tracks request counts per IP within a sliding window.
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
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
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
