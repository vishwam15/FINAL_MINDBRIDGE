// routes/resourceRoutes.js
const express = require('express');
const router = express.Router();
const { getAllResources, addResource, updateResource, deleteResource, getCounselors } = require('../controllers/resourceController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/counselors', authenticate, getCounselors);
router.get('/', authenticate, getAllResources);
router.post('/', authenticate, authorize('admin'), addResource);
router.put('/:id', authenticate, authorize('admin'), updateResource);
router.delete('/:id', authenticate, authorize('admin'), deleteResource);

module.exports = router;
