const crypto = require('crypto');
const { runAsync, allAsync } = require('../database/database');

function sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

const ALLOWED_GAMES = ['minesweeper', 'solitaire'];

exports.getLeaderboard = async (req, res, next) => {
    try {
        const game = req.params.game ? String(req.params.game).toLowerCase().trim() : '';
        if (!ALLOWED_GAMES.includes(game)) {
            return res.status(400).json({ success: false, error: 'Invalid game name.' });
        }

        const scores = await allAsync(
            `SELECT id, player, game, score, time_seconds, created_at FROM leaderboard WHERE LOWER(game) = ? ORDER BY score DESC, time_seconds ASC LIMIT 50`,
            [game]
        );

        return res.json({ success: true, game, data: scores });
    } catch (err) {
        next(err);
    }
};

exports.submitHighScore = async (req, res, next) => {
    try {
        let { player, game, score, time_seconds } = req.body;

        if (!game || score === undefined) {
            return res.status(400).json({ success: false, error: 'Missing game or score.' });
        }

        game = String(game).toLowerCase().trim();
        if (!ALLOWED_GAMES.includes(game)) {
            return res.status(400).json({ success: false, error: 'Invalid game name.' });
        }

        player = player ? String(player).trim() : 'Guest Explorer';
        if (player.length > 50) {
            return res.status(400).json({ success: false, error: 'Player name must not exceed 50 characters.' });
        }

        const parsedScore = Number(score);
        const parsedTime = Number(time_seconds || 0);

        // Strict Finite Number Validation
        if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 100000) {
            return res.status(400).json({ success: false, error: 'Score must be a valid finite number within allowable bounds.' });
        }

        if (!Number.isFinite(parsedTime) || parsedTime < 2 || parsedTime > 86400) {
            return res.status(400).json({ success: false, error: 'Game time must be a valid finite number of at least 2 seconds.' });
        }

        const id = crypto.randomUUID();
        const sPlayer = sanitizeInput(player);
        const createdAt = new Date().toISOString();

        await runAsync(
            `INSERT INTO leaderboard (id, player, game, score, time_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, sPlayer, game, parsedScore, parsedTime, createdAt]
        );

        return res.status(201).json({
            success: true,
            message: 'High score recorded!',
            data: { id, player: sPlayer, game, score: parsedScore, time_seconds: parsedTime, created_at: createdAt }
        });
    } catch (err) {
        next(err);
    }
};
