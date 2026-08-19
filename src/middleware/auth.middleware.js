const config = require('../config/env');

function requireAdminAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const customHeader = req.headers['x-admin-token'];

    let providedToken = null;

    if (customHeader) {
        providedToken = customHeader;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
        providedToken = authHeader.substring(7);
    }

    if (!providedToken || providedToken !== config.adminToken) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Admin authentication token required to access this endpoint.'
        });
    }

    next();
}

function optionalPublicReadAuth(req, res, next) {
    if (config.restrictPublicRead) {
        return requireAdminAuth(req, res, next);
    }
    next();
}

module.exports = {
    requireAdminAuth,
    optionalPublicReadAuth
};
