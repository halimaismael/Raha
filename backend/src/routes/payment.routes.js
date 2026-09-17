const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth');

// Callback de l'agrégateur mobile money (public, appelé par un service externe)
router.post('/webhook', ctrl.paymentWebhook);

// Usager : initie un paiement mobile money pour sa réservation
router.post('/:bookingId/mobile-money/initiate', requireAuth(['USER']), ctrl.initiateMobileMoney);

// Agence : confirme un paiement en espèces à bord
router.patch('/:bookingId/cash-confirm', requireAuth(['AGENCY_ADMIN']), ctrl.confirmCashPayment);

module.exports = router;
