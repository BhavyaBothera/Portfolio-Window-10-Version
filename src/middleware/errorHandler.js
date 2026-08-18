const config = require('../config/env');

function errorHandler(err, req, res, next) {
    console.error(`[Error Handler] ${req.method} ${req.url}:`, err.message || err);

    const statusCode = err.status || err.statusCode || 500;
    
    // Suppress detailed stack traces in production
    const response = {
        success: false,
        error: statusCode === 500 ? 'Internal server error occurred.' : err.message
    };

    if (config.env === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

module.exports = errorHandler;
