// routes/assessmentRoutes.js
const express = require('express');
const router = express.Router();
const { createAssessment, getAssessmentsByStudent, getAllAssessments } = require('../controllers/assessmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, createAssessment);
router.get('/student/:id', authenticate, getAssessmentsByStudent);
router.get('/', authenticate, authorize('admin', 'counselor'), getAllAssessments);

module.exports = router;
