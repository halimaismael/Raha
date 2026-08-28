const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/tracking/:tripId/last  -> dernière position connue du véhicule
router.get('/:tripId/last', async (req, res, next) => {
  try {
    const last = await prisma.locationPing.findFirst({
      where: { tripId: req.params.tripId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(last || null);
  } catch (err) { next(err); }
});

// POST /api/tracking/:tripId/ping  -> (fallback REST, normalement via Socket.io)
// Utilisé par l'app chauffeur / agence pour publier la position GPS
router.post('/:tripId/ping', requireAuth(['AGENCY_ADMIN']), async (req, res, next) => {
  try {
    const { lat, lng, heading, speedKmh } = req.body;
    const ping = await prisma.locationPing.create({
      data: { tripId: req.params.tripId, lat, lng, heading, speedKmh },
    });
    const io = req.app.get('io');
    io.to(`trip:${req.params.tripId}`).emit('location:update', ping);
    res.status(201).json(ping);
  } catch (err) { next(err); }
});

module.exports = router;
