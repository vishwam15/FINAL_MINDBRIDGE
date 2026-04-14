// backend/routes/collegeRoutes.js
const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

// Get all colleges
router.get('/', collegeController.getAllColleges);          // alias endpoint: /api/colleges
router.get('/colleges', collegeController.getAllColleges); // legacy endpoint: /api/colleges/colleges

// Get specific college with full details
router.get('/colleges/:collegeId', collegeController.getCollegeDetail);

// Get departments for a college
router.get('/colleges/:collegeId/departments', collegeController.getDepartments);

// Get available counselors for a college
router.get('/colleges/:collegeId/counselors', collegeController.getCollegeCounselors);

// Get college resources
router.get('/colleges/:collegeId/resources', collegeController.getCollegeResources);

// Get college branding
router.get('/colleges/:collegeId/branding', collegeController.getCollegeBranding);

// Get college for a student
router.get('/student/:studentId/college', collegeController.getStudentCollege);

module.exports = router;
