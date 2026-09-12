// controllers/appointmentController.js - Appointment booking and management
const db = require('../config/db');
const nodemailer = require('nodemailer');
const { createNotification } = require('./notificationController');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper to send confirmation email
const sendConfirmationEmail = async (studentEmail, studentName, counselorName, date, time, mode) => {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
        console.log(`[Email Simulator] Confirmation: ${studentName} (${studentEmail}) booked with ${counselorName} on ${date} at ${time} (${mode})`);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"MindBridge Mental Health" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: 'Appointment Booked - Awaiting Confirmation - MindBridge',
            html: `
                <h3>Hello ${studentName},</h3>
                <p>Your counseling session booking request has been received!</p>
                <div style="background: #f0f8ff; padding: 15px; border-radius: 5px;">
                    <p><strong>Counselor:</strong> ${counselorName}</p>
                    <p><strong>Requested Date:</strong> ${date}</p>
                    <p><strong>Requested Time:</strong> ${time}</p>
                    <p><strong>Mode:</strong> ${mode}</p>
                </div>
                <p>Your counselor will review your booking and send a confirmation shortly. You'll receive another email once it's confirmed.</p>
                <p>Take care,<br>The MindBridge Team</p>
            `
        });
        console.log(`Booking request email sent to ${studentEmail}`);
    } catch (err) {
        console.error('Email Dispatch Failed:', err.message);
    }
};

// Helper to send confirmation acceptance email
const sendConfirmationAcceptedEmail = async (studentEmail, studentName, counselorName, counselorEmail, date, time, mode) => {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
        console.log(`[Email Simulator] Confirmation Accepted: ${studentName} appointment confirmed with ${counselorName} on ${date}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"MindBridge Mental Health" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: 'Appointment Confirmed ✓ - MindBridge',
            html: `
                <h3>Hello ${studentName},</h3>
                <p><strong style="color: green;">Your appointment has been confirmed! ✓</strong></p>
                <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid green;">
                    <p><strong>Counselor:</strong> ${counselorName}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Mode:</strong> ${mode}</p>
                    ${mode === 'online' ? '<p><strong>Meeting Link:</strong> You will receive the link 1 hour before the session.</p>' : '<p><strong>Location:</strong> Please check your counselor\'s office location.</p>'}
                </div>
                <p>A reminder email will be sent 24 hours before your appointment.</p>
                <p>Take care,<br>The MindBridge Team</p>
            `
        });
        console.log(`Confirmation email sent to ${studentEmail}`);
    } catch (err) {
        console.error('Email Dispatch Failed:', err.message);
    }
};

// Helper to send reminder email
const sendReminderEmail = async (studentEmail, studentName, counselorName, date, time, mode) => {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
        console.log(`[Email Simulator] Reminder: ${studentName} has appointment with ${counselorName} on ${date} at ${time}`);
        return;
    }
    try {
        await transporter.sendMail({
            from: `"MindBridge Mental Health" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: 'Appointment Reminder - Tomorrow at ' + time + ' - MindBridge',
            html: `
                <h3>Hello ${studentName},</h3>
                <p>This is a gentle reminder about your counseling session <strong>tomorrow</strong>!</p>
                <div style="background: #fff3e0; padding: 15px; border-radius: 5px;">
                    <p><strong>Counselor:</strong> ${counselorName}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p><strong>Mode:</strong> ${mode}</p>
                </div>
                <p>Please ensure you're in a quiet, comfortable space. If you need to reschedule, reach out to your counselor as soon as possible.</p>
                <p>Looking forward to our session together!</p>
                <p>Take care,<br>The MindBridge Team</p>
            `
        });
        console.log(`Reminder email sent to ${studentEmail}`);
    } catch (err) {
        console.error('Email Dispatch Failed:', err.message);
    }
};

// POST /api/appointments - Book a new appointment
const bookAppointment = async (req, res) => {
    try {
        const { student_id, counselor_id, date, time, mode } = req.body;

        if (!student_id || !counselor_id || !date || !time) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const selectedDateTime = new Date(`${date}T${time}`);
        if (isNaN(selectedDateTime.getTime()) || selectedDateTime <= new Date()) {
            return res.status(400).json({ success: false, message: 'Please select a future date and time for the appointment.' });
        }

        const [result] = await db.query(
            'INSERT INTO appointment (student_id, counselor_id, date, time, mode, status) VALUES (?, ?, ?, ?, ?, ?)',
            [student_id, counselor_id, date, time, mode || 'online', 'pending']
        );

        // Run email dispatch asynchronously
        try {
            const [students] = await db.query('SELECT name, email FROM student WHERE student_id = ?', [student_id]);
            const [counselors] = await db.query('SELECT name FROM counselor WHERE counselor_id = ?', [counselor_id]);
            
            if (students.length > 0 && counselors.length > 0) {
                sendConfirmationEmail(
                    students[0].email,
                    students[0].name,
                    counselors[0].name,
                    date,
                    time,
                    mode || 'online'
                );

                // Create notification for counselor
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                const formattedTime = time.substring(0, 5);

                createNotification(
                    counselor_id,
                    'counselor',
                    `New request: ${students[0].name} for ${formattedDate} at ${formattedTime}.`,
                    'appointment'
                );
            }
        } catch (e) {
            console.error('Failed to fetch user details for email', e);
        }

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully. Awaiting counselor confirmation.',
            data: { appointment_id: result.insertId, status: 'pending' }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to book appointment.' });
    }
};

// GET /api/appointments/student/:id - Student's appointments
const getAppointmentsByStudent = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, c.name AS counselor_name, c.specialization
            FROM appointment a
            JOIN counselor c ON a.counselor_id = c.counselor_id
            WHERE a.student_id = ?
            ORDER BY a.date DESC, a.time DESC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
    }
};

// GET /api/appointments/counselor/:id - Counselor's appointments
const getAppointmentsByCounselor = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, s.name AS student_name, s.email AS student_email, s.course, s.year
            FROM appointment a
            JOIN student s ON a.student_id = s.student_id
            WHERE a.counselor_id = ?
            ORDER BY a.date ASC, a.time ASC
        `, [req.params.id]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
    }
};

// PUT /api/appointments/:id/status - Update appointment status (counselor)
const updateAppointmentStatus = async (req, res) => {
    try {
        const { status, counselor_note } = req.body;
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status value.' });
        }

        // Check if the appointment belongs to the counselor (if user is counselor)
        if (req.user.role === 'counselor') {
            const [checkResult] = await db.query('SELECT counselor_id FROM appointment WHERE appointment_id = ?', [req.params.id]);
            if (checkResult.length === 0) {
                return res.status(404).json({ success: false, message: 'Appointment not found.' });
            }
            if (checkResult[0].counselor_id !== Number(req.user.id)) {
                return res.status(403).json({ success: false, message: 'Access denied. You can only update your own appointments.' });
            }
        }

        let query = 'UPDATE appointment SET status = ?, confirmed_at = ?';
        const params = [status, status === 'confirmed' ? new Date() : null];
        if (req.body.counselor_note !== undefined) {
            query += ', counselor_note = ?';
            params.push(counselor_note || null);
        }
        query += ' WHERE appointment_id = ?';
        params.push(req.params.id);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            const [exists] = await db.query('SELECT appointment_id FROM appointment WHERE appointment_id = ?', [req.params.id]);
            if (exists.length === 0) {
                return res.status(404).json({ success: false, message: 'Appointment not found.' });
            }
        }

        // Send confirmation email if confirmed
        if (status === 'confirmed') {
            try {
                const [appointments] = await db.query(`
                    SELECT a.*, s.name as student_name, s.email as student_email, c.name as counselor_name
                    FROM appointment a
                    JOIN student s ON a.student_id = s.student_id
                    JOIN counselor c ON a.counselor_id = c.counselor_id
                    WHERE a.appointment_id = ?
                `, [req.params.id]);

                if (appointments.length > 0) {
                    const appt = appointments[0];
                    sendConfirmationAcceptedEmail(
                        appt.student_email,
                        appt.student_name,
                        appt.counselor_name,
                        '',
                        appt.date,
                        appt.time,
                        appt.mode
                    );
                }

                // Create notification for student
                if (status === 'confirmed' || status === 'cancelled') {
                    const appt = appointments[0];
                    const dateObj = new Date(appt.date);
                    const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                    const formattedTime = appt.time.substring(0, 5); // Take HH:MM
                    
                    createNotification(
                        appt.student_id,
                        'student',
                        `Your session on ${formattedDate} at ${formattedTime} has been ${status}.`,
                        'appointment'
                    );
                }
            } catch (e) {
                console.error('Email notification failed:', e);
            }
        }

        res.json({ success: true, message: `Appointment ${status} successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to update status.' });
    }
};

// POST /api/appointments/:id/send-reminder - Send appointment reminder
const sendReminder = async (req, res) => {
    try {
        const [appointments] = await db.query(`
            SELECT a.*, s.name as student_name, s.email as student_email, c.name as counselor_name
            FROM appointment a
            JOIN student s ON a.student_id = s.student_id
            JOIN counselor c ON a.counselor_id = c.counselor_id
            WHERE a.appointment_id = ?
        `, [req.params.id]);

        if (appointments.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found.' });
        }

        const appt = appointments[0];
        
        // Send reminder email
        sendReminderEmail(
            appt.student_email,
            appt.student_name,
            appt.counselor_name,
            appt.date,
            appt.time,
            appt.mode
        );

        // Update reminded_at timestamp
        await db.query('UPDATE appointment SET reminded_at = ? WHERE appointment_id = ?', [new Date(), req.params.id]);

        res.json({ success: true, message: 'Reminder sent successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to send reminder.' });
    }
};

// GET /api/appointments - All appointments (admin)
const getAllAppointments = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, s.name AS student_name, c.name AS counselor_name
            FROM appointment a
            JOIN student s ON a.student_id = s.student_id
            JOIN counselor c ON a.counselor_id = c.counselor_id
            ORDER BY a.date DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments.' });
    }
};

module.exports = { bookAppointment, getAppointmentsByStudent, getAppointmentsByCounselor, updateAppointmentStatus, sendReminder, getAllAppointments };
