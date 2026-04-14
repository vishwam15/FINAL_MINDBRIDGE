// controllers/sessionNoteController.js - Session notes after appointments
const db = require('../config/db');

// POST /api/session-notes - Create session notes for appointment
const createSessionNote = async (req, res) => {
    try {
        const { appointment_id, counselor_id, notes, mood_assessment, progress_notes, recommendations, followup_date } = req.body;

        if (!appointment_id || !counselor_id || !notes) {
            return res.status(400).json({ success: false, message: 'Appointment ID, counselor ID, and notes are required.' });
        }

        // Check if note already exists for this appointment — if so, update instead
        const [existing] = await db.query(
            'SELECT note_id FROM session_note WHERE appointment_id = ?',
            [appointment_id]
        );

        let noteId;
        if (existing.length > 0) {
            noteId = existing[0].note_id;
            await db.query(`
                UPDATE session_note
                SET notes = ?, mood_assessment = ?, progress_notes = ?, recommendations = ?, followup_date = ?
                WHERE note_id = ?
            `, [notes, mood_assessment || null, progress_notes || null, recommendations || null, followup_date || null, noteId]);
        } else {
            const [result] = await db.query(`
                INSERT INTO session_note (appointment_id, counselor_id, notes, mood_assessment, progress_notes, recommendations, followup_date)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [appointment_id, counselor_id, notes, mood_assessment || null, progress_notes || null, recommendations || null, followup_date || null]);
            noteId = result.insertId;
        }

        // Mark appointment as completed
        await db.query('UPDATE appointment SET status = ? WHERE appointment_id = ?', ['completed', appointment_id]);

        res.status(201).json({
            success: true,
            message: 'Session notes saved successfully.',
            data: { note_id: noteId }
        });
    } catch (err) {
        console.error('createSessionNote error:', err);
        res.status(500).json({ success: false, message: 'Failed to save session notes.' });
    }
};

// GET /api/session-notes/:appointmentId - Get notes for specific appointment
const getSessionNote = async (req, res) => {
    try {
        const [notes] = await db.query(`
            SELECT sn.*, c.name AS counselor_name
            FROM session_note sn
            JOIN counselor c ON sn.counselor_id = c.counselor_id
            WHERE sn.appointment_id = ?
        `, [req.params.appointmentId]);

        if (notes.length === 0) {
            return res.status(404).json({ success: false, message: 'No session notes found for this appointment.' });
        }

        res.json({ success: true, data: notes[0] });
    } catch (err) {
        console.error('getSessionNote error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch session notes.' });
    }
};

// GET /api/session-notes/student/:studentId - All notes for a student
const getStudentSessionNotes = async (req, res) => {
    try {
        const [notes] = await db.query(`
            SELECT sn.*, c.name AS counselor_name, a.date AS appointment_date, a.time AS appointment_time
            FROM session_note sn
            JOIN counselor c ON sn.counselor_id = c.counselor_id
            JOIN appointment a ON sn.appointment_id = a.appointment_id
            WHERE a.student_id = ?
            ORDER BY a.date DESC
        `, [req.params.studentId]);

        res.json({ success: true, data: notes });
    } catch (err) {
        console.error('getStudentSessionNotes error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch student notes.' });
    }
};

// GET /api/session-notes/counselor/:counselorId - All notes written by a counselor
const getCounselorNotes = async (req, res) => {
    try {
        const [notes] = await db.query(`
            SELECT sn.*, s.name AS student_name, s.email AS student_email,
                   a.date AS appointment_date, a.time AS appointment_time, a.mode
            FROM session_note sn
            JOIN appointment a ON sn.appointment_id = a.appointment_id
            JOIN student s ON a.student_id = s.student_id
            WHERE sn.counselor_id = ?
            ORDER BY sn.created_at DESC
        `, [req.params.counselorId]);

        res.json({ success: true, data: notes });
    } catch (err) {
        console.error('getCounselorNotes error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch counselor notes.' });
    }
};

// PUT /api/session-notes/:noteId - Update session notes
const updateSessionNote = async (req, res) => {
    try {
        const { notes, mood_assessment, progress_notes, recommendations, followup_date } = req.body;

        if (!notes) {
            return res.status(400).json({ success: false, message: 'Notes field is required.' });
        }

        const [result] = await db.query(`
            UPDATE session_note
            SET notes = ?, mood_assessment = ?, progress_notes = ?, recommendations = ?, followup_date = ?
            WHERE note_id = ?
        `, [notes, mood_assessment || null, progress_notes || null, recommendations || null, followup_date || null, req.params.noteId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Note not found.' });
        }

        res.json({ success: true, message: 'Session notes updated successfully.' });
    } catch (err) {
        console.error('updateSessionNote error:', err);
        res.status(500).json({ success: false, message: 'Failed to update session notes.' });
    }
};

module.exports = { createSessionNote, getSessionNote, getStudentSessionNotes, getCounselorNotes, updateSessionNote };
