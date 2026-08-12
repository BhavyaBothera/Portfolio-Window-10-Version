const { db, saveDatabase } = require('../database/db.manager');

exports.submitContactMessage = (req, res) => {
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

    console.log(`[API Contact] New Message from ${name} (${email}): "${subject}"`);
    return res.status(201).json({
        success: true,
        message: 'Message delivered and saved to portfolio database successfully!',
        data: newMsg
    });
};

exports.getContactMessages = (req, res) => {
    return res.json({ success: true, count: db.messages.length, data: db.messages });
};
