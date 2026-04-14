// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats, addCounselor, getAllCounselors, deleteCounselor, getHighRiskStudents } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/stats', authenticate, authorize('admin'), getDashboardStats);
router.get('/high-risk', authenticate, authorize('admin'), getHighRiskStudents);
router.get('/counselors', authenticate, authorize('admin'), getAllCounselors);
router.post('/counselors', authenticate, authorize('admin'), addCounselor);
router.delete('/counselors/:id', authenticate, authorize('admin'), deleteCounselor);

module.exports = router;
