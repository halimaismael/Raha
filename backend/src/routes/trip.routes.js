const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trip.controller');
const { requireAuth } = require('../middleware/auth');

// Recherche publique (app mobile usager)
router.get('/search', ctrl.searchTrips);

// Gestion agence
router.get('/mine', requireAuth(['AGENCY_ADMIN']), ctrl.listMyTrips);
router.post('/', requireAuth(['AGENCY_ADMIN']), ctrl.createTrip);
router.patch('/:id/status', requireAuth(['AGENCY_ADMIN']), ctrl.updateTripStatus);

// Consultation publique (doit rester après les routes plus spécifiques ci-dessus)
router.get('/:id', ctrl.getTrip);

module.exports = router;
