const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/mine', requireAuth(['USER']), ctrl.listMyNotifications);
router.patch('/:id/read', requireAuth(['USER']), ctrl.markAsRead);

module.exports = router;
