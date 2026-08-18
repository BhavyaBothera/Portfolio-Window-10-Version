const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '../../db');
const DB_FILE = path.join(DB_DIR, 'portfolio.db.json');
const TEMP_FILE = path.join(DB_DIR, 'portfolio.db.json.tmp');
const BAK_FILE = path.join(DB_DIR, 'portfolio.db.json.bak');

function ensureDbDir() {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
}

function loadDatabase() {
    ensureDbDir();
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Error loading primary database file:', err.message);
        if (fs.existsSync(BAK_FILE)) {
            try {
                console.log('Attempting to recover database from backup file...');
                const rawBak = fs.readFileSync(BAK_FILE, 'utf8');
                return JSON.parse(rawBak);
            } catch (bakErr) {
                console.error('Error loading backup database file:', bakErr.message);
            }
        }
    }
    
    const initialDb = {
        messages: [
            {
                id: crypto.randomUUID(),
                name: "Tech Innovations Lab",
                email: "recruiter@techinnovations.com",
                subject: "Senior Full-Stack Developer Opportunity",
                message: "Hi Bhavy, we were highly impressed by your Windows 10 Portfolio OS! We would love to chat about a senior full-stack engineering position.",
                created_at: new Date().toISOString()
            }
        ],
        leaderboard: [
            { id: crypto.randomUUID(), player: "Bhavy", game: "Minesweeper", score: 100, time_seconds: 42, created_at: new Date().toISOString() },
            { id: crypto.randomUUID(), player: "Alex", game: "Solitaire", score: 520, time_seconds: 180, created_at: new Date().toISOString() }
        ],
        notes: {
            text: "WELCOME TO BHAVY'S WINDOWS 10 PORTFOLIO OS!\n==================================================\n\n- Backend REST API powered by Node.js & Express\n- Real-time server telemetry connected to Task Manager\n- Messages & Leaderboards saved directly in database",
            color: "yellow"
        },
        vfs: {
            "Welcome.txt": "Welcome to Windows 10 Portfolio OS!\nFull-Stack REST API & Database Connected."
        }
    };

    saveDatabase(initialDb);
    return initialDb;
}

const dbData = loadDatabase();

function saveDatabase(data = dbData) {
    ensureDbDir();
    try {
        const payload = JSON.stringify(data, null, 2);

        // Keep a backup copy of current valid file before overwriting
        if (fs.existsSync(DB_FILE)) {
            try {
                fs.copyFileSync(DB_FILE, BAK_FILE);
            } catch (bakErr) {
                console.error('Warning: Failed to create database backup:', bakErr.message);
            }
        }

        // Atomic write via temp file rename
        fs.writeFileSync(TEMP_FILE, payload, 'utf8');
        fs.renameSync(TEMP_FILE, DB_FILE);
    } catch (err) {
        console.error('Error saving database atomically:', err.message);
    }
}

module.exports = {
    db: dbData,
    saveDatabase
};

