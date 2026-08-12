const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./src/routes/api.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// Catch-all fallback route serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Windows 10 Full-Stack Portfolio Server Active`);
    console.log(`🌐 Server Port: ${PORT}`);
    console.log(`📂 Serving Public Shell: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});
