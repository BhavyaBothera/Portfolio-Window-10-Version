const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const config = require('./src/config/env');
const apiRoutes = require('./src/routes/api.routes');
const errorHandler = require('./src/middleware/errorHandler');
const notFoundHandler = require('./src/middleware/notFound');
const { observabilityMiddleware } = require('./src/middleware/observability.middleware');

const { initDatabase } = require('./src/database/database');

const app = express();

// Mount Zero-PII Server Observability Middleware
app.use(observabilityMiddleware);

// Enable reverse proxy trust for accurate client IP rate limiting
app.set('trust proxy', 1);

// Security Headers via Helmet
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
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

const fs = require('fs');

// Static Frontend Asset Directory Resolution (Production dist/ vs Development public/)
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');
const staticDir = fs.existsSync(path.join(distDir, 'index.html')) ? distDir : publicDir;

app.use(express.static(staticDir));

// Mount API routes
app.use('/api', apiRoutes);

// Catch-all fallback route serving index.html for SPA/Desktop shell
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
});

// 404 & Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

let activeServer = null;

// Asynchronous Server Startup (Ensures SQLite schema initialization completes before listening)
async function startServer(port = config.port) {
    try {
        await initDatabase();
        return new Promise((resolve, reject) => {
            activeServer = app.listen(port, () => {
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`\n==================================================`);
                    console.log(`🚀 Windows 10 Full-Stack Portfolio Server Active`);
                    console.log(`🌐 Environment: ${config.env}`);
                    console.log(`🌐 Server Port: ${port}`);
                    console.log(`📂 Serving Public Shell: http://localhost:${port}`);
                    console.log(`==================================================\n`);
                }
                resolve(activeServer);
            });
            activeServer.on('error', reject);
        });
    } catch (err) {
        console.error('Failed to initialize database and start server:', err);
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
        throw err;
    }
}

async function stopServer() {
    if (activeServer) {
        return new Promise((resolve) => activeServer.close(resolve));
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.stopServer = stopServer;


