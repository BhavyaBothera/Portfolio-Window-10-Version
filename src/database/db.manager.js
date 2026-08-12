const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '../../db');
const DB_FILE = path.join(DB_DIR, 'portfolio.db.json');

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
        console.error('Error loading database:', err.message);
    }
    
    const initialDb = {
        messages: [
            {
                id: 1,
                name: "Tech Innovations Lab",
                email: "recruiter@techinnovations.com",
                subject: "Senior Full-Stack Developer Opportunity",
                message: "Hi Bhavy, we were highly impressed by your Windows 10 Portfolio OS! We would love to chat about a senior full-stack engineering position.",
                created_at: new Date().toISOString()
            }
        ],
        leaderboard: [
            { id: 1, player: "Bhavy", game: "Minesweeper", score: 100, time_seconds: 42, created_at: new Date().toISOString() },
            { id: 2, player: "Alex", game: "Solitaire", score: 520, time_seconds: 180, created_at: new Date().toISOString() }
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
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving database:', err.message);
    }
}

module.exports = {
    db: dbData,
    saveDatabase
};
