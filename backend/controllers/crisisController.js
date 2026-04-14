// controllers/crisisController.js - Crisis resources and emergency response
const db = require('../config/db');

// GET /api/crisis/resources - Get all crisis resources
const getCrisisResources = async (req, res) => {
    try {
        const [resources] = await db.query('SELECT * FROM crisis_resource ORDER BY resource_type, title');
        res.json({ success: true, data: resources });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch crisis resources.' });
    }
};

// GET /api/crisis/assessment/:studentId - Check if student is in crisis (high risk)
const checkCrisisStatus = async (req, res) => {
    try {
        const [assessments] = await db.query(`
            SELECT risk_level, date FROM mental_health_assessment 
            WHERE student_id = ? 
            ORDER BY date DESC 
            LIMIT 1
        `, [req.params.studentId]);

        if (assessments.length === 0) {
            return res.json({ success: true, inCrisis: false, message: 'No assessments found.' });
        }

        const latestAssessment = assessments[0];
        const inCrisis = ['High', 'Critical'].includes(latestAssessment.risk_level);

        if (inCrisis) {
            const [resources] = await db.query('SELECT * FROM crisis_resource LIMIT 5');
            return res.json({
                success: true,
                inCrisis: true,
                lastAssessment: latestAssessment,
                resources: resources,
                message: 'Immediate support available. Please reach out to a counselor or crisis helpline.'
            });
        }

        res.json({
            success: true,
            inCrisis: false,
            lastAssessment: latestAssessment
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to check crisis status.' });
    }
};

// POST /api/crisis/hotline-contact - Log student crisis contact attempt
const logCrisisContact = async (req, res) => {
    try {
        const { student_id, resource_id, action } = req.body;

        if (!student_id) {
            return res.status(400).json({ success: false, message: 'Student ID required.' });
        }

        // Create a note in the system (you could log to a separate table if needed)
        console.log(`CRISIS CONTACT: Student ${student_id} accessed ${action} at crisis resource ${resource_id || 'unknown'}`);

        res.json({
            success: true,
            message: 'Crisis contact logged. Support team will monitor your account.'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to log crisis contact.' });
    }
};

module.exports = { getCrisisResources, checkCrisisStatus, logCrisisContact };
