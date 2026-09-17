const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/mwana.controller');
const { requireAuth } = require('../middleware/auth');

// Service Raha Mwana (accompagnement scolaire) — usager uniquement.
router.post('/', requireAuth(['USER']), ctrl.createMwanaRequest);
router.get('/mine', requireAuth(['USER']), ctrl.listMyMwanaRequests);

// Super-admin Raha (tableau de bord "Agence Raha")
router.get('/admin/all', requireAuth(['SUPER_ADMIN']), ctrl.listAllMwanaRequests);
router.patch('/:id/status', requireAuth(['SUPER_ADMIN']), ctrl.updateMwanaStatus);
router.patch('/:id/dossier-reviewed', requireAuth(['SUPER_ADMIN']), ctrl.updateDossierReviewed);

module.exports = router;
