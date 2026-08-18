const crypto = require('crypto');
const { runAsync, allAsync } = require('../database/database');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.submitContactMessage = async (req, res, next) => {
    try {
        let { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, error: 'Missing required fields (name, email, message).' });
        }

        name = String(name).trim();
        email = String(email).trim();
        subject = subject ? String(subject).trim() : 'Portfolio Contact Inquiry';
        message = String(message).trim();

        // Length validation
        if (name.length > 100) {
            return res.status(400).json({ success: false, error: 'Name must not exceed 100 characters.' });
        }
        if (subject.length > 200) {
            return res.status(400).json({ success: false, error: 'Subject must not exceed 200 characters.' });
        }
        if (message.length > 2000) {
            return res.status(400).json({ success: false, error: 'Message must not exceed 2000 characters.' });
        }

        // Email format validation
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
        }

        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // Store clean validated raw strings in database (output rendering performs HTML escaping)
        await runAsync(
            `INSERT INTO contact_messages (id, name, email, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, name, email, subject, message, createdAt]
        );

        console.log(`[API Contact] Saved message from ${name} (${email}): "${subject}"`);
        return res.status(201).json({
            success: true,
            message: 'Message delivered and saved to portfolio database successfully!',
            data: { id, name, email, subject, message, created_at: createdAt }
        });
    } catch (err) {
        next(err);
    }
};

exports.getContactMessages = async (req, res, next) => {
    try {
        const rows = await allAsync(`SELECT id, name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC`);
        return res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
        next(err);
    }
};
