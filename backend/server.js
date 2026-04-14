// server.js - Main Express server entry point
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://127.0.0.1:5500', 'http://localhost:5500', 'null'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/students',      require('./routes/studentRoutes'));
app.use('/api/assessments',   require('./routes/assessmentRoutes'));
app.use('/api/appointments',  require('./routes/appointmentRoutes'));
app.use('/api/resources',     require('./routes/resourceRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/chat',          require('./routes/chatRoutes'));
app.use('/api/crisis',        require('./routes/crisisRoutes'));
app.use('/api/session-notes', require('./routes/sessionNoteRoutes'));
app.use('/api/colleges',      require('./routes/collegeRoutes'));
app.use('/api/notifications',  require('./routes/notificationRoutes'));

// ── Health Check ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Mental Health Support System API is running.' });
});

// ── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
});
