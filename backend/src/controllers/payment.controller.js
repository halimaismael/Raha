const prisma = require('../config/db');

// POST /api/payments/:bookingId/mobile-money/initiate
// Initialise un paiement Mobile Money. À brancher sur l'agrégateur comorien réel
// (ex: HolluPay, MHC, Telma) en remplaçant le bloc "TODO" par le vrai appel API.
async function initiateMobileMoney(req, res, next) {
  try {
    const { bookingId } = req.params;
    const { phoneNumber, provider } = req.body; // provider ex: "HolluPay"

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.userId !== req.auth.id) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }

    // TODO: remplacer par l'appel réel à l'API de l'agrégateur mobile money comorien
    // const response = await fetch(process.env.MOBILE_MONEY_API_URL + '/collect', { ... })
    const fakeTransactionRef = `MM-${Date.now()}`;

    const payment = await prisma.payment.update({
      where: { bookingId },
      data: {
        method: 'MOBILE_MONEY',
        provider: provider || 'HolluPay',
        transactionRef: fakeTransactionRef,
        status: 'PENDING',
      },
    });

    res.json({
      message: "Paiement initié. Confirmez la transaction sur votre téléphone (USSD/notification).",
      payment,
    });
  } catch (err) { next(err); }
}

// POST /api/payments/webhook  (callback de l'agrégateur mobile money)
async function paymentWebhook(req, res, next) {
  try {
    const { transactionRef, status } = req.body; // status: SUCCESS | FAILED
    const payment = await prisma.payment.findFirst({ where: { transactionRef } });
    if (!payment) return res.status(404).json({ message: "Paiement introuvable" });

    const newStatus = status === 'SUCCESS' ? 'PAID' : 'FAILED';
    await prisma.payment.update({ where: { id: payment.id }, data: { status: newStatus } });
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: newStatus,
        status: newStatus === 'PAID' ? 'CONFIRMED' : 'PENDING',
      },
    });
    res.json({ received: true });
  } catch (err) { next(err); }
}

// PATCH /api/payments/:bookingId/cash-confirm  (agence confirme paiement à bord)
async function confirmCashPayment(req, res, next) {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Réservation introuvable" });
    }
    await prisma.payment.update({
      where: { bookingId },
      data: { status: 'PAID' },
    });
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'PAID' },
    });
    try {
      req.app.get('io').to(`agency:${booking.agencyId}`).emit('booking:updated', updated);
    } catch (e) { /* ignore */ }
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = { initiateMobileMoney, paymentWebhook, confirmCashPayment };
