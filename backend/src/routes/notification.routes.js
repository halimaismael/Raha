const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth');

const ALL_ROLES = ['USER', 'AGENCY_ADMIN', 'AGENCY_DRIVER', 'INDEPENDENT_DRIVER'];

router.get('/mine', requireAuth(ALL_ROLES), ctrl.listMyNotifications);
router.patch('/:id/read', requireAuth(ALL_ROLES), ctrl.markAsRead);

module.exports = router;
