// controllers/assessmentController.js - Mental health assessments
const db = require('../config/db');
const { createNotification } = require('./notificationController');

// Convert string level label → integer (0–4 scale) for INT columns in the schema
const labelToInt = (level) => {
    const map = { 'None': 0, 'Low': 1, 'Moderate': 2, 'High': 3, 'Very High': 4 };
    if (level === undefined || level === null || level === '') return null;
    return map[level] !== undefined ? map[level] : (parseInt(level, 10) || 0);
};

// Calculate comprehensive risk level from all dimensions
const calculateRiskLevel = (scores) => {
    const validScores = scores.filter(s => s !== null && s !== undefined);
    if (validScores.length === 0) return 'Low';
    const total = validScores.reduce((sum, s) => sum + s, 0);
    const max = validScores.length * 4;
    const pct = (total / max) * 100;
    if (pct <= 25) return 'Low';
    if (pct <= 50) return 'Moderate';
    if (pct <= 75) return 'High';
    return 'Critical';
};

// POST /api/assessments - Submit a new assessment
const createAssessment = async (req, res) => {
    try {
        const {
            student_id,
            stress_level,
            anxiety_level,
            depression_level,
            sleep_quality,
            social_support,
            academic_pressure,
            physical_activity,
            self_harm_thoughts
        } = req.body;

        if (!student_id || !stress_level || !anxiety_level) {
            return res.status(400).json({ success: false, message: 'Student ID, stress level, and anxiety level are required.' });
        }

        // Convert string labels to INT values for DB storage (schema uses INT columns)
        const stressInt     = labelToInt(stress_level);
        const anxietyInt    = labelToInt(anxiety_level);
        const depressionInt = labelToInt(depression_level);
        const sleepInt      = labelToInt(sleep_quality);
        const socialInt     = labelToInt(social_support);
        const pressureInt   = labelToInt(academic_pressure);
        const activityInt   = labelToInt(physical_activity);

        // Build scores array — invert sleep/social (lower quality = higher risk)
        const scoreInputs = [
            stressInt,
            anxietyInt,
            depressionInt  !== null ? depressionInt   : 1,
            sleepInt       !== null ? (4 - sleepInt)  : 2, // inverted: poor sleep = higher risk
            socialInt      !== null ? (4 - socialInt)  : 2, // inverted: low support = higher risk
            pressureInt    !== null ? pressureInt      : 1,
        ];

        const risk_level = calculateRiskLevel(scoreInputs);

        // Override to Critical if self-harm thoughts are present
        const selfHarmBool = (self_harm_thoughts === 'Yes' || self_harm_thoughts === true || self_harm_thoughts === 1);
        const finalRisk = selfHarmBool ? 'Critical' : risk_level;

        const today = new Date().toISOString().slice(0, 10);

        const [result] = await db.query(
            `INSERT INTO mental_health_assessment
             (student_id, date, stress_level, anxiety_level, risk_level,
              depression_level, sleep_quality, social_support, academic_pressure, physical_activity, self_harm_thoughts)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                student_id, today,
                stressInt, anxietyInt, finalRisk,
                depressionInt, sleepInt, socialInt,
                pressureInt, activityInt,
                selfHarmBool ? 1 : 0
            ]
        );

        // Recommend resources based on risk
        let resourceQuery = 'SELECT * FROM self_help_resource LIMIT 2';
        if (finalRisk === 'Critical' || finalRisk === 'High') {
            resourceQuery = 'SELECT * FROM self_help_resource WHERE type IN ("Resource", "Worksheet") LIMIT 3';
        } else if (finalRisk === 'Moderate') {
            resourceQuery = 'SELECT * FROM self_help_resource WHERE type IN ("Article", "Video") LIMIT 3';
        }
        const [recommendedResources] = await db.query(resourceQuery);

        // If Critical, also return crisis resources
        let crisisResources = [];
        if (finalRisk === 'Critical') {
            const [cr] = await db.query('SELECT * FROM crisis_resource LIMIT 3');
            crisisResources = cr;
        }

        // Notify counselor(s) if risk is High or Critical
        if (finalRisk === 'High' || finalRisk === 'Critical') {
            try {
                // Get counselors assigned to this student's college
                const [counselors] = await db.query(`
                    SELECT cca.counselor_id, s.name as student_name
                    FROM student s
                    JOIN college_counselor_assignment cca ON s.college_id = cca.college_id
                    WHERE s.student_id = ?
                `, [student_id]);

                for (const c of counselors) {
                    createNotification(
                        c.counselor_id,
                        'counselor',
                        `Urgent: ${c.student_name} reported ${finalRisk} risk level in a new assessment.`,
                        'assessment'
                    );
                }
            } catch (notifyErr) {
                console.error('Failed to create assessment notification:', notifyErr);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Assessment submitted successfully.',
            data: {
                assessment_id: result.insertId,
                risk_level: finalRisk,
                stress_level: stress_level,
                anxiety_level: anxiety_level,
                depression_level: depression_level || null,
                sleep_quality: sleep_quality || null,
                social_support: social_support || null,
                academic_pressure: academic_pressure || null,
                physical_activity: physical_activity || null,
                self_harm_thoughts: selfHarmBool ? 'Yes' : 'No',
                stress_score: stressInt,
                anxiety_score: anxietyInt,
                depression_score: depressionInt,
                recommended_resources: recommendedResources,
                crisis_resources: crisisResources
            }
        });
    } catch (err) {
        console.error('createAssessment error:', err);
        res.status(500).json({ success: false, message: 'Failed to submit assessment.' });
    }
};

// GET /api/assessments/student/:id
const getAssessmentsByStudent = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM mental_health_assessment WHERE student_id = ? ORDER BY created_at DESC, assessment_id DESC',
            [req.params.id]
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAssessmentsByStudent error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch assessments.' });
    }
};

// GET /api/assessments - All assessments (admin only)
const getAllAssessments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, s.name AS student_name, s.email AS student_email
            FROM mental_health_assessment a
            JOIN student s ON a.student_id = s.student_id
            ORDER BY a.created_at DESC, a.assessment_id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('getAllAssessments error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch assessments.' });
    }
};

module.exports = { createAssessment, getAssessmentsByStudent, getAllAssessments };
