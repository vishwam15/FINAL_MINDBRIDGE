// controllers/resourceController.js - Self-help resources
const db = require('../config/db');

// GET /api/resources - Get all resources
const getAllResources = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM self_help_resource ORDER BY resource_id');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch resources.' });
    }
};

// POST /api/resources - Add a resource (admin)
const addResource = async (req, res) => {
    try {
        const { title, type, description } = req.body;
        if (!title || !type) {
            return res.status(400).json({ success: false, message: 'Title and type are required.' });
        }
        const [result] = await db.query(
            'INSERT INTO self_help_resource (title, type, description) VALUES (?, ?, ?)',
            [title, type, description || '']
        );
        res.status(201).json({ success: true, message: 'Resource added.', data: { resource_id: result.insertId } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to add resource.' });
    }
};

// PUT /api/resources/:id - Update a resource (admin)
const updateResource = async (req, res) => {
    try {
        const { title, type, description } = req.body;
        await db.query(
            'UPDATE self_help_resource SET title=?, type=?, description=? WHERE resource_id=?',
            [title, type, description, req.params.id]
        );
        res.json({ success: true, message: 'Resource updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update resource.' });
    }
};

// DELETE /api/resources/:id - Delete a resource (admin)
const deleteResource = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM self_help_resource WHERE resource_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Resource not found.' });
        res.json({ success: true, message: 'Resource deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to delete resource.' });
    }
};

// GET /api/resources/counselors - Get all counselors (for appointment booking)
const getCounselors = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT counselor_id, name, qualification, specialization FROM counselor'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch counselors.' });
    }
};

module.exports = { getAllResources, addResource, updateResource, deleteResource, getCounselors };
