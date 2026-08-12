const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contact.controller');
const systemController = require('../controllers/system.controller');
const leaderboardController = require('../controllers/leaderboard.controller');

// Contact API
router.post('/contact', contactController.submitContactMessage);
router.get('/messages', contactController.getContactMessages);

// System Telemetry & Utilities
router.get('/system/stats', systemController.getSystemStats);
router.get('/notes', systemController.getNotes);
router.post('/notes', systemController.saveNotes);
router.get('/vfs', systemController.getVFS);
router.post('/vfs', systemController.saveVFS);

// Game Leaderboard API
router.get('/leaderboard/:game', leaderboardController.getLeaderboard);
router.post('/leaderboard', leaderboardController.submitHighScore);

module.exports = router;
