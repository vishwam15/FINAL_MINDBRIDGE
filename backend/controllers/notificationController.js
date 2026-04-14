const db = require('../config/db');

// Internal helper to create a notification
const createNotification = async (userId, userRole, message, type = 'system') => {
    try {
        await db.query(
            'INSERT INTO notification (user_id, user_role, message, type) VALUES (?, ?, ?, ?)',
            [userId, userRole, message, type]
        );
        return true;
    } catch (err) {
        console.error('Error creating notification:', err);
        return false;
    }
};

// GET /api/notifications - Fetch notifications for the logged-in user
const getNotifications = async (req, res) => {
    try {
        const { id, role } = req.user; // Assuming auth middleware provides this
        const [rows] = await db.query(
            'SELECT * FROM notification WHERE user_id = ? AND user_role = ? ORDER BY created_at DESC LIMIT 50',
            [id, role]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getNotifications error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
    }
};

// PUT /api/notifications/:id/read - Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const [result] = await db.query(
            'UPDATE notification SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
            [id, userId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }
        res.json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
        console.error('markAsRead error:', err);
        res.status(500).json({ success: false, message: 'Failed to update notification.' });
    }
};

module.exports = { createNotification, getNotifications, markAsRead };
