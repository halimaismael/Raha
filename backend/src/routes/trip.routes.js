const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trip.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/search', ctrl.searchTrips);
router.get('/mine', requireAuth(['AGENCY_ADMIN']), ctrl.listMyTrips);
router.post('/', requireAuth(['AGENCY_ADMIN']), ctrl.createTrip);
router.patch('/:id/status', requireAuth(['AGENCY_ADMIN']), ctrl.updateTripStatus);
router.get('/:id', ctrl.getTrip);

module.exports = router;
