const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const config = require('./src/config/env');
const apiRoutes = require('./src/routes/api.routes');
const errorHandler = require('./src/middleware/errorHandler');
const notFoundHandler = require('./src/middleware/notFound');

const { initDatabase } = require('./src/database/database');

const app = express();

// Enable reverse proxy trust for accurate client IP rate limiting
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                connectSrc: ["'self'"],
                frameSrc: ["'self'", "https:"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: []
            }
        },
        crossOriginEmbedderPolicy: false
    })
);

// CORS Configuration
app.use(cors({ origin: config.corsOrigin }));

// Payload Body Limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Serve static frontend assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// Catch-all fallback route serving index.html for SPA/Desktop shell
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 & Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Asynchronous Server Startup (Ensures SQLite schema initialization completes before listening)
async function startServer() {
    try {
        await initDatabase();
        app.listen(config.port, () => {
            console.log(`\n==================================================`);
            console.log(`🚀 Windows 10 Full-Stack Portfolio Server Active`);
            console.log(`🌐 Environment: ${config.env}`);
            console.log(`🌐 Server Port: ${config.port}`);
            console.log(`📂 Serving Public Shell: http://localhost:${config.port}`);
            console.log(`==================================================\n`);
        });
    } catch (err) {
        console.error('Failed to initialize database and start server:', err);
        process.exit(1);
    }
}

startServer();

module.exports = app;

