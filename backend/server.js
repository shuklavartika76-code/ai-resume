
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./utils/db');
const interviewRoutes = require('./routes/interview');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from any origin during development
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/interview', interviewRoutes);

app.get('/health', (req, res) => {
<<<<<<< HEAD
    res.json({
        status: 'OK',
        message: 'Backend is running'
=======
    res.json({ status: 'OK', message: 'Backend is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`\n✅ Server running on http://localhost:${PORT}`);
        console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE' ? '✅ Set' : '⚠️  Not set (using fallback data)'}\n`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n❌ Port ${PORT} is already in use. Kill the process and restart.\n`);
        } else {
            console.error('Server error:', err);
        }
        process.exit(1);
>>>>>>> a109ce1 (Fix backend for Vercel deployment)
    });
});

// Local development
if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error('Database connection error:', err.message);
            process.exit(1);
        });
}

module.exports = app;
