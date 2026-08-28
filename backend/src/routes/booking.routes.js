const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/booking.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth(['USER']), ctrl.createBooking);
router.get('/mine', requireAuth(['USER']), ctrl.listMyBookings);
router.patch('/:id/cancel', requireAuth(['USER']), ctrl.cancelBooking);

router.get('/agency/mine', requireAuth(['AGENCY_ADMIN']), ctrl.listAgencyBookings);
router.patch('/:id/status', requireAuth(['AGENCY_ADMIN']), ctrl.updateBookingStatus);

router.get('/:id', requireAuth(['USER', 'AGENCY_ADMIN']), ctrl.getBooking);

module.exports = router;
