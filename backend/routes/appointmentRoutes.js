// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const {
    bookAppointment, getAppointmentsByStudent,
    getAppointmentsByCounselor, updateAppointmentStatus, sendReminder, getAllAppointments
} = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, bookAppointment);
router.get('/student/:id', authenticate, getAppointmentsByStudent);
router.get('/counselor/:id', authenticate, getAppointmentsByCounselor);
router.put('/:id', authenticate, updateAppointmentStatus);
router.put('/:id/status', authenticate, updateAppointmentStatus);
router.post('/:id/send-reminder', authenticate, authorize('counselor'), sendReminder);
router.get('/', authenticate, authorize('admin'), getAllAppointments);

module.exports = router;
