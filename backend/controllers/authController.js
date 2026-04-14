// controllers/authController.js - Handles login and registration
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// Generate JWT token
const generateToken = (id, email, role) => {
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// POST /api/auth/register - Register a new student or counselor
const register = async (req, res) => {
    try {
        const { name, age, gender, course, year, contact, email, password, role, qualification, specialization, experience } = req.body;
        const userRole = role === 'counselor' ? 'counselor' : 'student';

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if (userRole === 'counselor') {
            if (!qualification) {
                return res.status(400).json({ success: false, message: 'Qualification is required for counselor registration.' });
            }

            const [existing] = await db.query('SELECT counselor_id FROM counselor WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'Email already registered as counselor.' });
            }

            const [result] = await db.query(
                'INSERT INTO counselor (name, qualification, specialization, experience, contact_no, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, qualification, specialization || null, experience || null, contact || null, email, hashedPassword]
            );

            const token = generateToken(result.insertId, email, 'counselor');
            return res.status(201).json({
                success: true,
                message: 'Counselor registration successful.',
                token,
                user: { id: result.insertId, name, email, role: 'counselor' }
            });
        } else {
            const [existing] = await db.query('SELECT student_id FROM student WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'Email already registered.' });
            }

            const { college_id, department_id } = req.body;
            // Ensure IDs are valid integers (non-numeric strings like 'iit_bombay' → null)
            const safeCollegeId   = college_id   && !isNaN(parseInt(college_id))   ? parseInt(college_id)   : null;
            const safeDepartmentId = department_id && !isNaN(parseInt(department_id)) ? parseInt(department_id) : null;

            const [result] = await db.query(
                'INSERT INTO student (name, age, gender, course, year, contact, email, password, college_id, department_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, age || null, gender || null, course || null, year || null, contact || null, email, hashedPassword, safeCollegeId, safeDepartmentId]
            );

            const token = generateToken(result.insertId, email, 'student');
            return res.status(201).json({
                success: true,
                message: 'Registration successful.',
                token,
                user: { id: result.insertId, name, email, role: 'student', college_id: college_id || null }
            });
        }
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// POST /api/auth/login - Login for student, counselor, or admin
const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, and role are required.' });
        }

        let user = null;
        let userId = null;
        let userName = null;

        if (role === 'admin') {
            const [rows] = await db.query('SELECT * FROM administrator WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }
            user = rows[0]; userId = rows[0].admin_id; userName = rows[0].name;

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

        } else if (role === 'student') {
            const [rows] = await db.query(
                `SELECT s.*, c.college_name, d.dept_name, cc.primary_color, cc.logo_url
                 FROM student s
                 LEFT JOIN college c ON s.college_id = c.college_id
                 LEFT JOIN department d ON s.department_id = d.department_id
                 LEFT JOIN college_config cc ON c.college_id = cc.college_id
                 WHERE s.email = ?`,
                [email]
            );
            if (rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }
            user = rows[0]; userId = rows[0].student_id; userName = rows[0].name;

            // FIXED: Students now also verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

        } else if (role === 'counselor') {
            const [rows] = await db.query('SELECT * FROM counselor WHERE email = ?', [email]);
            if (rows.length === 0) {
                // FIXED: Removed dangerous fallback that logged in ANY counselor if email not found
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }
            user = rows[0]; userId = rows[0].counselor_id; userName = rows[0].name;

            // FIXED: Counselors now also verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid email or password.' });
            }

        } else {
            return res.status(400).json({ success: false, message: 'Invalid role.' });
        }

        const token = generateToken(userId, email, role);

        let responseUser = { id: userId, name: userName, email, role };
        if (role === 'student' && user.college_id) {
            responseUser.college = {
                college_id: user.college_id,
                college_name: user.college_name,
                department: user.dept_name,
                primary_color: user.primary_color,
                logo_url: user.logo_url
            };
        }

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: responseUser
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};

// POST /api/auth/logout
const logout = (req, res) => {
    try {
        res.json({ success: true, message: 'Logout successful. Token cleared on client side.' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ success: false, message: 'Server error during logout.' });
    }
};

module.exports = { register, login, logout };
