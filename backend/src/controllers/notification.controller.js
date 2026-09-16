const prisma = require('../config/db');

// Une seule table de notifications pour les 4 types de comptes Raha —
// on filtre simplement sur la bonne colonne selon le rôle du token JWT.
function recipientWhere(auth) {
  switch (auth.role) {
    case 'USER': return { userId: auth.id };
    case 'AGENCY_ADMIN': return { agencyAdminId: auth.id };
    case 'AGENCY_DRIVER': return { driverId: auth.id };
    case 'INDEPENDENT_DRIVER': return { independentDriverId: auth.id };
    default: return { id: 'none' }; // ne matche jamais
  }
}

async function listMyNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: recipientWhere(req.auth),
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) { next(err); }
}

async function markAsRead(req, res, next) {
  try {
    const notif = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notif) return res.status(404).json({ message: "Notification introuvable" });
    const where = recipientWhere(req.auth);
    const key = Object.keys(where)[0];
    if (notif[key] !== where[key]) return res.status(404).json({ message: "Notification introuvable" });
    const updated = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = { listMyNotifications, markAsRead };
