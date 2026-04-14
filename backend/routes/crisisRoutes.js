// routes/crisisRoutes.js
const express = require('express');
const router = express.Router();
const { getCrisisResources, checkCrisisStatus, logCrisisContact } = require('../controllers/crisisController');
const { authenticate } = require('../middleware/auth');

router.get('/resources', getCrisisResources);
router.get('/assessment/:studentId', authenticate, checkCrisisStatus);
router.post('/hotline-contact', authenticate, logCrisisContact);

module.exports = router;
