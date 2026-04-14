// controllers/studentController.js - CRUD for students
const db = require('../config/db');

// GET /api/students - Get all students (admin only)
const getAllStudents = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT student_id, name, age, gender, course, year, contact, email, created_at FROM student ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch students.' });
    }
};

// GET /api/students/:id - Get single student profile
const getStudentById = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT student_id, name, age, gender, course, year, contact, email FROM student WHERE student_id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch student.' });
    }
};

// PUT /api/students/:id - Update student profile
const updateStudent = async (req, res) => {
    try {
        const { name, age, gender, course, year, contact } = req.body;
        await db.query(
            'UPDATE student SET name=?, age=?, gender=?, course=?, year=?, contact=? WHERE student_id=?',
            [name, age, gender, course, year, contact, req.params.id]
        );
        res.json({ success: true, message: 'Student updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update student.' });
    }
};

// DELETE /api/students/:id - Delete student (admin only)
const deleteStudent = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM student WHERE student_id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Student not found.' });
        res.json({ success: true, message: 'Student deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to delete student.' });
    }
};

module.exports = { getAllStudents, getStudentById, updateStudent, deleteStudent };
