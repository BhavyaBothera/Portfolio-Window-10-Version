const crypto = require('crypto');
const { runAsync, allAsync } = require('../database/database');

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

        return res.json({
            success: true,
            game,
            meta: { description: 'Validated client-submitted scores' },
            data: scores
        });
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

        // Strict Finite Number & Bounds Validation
        if (!Number.isFinite(parsedScore) || !Number.isFinite(parsedTime)) {
            return res.status(400).json({ success: false, error: 'Score and time must be valid numbers.' });
        }

        // Game-Specific Server-Side Plausibility Rules
        if (game === 'minesweeper') {
            if (parsedScore <= 0 || parsedScore > 200) {
                return res.status(400).json({ success: false, error: 'Minesweeper score must be between 1 and 200.' });
            }
            if (parsedTime < 2 || parsedTime > 3600) {
                return res.status(400).json({ success: false, error: 'Minesweeper completion time must be between 2 and 3600 seconds.' });
            }
        } else if (game === 'solitaire') {
            if (parsedScore <= 0 || parsedScore > 1000) {
                return res.status(400).json({ success: false, error: 'Solitaire score must be between 1 and 1000.' });
            }
            if (parsedTime < 10 || parsedTime > 7200) {
                return res.status(400).json({ success: false, error: 'Solitaire completion time must be between 10 and 7200 seconds.' });
            }
        } else {
            if (parsedScore < 0 || parsedScore > 100000 || parsedTime < 2 || parsedTime > 86400) {
                return res.status(400).json({ success: false, error: 'Invalid score or completion time bounds.' });
            }
        }

        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        await runAsync(
            `INSERT INTO leaderboard (id, player, game, score, time_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, player, game, parsedScore, parsedTime, createdAt]
        );

        return res.status(201).json({
            success: true,
            message: 'High score recorded!',
            data: { id, player, game, score: parsedScore, time_seconds: parsedTime, created_at: createdAt }
        });
    } catch (err) {
        next(err);
    }
};
