const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payment.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/:bookingId/mobile-money/initiate', requireAuth(['USER']), ctrl.initiateMobileMoney);
router.post('/webhook', ctrl.paymentWebhook);
router.patch('/:bookingId/cash-confirm', requireAuth(['AGENCY_ADMIN']), ctrl.confirmCashPayment);

module.exports = router;
