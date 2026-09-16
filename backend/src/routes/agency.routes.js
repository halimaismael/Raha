const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/agency.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/', ctrl.listAgencies);
router.get('/me', requireAuth(['AGENCY_ADMIN']), ctrl.getMyAgency);
router.patch('/me', requireAuth(['AGENCY_ADMIN']), ctrl.updateMyAgency);

// Super-admin Raha (tableau de bord "Agence Raha")
router.get('/admin/all', requireAuth(['SUPER_ADMIN']), ctrl.listAllAgencies);
router.patch('/:id/approve', requireAuth(['SUPER_ADMIN']), ctrl.approveAgency);
router.patch('/:id/suspend', requireAuth(['SUPER_ADMIN']), ctrl.suspendAgency);

router.get('/:id', ctrl.getAgency);

module.exports = router;
