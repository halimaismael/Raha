const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/agency.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/', ctrl.listAgencies);
router.get('/me', requireAuth(['AGENCY_ADMIN']), ctrl.getMyAgency);
router.patch('/me', requireAuth(['AGENCY_ADMIN']), ctrl.updateMyAgency);
router.get('/:id', ctrl.getAgency);

module.exports = router;
