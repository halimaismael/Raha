const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/superAdmin.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/stats', requireAuth(['SUPER_ADMIN']), ctrl.getStats);
router.get('/users', requireAuth(['SUPER_ADMIN']), ctrl.listUsers);

module.exports = router;
