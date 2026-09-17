const prisma = require('../config/db');

// GET /api/tracking/:tripId/last
// Retourne la dernière position GPS connue d'un trajet (utilisée par l'app
// mobile pour afficher un point de départ avant de recevoir les mises à jour
// en temps réel via Socket.io — voir src/sockets/tracking.socket.js).
async function getLastLocation(req, res, next) {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ message: "Trajet introuvable" });

    const lastPing = await prisma.locationPing.findFirst({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastPing) return res.status(404).json({ message: "Aucune position disponible pour ce trajet" });

    res.json(lastPing);
  } catch (err) { next(err); }
}

module.exports = { getLastLocation };
