// routes/studentRoutes.js
const express = require('express');
const router = express.Router();
const { getAllStudents, getStudentById, updateStudent, deleteStudent } = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), getAllStudents);
router.get('/:id', authenticate, getStudentById);
router.put('/:id', authenticate, updateStudent);
router.delete('/:id', authenticate, authorize('admin'), deleteStudent);

module.exports = router;
