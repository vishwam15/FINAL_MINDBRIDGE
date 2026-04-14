// backend/controllers/collegeController.js
const pool = require('../config/db');

// Get all colleges
exports.getAllColleges = async (req, res) => {
    try {
        const [colleges] = await pool.query(
            `SELECT c.*, cc.primary_color, cc.secondary_color, cc.logo_url, cc.custom_header_text
             FROM college c 
             LEFT JOIN college_config cc ON c.college_id = cc.college_id
             WHERE cc.is_active = TRUE OR cc.is_active IS NULL
             ORDER BY c.college_name`
        );
        res.json({ success: true, data: colleges });
    } catch(err) {
        console.error('Error fetching colleges:', err);
        res.status(500).json({ success: false, msg: 'Failed to fetch colleges' });
    }
};

// Get college by ID with config and departments
exports.getCollegeDetail = async (req, res) => {
    const { collegeId } = req.params;
    try {
        const [college] = await pool.query(
            `SELECT c.*, cc.primary_color, cc.secondary_color, cc.logo_url, cc.custom_header_text
             FROM college c 
             LEFT JOIN college_config cc ON c.college_id = cc.college_id
             WHERE c.college_id = ?`,
            [collegeId]
        );
        
        if (!college.length) {
            return res.status(404).json({ success: false, msg: 'College not found' });
        }

        const [departments] = await pool.query(
            'SELECT * FROM department WHERE college_id = ? ORDER BY dept_name',
            [collegeId]
        );

        const [counselors] = await pool.query(
            `SELECT c.*, cca.specialization, cca.office_location, cca.is_available
             FROM counselor c
             INNER JOIN college_counselor_assignment cca ON c.counselor_id = cca.counselor_id
             WHERE cca.college_id = ? AND cca.is_available = TRUE`,
            [collegeId]
        );

        const [resources] = await pool.query(
            'SELECT * FROM college_resource WHERE college_id = ?',
            [collegeId]
        );

        res.json({
            success: true,
            data: {
                college: college[0],
                departments,
                counselors,
                resources
            }
        });
    } catch(err) {
        console.error('Error fetching college detail:', err);
        res.status(500).json({ success: false, msg: 'Failed to fetch college details' });
    }
};

// Get departments for a college
exports.getDepartments = async (req, res) => {
    const { collegeId } = req.params;
    try {
        const [departments] = await pool.query(
            'SELECT * FROM department WHERE college_id = ? ORDER BY dept_name',
            [collegeId]
        );
        res.json({ success: true, data: departments });
    } catch(err) {
        console.error('Error fetching departments:', err);
        res.status(500).json({ success: false, msg: 'Failed to fetch departments' });
    }
};

// Get counselors available for a college
exports.getCollegeCounselors = async (req, res) => {
    const { collegeId } = req.params;
    try {
        const [counselors] = await pool.query(
            `SELECT c.*, cca.specialization, cca.office_location, cca.is_available
             FROM counselor c
             INNER JOIN college_counselor_assignment cca ON c.counselor_id = cca.counselor_id
             WHERE cca.college_id = ? AND cca.is_available = TRUE
             ORDER BY c.name`,
            [collegeId]
        );
        res.json({ success: true, data: counselors });
    } catch(err) {
        console.error('Error fetching counselors:', err);
        res.status(500).json({ success: false, msg: 'Failed to fetch counselors' });
    }
};

// Get college by student ID
exports.getStudentCollege = async (req, res) => {
    const { studentId } = req.params;
    try {
        const [result] = await pool.query(
            `SELECT c.*, cc.primary_color, cc.secondary_color, cc.logo_url
             FROM student s
             LEFT JOIN college c ON s.college_id = c.college_id
             LEFT JOIN college_config cc ON c.college_id = cc.college_id
             WHERE s.student_id = ?`,
            [studentId]
        );
        
        if (!result.length || !result[0].college_id) {
            return res.status(404).json({ success: false, msg: 'College not found for student' });
        }

        res.json({ success: true, data: result[0] });
    } catch(err) {
        console.error('Error fetching student college:', err);
        res.status(500).json({ success: false, msg: 'Failed to fetch student college' });
    }
};

// Get college resources
exports.getCollegeResources = async (req, res) => {
    const { collegeId } = req.params;
    try {
        const [resources] = await pool.query(
            'SELECT * FROM college_resource WHERE college_id = ?',
            [collegeId]
        );
        res.json({ success: true, data: resources });
    } catch(err) {
        console.error('Error fetching college resources:', err);
        res.status(500).json({ success: false, msg: 'Failed to fetch college resources' });
    }
};

// Get college branding
exports.getCollegeBranding = async (req, res) => {
    const { collegeId } = req.params;
    try {
        const [branding] = await pool.query(
            'SELECT * FROM college_config WHERE college_id = ? AND is_active = TRUE',
            [collegeId]
        );
        
        if (!branding.length) {
            return res.status(404).json({ success: false, msg: 'College branding not found' });
        }

        res.json({ success: true, data: branding[0] });
    } catch(err) {
        console.error('Error fetching college branding:', err);
        res.status(500).json({ success: false, msg: 'Failed to fetch college branding' });
    }
};
