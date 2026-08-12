const os = require('os');
const { db, saveDatabase } = require('../database/db.manager');

exports.getSystemStats = (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);
    const cpuLoad = Math.floor(10 + Math.random() * 25);

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
};

exports.getNotes = (req, res) => {
    return res.json({ success: true, data: db.notes });
};

exports.saveNotes = (req, res) => {
    const { text, color } = req.body;
    if (text !== undefined) db.notes.text = text;
    if (color !== undefined) db.notes.color = color;
    saveDatabase();
    return res.json({ success: true, message: 'Sticky note synced to database.', data: db.notes });
};

exports.getVFS = (req, res) => {
    return res.json({ success: true, data: db.vfs });
};

exports.saveVFS = (req, res) => {
    const { fileName, content } = req.body;
    if (!fileName) return res.status(400).json({ success: false, error: 'Missing fileName' });
    db.vfs[fileName] = content || '';
    saveDatabase();
    return res.json({ success: true, message: `File ${fileName} saved to backend VFS.` });
};
