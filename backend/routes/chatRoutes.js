// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { handleChat, getHistory, clearHistory } = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

// POST /api/chat - Process chat message
router.post('/', authenticate, handleChat);
// GET /api/chat/history/:studentId - Get chat history
router.get('/history/:studentId', authenticate, getHistory);
// DELETE /api/chat/clear/:studentId - Clear chat history
router.delete('/clear/:studentId', authenticate, clearHistory);

module.exports = router;
