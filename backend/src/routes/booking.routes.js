const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/booking.controller');
const { requireAuth } = require('../middleware/auth');

const PROFESSIONAL_ROLES = ['AGENCY_ADMIN', 'AGENCY_DRIVER', 'INDEPENDENT_DRIVER'];

// Usager
router.post('/', requireAuth(['USER']), ctrl.createBooking);
router.get('/mine', requireAuth(['USER']), ctrl.listMyBookings);
router.patch('/:id/cancel', requireAuth(['USER']), ctrl.cancelBooking);
router.patch('/:id/message', requireAuth(['USER']), ctrl.sendDriverMessage);

// Professionnels
router.get('/agency/mine', requireAuth(['AGENCY_ADMIN']), ctrl.listAgencyBookings);
router.get('/professional/mine', requireAuth(['AGENCY_DRIVER', 'INDEPENDENT_DRIVER']), ctrl.listMyProfessionalBookings);
router.patch('/:id/accept', requireAuth(PROFESSIONAL_ROLES), ctrl.acceptBooking);
router.patch('/:id/reject', requireAuth(PROFESSIONAL_ROLES), ctrl.rejectBooking);
router.patch('/:id/assign-driver', requireAuth(['AGENCY_ADMIN']), ctrl.assignDriver);
router.patch('/:id/status', requireAuth(PROFESSIONAL_ROLES), ctrl.updateBookingStatus);

// Consultation (usager ou professionnel concerné — vérifié dans le contrôleur)
router.get('/:id', requireAuth(['USER', 'AGENCY_ADMIN', 'AGENCY_DRIVER', 'INDEPENDENT_DRIVER']), ctrl.getBooking);

module.exports = router;
