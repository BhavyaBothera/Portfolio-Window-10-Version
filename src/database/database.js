const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const config = require('../config/env');

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(config.dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log(` Connected to SQLite database at: ${config.dbPath}`);
    }
});

// Enable foreign keys & WAL mode for performance
db.run('PRAGMA foreign_keys = ON');

const dbDurations = [];

function recordDbLatency(startTime) {
    const diff = process.hrtime(startTime);
    const durationMs = parseFloat(((diff[0] * 1e3) + (diff[1] * 1e-6)).toFixed(2));
    dbDurations.push(durationMs);
    if (dbDurations.length > 100) dbDurations.shift();
}

function getAverageDbLatencyMs() {
    if (dbDurations.length === 0) return 0.5;
    const sum = dbDurations.reduce((acc, d) => acc + d, 0);
    return parseFloat((sum / dbDurations.length).toFixed(2));
}

function runAsync(sql, params = []) {
    const startTime = process.hrtime();
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            recordDbLatency(startTime);
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function getAsync(sql, params = []) {
    const startTime = process.hrtime();
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            recordDbLatency(startTime);
            if (err) return reject(err);
            resolve(row);
        });
    });
}

function allAsync(sql, params = []) {
    const startTime = process.hrtime();
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            recordDbLatency(startTime);
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

async function initDatabase() {
    try {
        await runAsync(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        `);

        await runAsync(`
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                text TEXT NOT NULL,
                color TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        `);

        await runAsync(`
            CREATE TABLE IF NOT EXISTS leaderboard (
                id TEXT PRIMARY KEY,
                player TEXT NOT NULL,
                game TEXT NOT NULL,
                score INTEGER NOT NULL,
                time_seconds INTEGER NOT NULL,
                created_at TEXT NOT NULL
            );
        `);

        await runAsync(`
            CREATE TABLE IF NOT EXISTS vfs (
                file_name TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        `);

        // Index for leaderboard lookups by game
        await runAsync(`
            CREATE INDEX IF NOT EXISTS idx_leaderboard_game ON leaderboard(game);
        `);

        // Seed initial data if tables are empty
        const noteCount = await getAsync(`SELECT COUNT(*) as count FROM notes`);
        if (noteCount.count === 0) {
            await runAsync(
                `INSERT INTO notes (id, text, color, updated_at) VALUES (1, ?, ?, ?)`,
                [
                    "WELCOME TO BHAVY'S WINDOWS 10 PORTFOLIO OS!\n==================================================\n\n- Backend powered by Node.js, Express & SQLite3\n- Real-time CPU telemetry sampling\n- Secure REST APIs with rate limiting & input sanitization",
                    "yellow",
                    new Date().toISOString()
                ]
            );
        }

        const msgCount = await getAsync(`SELECT COUNT(*) as count FROM contact_messages`);
        if (msgCount.count === 0) {
            await runAsync(
                `INSERT INTO contact_messages (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    crypto.randomUUID(),
                    "Tech Innovations Lab",
                    "recruiter@techinnovations.com",
                    "Senior Full-Stack Developer Opportunity",
                    "Hi Bhavy, we were highly impressed by your Windows 10 Portfolio OS! We would love to chat about an engineering position.",
                    new Date().toISOString()
                ]
            );
        }

        const lbCount = await getAsync(`SELECT COUNT(*) as count FROM leaderboard`);
        if (lbCount.count === 0) {
            await runAsync(
                `INSERT INTO leaderboard (id, player, game, score, time_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [crypto.randomUUID(), "Bhavy", "minesweeper", 100, 42, new Date().toISOString()]
            );
            await runAsync(
                `INSERT INTO leaderboard (id, player, game, score, time_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
                [crypto.randomUUID(), "Alex", "solitaire", 520, 180, new Date().toISOString()]
            );
        }

        const vfsCount = await getAsync(`SELECT COUNT(*) as count FROM vfs`);
        if (vfsCount.count === 0) {
            await runAsync(
                `INSERT INTO vfs (file_name, content, updated_at) VALUES (?, ?, ?)`,
                [
                    "Welcome.txt",
                    "Welcome to Windows 10 Portfolio OS!\nFull-Stack REST API & SQLite Database Connected.",
                    new Date().toISOString()
                ]
            );
        }

        console.log('⚡ SQLite Database schema & seed data initialized successfully.');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

module.exports = {
    db,
    initDatabase,
    runAsync,
    getAsync,
    allAsync,
    getAverageDbLatencyMs
};

