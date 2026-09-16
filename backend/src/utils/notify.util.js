const prisma = require('../config/db');
const { sendSms } = require('./sms.util');

// Point d'entrée unique pour notifier n'importe lequel des 4 types de comptes
// Raha (usager, admin agence, chauffeur d'agence, chauffeur indépendant).
// Chaque notification est (1) enregistrée en base — source de vérité,
// consultable même hors ligne — puis (2) diffusée en temps réel via
// Socket.io à la room du destinataire, si le serveur socket est disponible.
// L'envoi ne doit jamais faire échouer l'action métier qui l'a déclenché.

async function emit(io, room, event, payload) {
  try {
    if (io) io.to(room).emit(event, payload);
  } catch (e) { /* diffusion best-effort */ }
}

async function notifyUser(io, { userId, title, body, bookingId, smsTo }) {
  try {
    const notif = await prisma.notification.create({ data: { userId, title, body, bookingId } });
    await emit(io, `user:${userId}`, 'notification:new', notif);
    if (smsTo) await sendSms(smsTo, `${title} — ${body}`).catch(() => {});
    return notif;
  } catch (e) { return null; }
}

async function notifyAgency(io, { agencyId, title, body, bookingId, smsTo }) {
  try {
    const admins = await prisma.agencyAdmin.findMany({ where: { agencyId }, select: { id: true } });
    const notifs = await Promise.all(
      admins.map((a) => prisma.notification.create({ data: { agencyAdminId: a.id, title, body, bookingId } }))
    );
    await emit(io, `agency:${agencyId}`, 'notification:new', { title, body, bookingId });
    if (smsTo) await sendSms(smsTo, `${title} — ${body}`).catch(() => {});
    return notifs;
  } catch (e) { return null; }
}

async function notifyDriver(io, { driverId, title, body, bookingId, smsTo }) {
  try {
    const notif = await prisma.notification.create({ data: { driverId, title, body, bookingId } });
    await emit(io, `driver:${driverId}`, 'notification:new', notif);
    if (smsTo) await sendSms(smsTo, `${title} — ${body}`).catch(() => {});
    return notif;
  } catch (e) { return null; }
}

async function notifyIndependentDriver(io, { independentDriverId, title, body, bookingId, smsTo }) {
  try {
    const notif = await prisma.notification.create({ data: { independentDriverId, title, body, bookingId } });
    await emit(io, `independent:${independentDriverId}`, 'notification:new', notif);
    if (smsTo) await sendSms(smsTo, `${title} — ${body}`).catch(() => {});
    return notif;
  } catch (e) { return null; }
}

// Diffuse la mise à jour d'une réservation à toutes les parties concernées
// (rooms Socket.io) — indépendamment de la création de Notification en base.
async function broadcastBookingUpdate(io, booking) {
  try {
    if (!io) return;
    if (booking.userId) io.to(`user:${booking.userId}`).emit('booking:updated', booking);
    if (booking.agencyId) io.to(`agency:${booking.agencyId}`).emit('booking:updated', booking);
    if (booking.driverId) io.to(`driver:${booking.driverId}`).emit('booking:updated', booking);
    if (booking.independentDriverId) io.to(`independent:${booking.independentDriverId}`).emit('booking:updated', booking);
  } catch (e) { /* ignore */ }
}

module.exports = { notifyUser, notifyAgency, notifyDriver, notifyIndependentDriver, broadcastBookingUpdate };
