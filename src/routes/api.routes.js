const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contact.controller');
const systemController = require('../controllers/system.controller');
const leaderboardController = require('../controllers/leaderboard.controller');

const { requireAdminAuth } = require('../middleware/auth.middleware');
const { createRateLimiter } = require('../middleware/rateLimiter');

// Rate limiters for public write endpoints
const contactRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 5 });
const leaderboardRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 10 });
const adminWriteRateLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20 });

// Contact API
router.post('/contact', contactRateLimiter, contactController.submitContactMessage);
router.get('/messages', requireAdminAuth, contactController.getContactMessages);

// System Telemetry & Utilities
router.get('/system/stats', systemController.getSystemStats);
router.get('/notes', systemController.getNotes);
router.post('/notes', requireAdminAuth, adminWriteRateLimiter, systemController.saveNotes);
router.get('/vfs', systemController.getVFS);
router.post('/vfs', requireAdminAuth, adminWriteRateLimiter, systemController.saveVFS);

// Game Leaderboard API
router.get('/leaderboard/:game', leaderboardController.getLeaderboard);
router.post('/leaderboard', leaderboardRateLimiter, leaderboardController.submitHighScore);

module.exports = router;
