const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const envToken = process.env.ADMIN_TOKEN;

if (!envToken && isProduction) {
    throw new Error('CRITICAL SECURITY ERROR: ADMIN_TOKEN environment variable must be configured in production mode.');
}

// In development, generate a dynamic random fallback per server process start if not provided
const devFallbackToken = envToken || crypto.randomBytes(16).toString('hex');

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    adminToken: devFallbackToken,
    dbPath: process.env.DB_PATH || path.join(__dirname, '../../db/portfolio.sqlite'),
    corsOrigin: process.env.CORS_ORIGIN || '*'
};

module.exports = config;
