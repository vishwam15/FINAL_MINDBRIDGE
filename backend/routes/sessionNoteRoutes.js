// routes/sessionNoteRoutes.js
// FIXED: /student/:studentId MUST be registered BEFORE /:appointmentId
// otherwise Express matches "student" as the appointmentId param
const express = require('express');
const router = express.Router();
const {
    createSessionNote,
    getSessionNote,
    getStudentSessionNotes,
    updateSessionNote,
    getCounselorNotes
} = require('../controllers/sessionNoteController');
const { authenticate, authorize } = require('../middleware/auth');

// POST   /api/session-notes            — create note (counselor only)
router.post('/', authenticate, authorize('counselor'), createSessionNote);

// GET    /api/session-notes/counselor/:counselorId — all notes by counselor
router.get('/counselor/:counselorId', authenticate, authorize('counselor'), getCounselorNotes);

// GET    /api/session-notes/student/:studentId — all notes for a student
// IMPORTANT: this must come before /:appointmentId to avoid route collision
router.get('/student/:studentId', authenticate, getStudentSessionNotes);

// GET    /api/session-notes/:appointmentId — notes for a specific appointment
router.get('/:appointmentId', authenticate, getSessionNote);

// PUT    /api/session-notes/:noteId     — update note (counselor only)
router.put('/:noteId', authenticate, authorize('counselor'), updateSessionNote);

module.exports = router;
