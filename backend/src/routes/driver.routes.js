const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/driver.controller');
const { requireAuth } = require('../middleware/auth');

// Espace du chauffeur d'agence lui-même — routes statiques "/me..." déclarées
// AVANT "/:id" pour ne jamais être interceptées par le paramètre :id.
router.get('/me', requireAuth(['AGENCY_DRIVER']), ctrl.getMe);
router.patch('/me', requireAuth(['AGENCY_DRIVER']), ctrl.updateMe);
router.get('/me/availability', requireAuth(['AGENCY_DRIVER']), ctrl.listMyAvailability);
router.put('/me/availability', requireAuth(['AGENCY_DRIVER']), ctrl.setMyAvailability);

// Gestion par l'admin agence
router.get('/mine', requireAuth(['AGENCY_ADMIN']), ctrl.listMyDrivers);
router.post('/', requireAuth(['AGENCY_ADMIN']), ctrl.createDriver);
router.patch('/:id', requireAuth(['AGENCY_ADMIN']), ctrl.updateDriver);
router.patch('/:id/activate', requireAuth(['AGENCY_ADMIN']), ctrl.activateDriver);
router.delete('/:id', requireAuth(['AGENCY_ADMIN']), ctrl.deleteDriver);

module.exports = router;
