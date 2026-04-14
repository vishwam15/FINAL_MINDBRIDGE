// controllers/adminController.js - Admin management operations
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// GET /api/admin/stats - Dashboard stats
const getDashboardStats = async (req, res) => {
    try {
        const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) AS totalStudents FROM student');
        const [[{ totalCounselors }]] = await db.query('SELECT COUNT(*) AS totalCounselors FROM counselor');
        const [[{ totalAppointments }]] = await db.query('SELECT COUNT(*) AS totalAppointments FROM appointment');
        const [[{ highRiskCount }]] = await db.query(
            "SELECT COUNT(*) AS highRiskCount FROM mental_health_assessment WHERE risk_level IN ('High', 'Critical')"
        );
        const [[{ pendingAppointments }]] = await db.query(
            "SELECT COUNT(*) AS pendingAppointments FROM appointment WHERE status = 'pending'"
        );

        res.json({
            success: true,
            data: { totalStudents, totalCounselors, totalAppointments, highRiskCount, pendingAppointments }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
    }
};

// POST /api/admin/counselors - Add counselor
const addCounselor = async (req, res) => {
    try {
        const { name, qualification, specialization, experience, contact_no, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, password required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO counselor (name, qualification, specialization, experience, contact_no, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, qualification || null, specialization || null, experience || null, contact_no || null, email, hashedPassword]
        );
        res.status(201).json({ success: true, message: 'Counselor added.', data: { counselor_id: result.insertId } });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Email already exists.' });
        res.status(500).json({ success: false, message: 'Failed to add counselor.' });
    }
};

// GET /api/admin/counselors - Get all counselors
const getAllCounselors = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT counselor_id, name, qualification, specialization, experience, contact_no, email FROM counselor'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch counselors.' });
    }
};

// DELETE /api/admin/counselors/:id - Remove counselor
const deleteCounselor = async (req, res) => {
    try {
        await db.query('DELETE FROM counselor WHERE counselor_id = ?', [req.params.id]);
        res.json({ success: true, message: 'Counselor removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete counselor.' });
    }
};

// GET /api/admin/high-risk - High risk students (includes both High and Critical)
const getHighRiskStudents = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.student_id, s.name, s.email, s.course, s.year,
                   a.stress_level, a.anxiety_level, a.risk_level, a.date
            FROM mental_health_assessment a
            JOIN student s ON a.student_id = s.student_id
            WHERE a.risk_level IN ('High', 'Critical')
            ORDER BY a.date DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch high-risk students.' });
    }
};

module.exports = { getDashboardStats, addCounselor, getAllCounselors, deleteCounselor, getHighRiskStudents };
