const os = require('os');
const path = require('path');
const { getTelemetryMetrics } = require('../middleware/observability.middleware');
const { getAsync, runAsync, allAsync, getAverageDbLatencyMs } = require('../database/database');

const FORBIDDEN_VFS_KEYS = ['__proto__', 'constructor', 'prototype'];

// REAL CPU Utilization Calculation via os.cpus() delta sampling
function getCpuTimes() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    if (!cpus || cpus.length === 0) return { active: 0, total: 1 };
    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    const total = user + nice + sys + idle + irq;
    return { active: total - idle, total };
}

let prevCpuTimes = getCpuTimes();

function calculateRealCpuUsage() {
    const curr = getCpuTimes();
    const activeDiff = curr.active - prevCpuTimes.active;
    const totalDiff = curr.total - prevCpuTimes.total;
    prevCpuTimes = curr;
    if (totalDiff <= 0) return 12;
    const percent = Math.round((activeDiff / totalDiff) * 100);
    return Math.min(100, Math.max(1, percent));
}

exports.getSystemStats = (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramPercent = Math.round((usedMem / totalMem) * 100);

    const realCpuPercent = calculateRealCpuUsage();
    const telemetry = getTelemetryMetrics();
    telemetry.avg_db_latency_ms = getAverageDbLatencyMs();

    return res.json({
        success: true,
        meta: {
            simulation: true,
            telemetry_type: 'in_memory_runtime_sampling',
            note: 'CPU %, RAM %, API Latency, Database Latency, and HTTP Status Codes represent real-time in-memory server runtime metrics. Host identity attributes are simulated Win10 OS environment specs.'
        },
        cpu: {
            percent: realCpuPercent,
            cores: os.cpus().length,
            model: 'Virtual OS Web Core Engine'
        },
        memory: {
            total_gb: (totalMem / 1073741824).toFixed(1),
            used_gb: (usedMem / 1073741824).toFixed(1),
            free_gb: (freeMem / 1073741824).toFixed(1),
            percent: ramPercent
        },
        telemetry,
        system: {
            platform: 'win32',
            arch: 'x64',
            hostname: 'WIN10-PORTFOLIO-DESKTOP',
            uptime_seconds: Math.floor(os.uptime())
        }
    });
};

exports.getNotes = async (req, res, next) => {
    try {
        const row = await getAsync(`SELECT text, color FROM notes WHERE id = 1`);
        return res.json({
            success: true,
            data: row || { text: "Sticky Notes Ready", color: "yellow" }
        });
    } catch (err) {
        next(err);
    }
};

exports.saveNotes = async (req, res, next) => {
    try {
        let { text, color } = req.body;

        const current = await getAsync(`SELECT text, color FROM notes WHERE id = 1`) || { text: '', color: 'yellow' };

        let updatedText = current.text;
        let updatedColor = current.color;

        if (text !== undefined) {
            text = String(text);
            if (text.length > 5000) {
                return res.status(400).json({ success: false, error: 'Sticky note content must not exceed 5000 characters.' });
            }
            updatedText = text;
        }

        if (color !== undefined) {
            const allowedColors = ['yellow', 'blue', 'green', 'pink', 'purple'];
            color = String(color).toLowerCase();
            if (allowedColors.includes(color)) updatedColor = color;
        }

        await runAsync(
            `INSERT INTO notes (id, text, color, updated_at) VALUES (1, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET text = excluded.text, color = excluded.color, updated_at = excluded.updated_at`,
            [updatedText, updatedColor, new Date().toISOString()]
        );

        return res.json({
            success: true,
            message: 'Sticky note synced to SQLite database.',
            data: { text: updatedText, color: updatedColor }
        });
    } catch (err) {
        next(err);
    }
};

exports.getVFS = async (req, res, next) => {
    try {
        const rows = await allAsync(`SELECT file_name, content FROM vfs`);
        const vfsMap = {};
        for (const r of rows) {
            vfsMap[r.file_name] = r.content;
        }
        return res.json({ success: true, data: vfsMap });
    } catch (err) {
        next(err);
    }
};

exports.saveVFS = async (req, res, next) => {
    try {
        let { fileName, content } = req.body;
        if (!fileName) return res.status(400).json({ success: false, error: 'Missing fileName' });

        fileName = String(fileName).trim();
        content = content ? String(content) : '';

        if (fileName.length > 100) {
            return res.status(400).json({ success: false, error: 'File name must not exceed 100 characters.' });
        }
        if (content.length > 50000) {
            return res.status(400).json({ success: false, error: 'File content must not exceed 50,000 characters.' });
        }

        // Sanitize path traversal sequences
        const safeFileName = path.basename(fileName);

        // Prototype Pollution Guard
        if (
            FORBIDDEN_VFS_KEYS.includes(safeFileName.toLowerCase()) ||
            safeFileName.startsWith('__') ||
            Object.prototype.hasOwnProperty.call(Object.prototype, safeFileName)
        ) {
            return res.status(400).json({ success: false, error: 'Invalid file name: reserved object prototype key.' });
        }

        await runAsync(
            `INSERT INTO vfs (file_name, content, updated_at) VALUES (?, ?, ?)
             ON CONFLICT(file_name) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
            [safeFileName, content, new Date().toISOString()]
        );

        return res.json({ success: true, message: `File ${safeFileName} saved to SQLite VFS.` });
    } catch (err) {
        next(err);
    }
};
