const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// ==========================================================================
// ZERO-CONFIG EMBEDDED DATABASE MODULE (JSON / SQLite File Persister)
// ==========================================================================
const DB_FILE = path.join(__dirname, 'portfolio.db.json');

function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error('Error loading database:', err.message);
    }
    return {
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
}

const db = loadDatabase();

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving database:', err.message);
    }
}

// ==========================================================================
// REST API ENDPOINTS
// ==========================================================================

// 1. Contact / Mail API
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'Missing required fields (name, email, message).' });
    }

    const newMsg = {
        id: Date.now(),
        name,
        email,
        subject: subject || 'Portfolio Contact Inquiry',
        message,
        created_at: new Date().toISOString()
    };

    db.messages.unshift(newMsg);
    saveDatabase();

    console.log(`[API] New Message from ${name} (${email}): "${subject}"`);
    return res.status(201).json({
        success: true,
        message: 'Message delivered and saved to portfolio database successfully!',
        data: newMsg
    });
});

app.get('/api/messages', (req, res) => {
    return res.json({ success: true, count: db.messages.length, data: db.messages });
});

// 2. Real-Time System Telemetry API (Task Manager)
app.get('/api/system/stats', (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const cpuLoad = Math.floor(10 + Math.random() * 25); // Simulated active CPU load

    return res.json({
        success: true,
        cpu: {
            percent: cpuLoad,
            cores: os.cpus().length,
            model: os.cpus()[0]?.model || 'Intel(R) Core(TM) i9-13900H'
        },
        memory: {
            total_gb: (totalMem / 1073741824).toFixed(1),
            used_gb: (usedMem / 1073741824).toFixed(1),
            free_gb: (freeMem / 1073741824).toFixed(1),
            percent: ramPercent
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            hostname: os.hostname(),
            uptime_seconds: Math.floor(os.uptime())
        }
    });
});

// 3. Game Leaderboards API
app.get('/api/leaderboard/:game', (req, res) => {
    const game = req.params.game;
    const scores = db.leaderboard.filter(item => item.game.toLowerCase() === game.toLowerCase());
    return res.json({ success: true, game, data: scores });
});

app.post('/api/leaderboard', (req, res) => {
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
});

// 4. Sticky Notes Sync API
app.get('/api/notes', (req, res) => {
    return res.json({ success: true, data: db.notes });
});

app.post('/api/notes', (req, res) => {
    const { text, color } = req.body;
    if (text !== undefined) db.notes.text = text;
    if (color !== undefined) db.notes.color = color;
    saveDatabase();
    return res.json({ success: true, message: 'Sticky note synced to database.', data: db.notes });
});

// 5. Virtual File System Persistence API
app.get('/api/vfs', (req, res) => {
    return res.json({ success: true, data: db.vfs });
});

app.post('/api/vfs', (req, res) => {
    const { fileName, content } = req.body;
    if (!fileName) return res.status(400).json({ success: false, error: 'Missing fileName' });
    db.vfs[fileName] = content || '';
    saveDatabase();
    return res.json({ success: true, message: `File ${fileName} saved to backend VFS.` });
});

// Fallback route: Serve index.html for root requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Windows 10 Portfolio OS Server active on port ${PORT}`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});
