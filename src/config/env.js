const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    adminToken: process.env.ADMIN_TOKEN || 'bhavy-admin-secret-key-2026',
    dbPath: process.env.DB_PATH || path.join(__dirname, '../../db/portfolio.sqlite'),
    corsOrigin: process.env.CORS_ORIGIN || '*'
};

module.exports = config;
