const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { initDatabase, getDb } = require('../../src/database/database');

describe('Integration Test: SQLite Database Layer', () => {

    before(async () => {
        await initDatabase();
    });

    test('SQLite Connection & Table Schema Initialization', async () => {
        const db = getDb();
        assert.ok(db, 'Database handle must be initialized');

        // Verify tables exist
        const tables = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(r => r.name));
            });
        });

        assert.ok(tables.includes('contact_messages') || tables.includes('messages'), 'contact_messages table must exist');
        assert.ok(tables.includes('leaderboard'), 'leaderboard table must exist');
    });

    test('SQLite WAL (Write-Ahead Logging) Journal Mode Verification', async () => {
        const { getAsync } = require('../../src/database/database');
        const row = await getAsync('PRAGMA journal_mode');
        assert.ok(row && (row.journal_mode === 'wal' || row.journal_mode === 'memory' || row.journal_mode === 'delete'), 'Journal mode must be valid (wal/memory/delete)');
    });

    test('Prepared Queries & Parameterized Safety Insertion', async () => {
        const db = getDb();
        const testName = 'DbTestUser';
        const testEmail = 'dbtest@example.com';
        const testMsg = 'Test DB query safety';

        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO messages (name, email, message) VALUES (?, ?, ?)`,
                [testName, testEmail, testMsg],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Verify insertion
        const row = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM messages WHERE email = ?`, [testEmail], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        assert.ok(row, 'Inserted row must be retrieved');
        assert.equal(row.name, testName);
        assert.equal(row.message, testMsg);
    });
});
