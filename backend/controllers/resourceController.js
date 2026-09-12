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
        const { title, type, description, link, thumbnail_url, platform } = req.body;
        
        console.log('--- Add Resource Request ---');
        console.log('Payload:', { title, type, description, link, thumbnail_url, platform });

        if (!title || !type) {
            console.warn('Validation failed: Title and type are required.');
            return res.status(400).json({ success: false, message: 'Title and type are required.' });
        }
        
        // Auto-detect platform if not provided
        let detectedPlatform = platform;
        if (!detectedPlatform && link) {
            if (link.includes('youtube.com') || link.includes('youtu.be')) detectedPlatform = 'YouTube';
            else if (link.includes('spotify.com')) detectedPlatform = 'Spotify';
            else if (link.includes('medium.com')) detectedPlatform = 'Medium';
            else if (link.includes('drive.google.com')) detectedPlatform = 'Google Drive';
        }

        const [result] = await db.query(
            'INSERT INTO self_help_resource (title, type, description, link, thumbnail_url, platform) VALUES (?, ?, ?, ?, ?, ?)',
            [title, type, description || '', link || null, thumbnail_url || null, detectedPlatform || null]
        );
        
        console.log('Resource added successfully. ID:', result.insertId);
        res.status(201).json({ success: true, message: 'Resource added.', data: { resource_id: result.insertId } });
    } catch (err) {
        console.error('Error adding resource:', err);
        res.status(500).json({ success: false, message: `Failed to add resource: ${err.message}` });
    }
};

// PUT /api/resources/:id - Update a resource (admin)
const updateResource = async (req, res) => {
    try {
        const { title, type, description, link, thumbnail_url, platform } = req.body;
        
        console.log('--- Update Resource Request ---');
        console.log('ID:', req.params.id);
        console.log('Payload:', { title, type, description, link, thumbnail_url, platform });

        await db.query(
            'UPDATE self_help_resource SET title=?, type=?, description=?, link=?, thumbnail_url=?, platform=? WHERE resource_id=?',
            [title || '', type || '', description || '', link || null, thumbnail_url || null, platform || null, req.params.id]
        );
        
        console.log('Resource updated successfully.');
        res.json({ success: true, message: 'Resource updated.' });
    } catch (err) {
        console.error('Error updating resource:', err);
        res.status(500).json({ success: false, message: `Failed to update resource: ${err.message}` });
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
