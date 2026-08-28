const prisma = require('../config/db');

// Distance à vol d'oiseau (km) entre deux points GPS — formule de Haversine
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Vitesse moyenne estimée en ville / sur route comorienne, pour estimer un temps d'arrivée
const AVERAGE_SPEED_KMH = 28;

// GET /api/vehicles/search?type=VOITURE&city=Moroni&purpose=...&pickupLat=...&pickupLng=...  (public - app mobile)
async function searchVehicles(req, res, next) {
  try {
    const { type, city, pickupLat, pickupLng, ownerType } = req.query;
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'ACTIVE',
        ...(type ? { type } : {}),
        agency: {
          status: 'APPROVED',
          ...(city ? { city } : {}),
          ...(ownerType ? { type: ownerType } : {}),
        },
      },
      include: { agency: { select: { id: true, name: true, city: true, logoUrl: true, type: true } }, drivers: true },
      orderBy: { basePrice: 'asc' },
    });

    // Si la position de départ du client est fournie, on calcule la distance et le temps d'arrivée estimé
    // pour chaque véhicule dont la position actuelle est connue, et on trie par proximité.
    if (pickupLat && pickupLng) {
      const lat = Number(pickupLat);
      const lng = Number(pickupLng);
      const withEta = vehicles.map((v) => {
        if (v.currentLat != null && v.currentLng != null) {
          const dist = distanceKm(lat, lng, v.currentLat, v.currentLng);
          const etaMinutes = Math.max(2, Math.round((dist / AVERAGE_SPEED_KMH) * 60));
          return { ...v, distanceKm: Math.round(dist * 10) / 10, etaMinutes };
        }
        return { ...v, distanceKm: null, etaMinutes: null };
      });
      withEta.sort((a, b) => {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      });
      return res.json(withEta);
    }

    res.json(vehicles);
  } catch (err) { next(err); }
}

// GET /api/vehicles/:id (public)
async function getVehicle(req, res, next) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        agency: true,
        drivers: true,
        trips: {
          where: { status: 'SCHEDULED', departureTime: { gte: new Date() } },
          orderBy: { departureTime: 'asc' },
        },
      },
    });
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });
    res.json(vehicle);
  } catch (err) { next(err); }
}

// ---- Gestion par l'admin agence ----

// GET /api/vehicles/mine
async function listMyVehicles(req, res, next) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { agencyId: req.auth.agencyId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vehicles);
  } catch (err) { next(err); }
}

// POST /api/vehicles
async function createVehicle(req, res, next) {
  try {
    const { type, brand, model, plateNumber, seatCapacity, photoUrl, features, basePrice, pricePerKm } = req.body;
    if (!type || !brand || !model || !plateNumber || !seatCapacity || !basePrice) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const vehicle = await prisma.vehicle.create({
      data: {
        agencyId: req.auth.agencyId,
        type, brand, model, plateNumber,
        seatCapacity: Number(seatCapacity),
        photoUrl,
        features: features || [],
        basePrice: Number(basePrice),
        pricePerKm: pricePerKm ? Number(pricePerKm) : null,
      },
    });
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
}

// PATCH /api/vehicles/:id
async function updateVehicle(req, res, next) {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle || vehicle.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Véhicule introuvable" });
    }
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/vehicles/:id
async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle || vehicle.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Véhicule introuvable" });
    }
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// PATCH /api/vehicles/:id/location  — l'agence/le particulier indique où se trouve son véhicule maintenant
async function updateVehicleLocation(req, res, next) {
  try {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehicle || vehicle.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Véhicule introuvable" });
    }
    const { lat, lng } = req.body;
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { currentLat: Number(lat), currentLng: Number(lng), locationUpdatedAt: new Date() },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = { searchVehicles, getVehicle, listMyVehicles, createVehicle, updateVehicle, deleteVehicle, updateVehicleLocation };
