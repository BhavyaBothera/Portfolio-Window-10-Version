const { db, saveDatabase } = require('../database/db.manager');

exports.getLeaderboard = (req, res) => {
    const game = req.params.game;
    const scores = db.leaderboard.filter(item => item.game.toLowerCase() === game.toLowerCase());
    return res.json({ success: true, game, data: scores });
};

exports.submitHighScore = (req, res) => {
    const { player, game, score, time_seconds } = req.body;
    if (!game || score === undefined) {
        return res.status(400).json({ success: false, error: 'Missing game or score.' });
    }

    const entry = {
        id: Date.now(),
        player: player || 'Guest Explorer',
        game,
        score: Number(score),
        time_seconds: Number(time_seconds || 0),
        created_at: new Date().toISOString()
    };

    db.leaderboard.push(entry);
    saveDatabase();

    return res.status(201).json({ success: true, message: 'High score recorded!', data: entry });
};
