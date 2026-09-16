const prisma = require('../config/db');

// GET /api/trips/search?origin=Moroni&destination=Mitsamiouli&date=2026-08-10&type=BUS
// (public - recherche façon Uber pour l'app mobile)
async function searchTrips(req, res, next) {
  try {
    const { origin, destination, date, type } = req.query;

    const dayStart = date ? new Date(date) : null;
    const dayEnd = date ? new Date(new Date(date).setHours(23, 59, 59, 999)) : null;

    const trips = await prisma.trip.findMany({
      where: {
        status: 'SCHEDULED',
        ...(origin ? { originName: { contains: origin, mode: 'insensitive' } } : {}),
        ...(destination ? { destinationName: { contains: destination, mode: 'insensitive' } } : {}),
        ...(date ? { departureTime: { gte: dayStart, lte: dayEnd } } : { departureTime: { gte: new Date() } }),
        ...(type ? { vehicle: { type } } : {}),
      },
      include: {
        agency: { select: { id: true, name: true, logoUrl: true, city: true } },
        vehicle: true,
        driver: true,
      },
      orderBy: { departureTime: 'asc' },
    });
    res.json(trips);
  } catch (err) { next(err); }
}

// GET /api/trips/:id (public)
async function getTrip(req, res, next) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { agency: true, vehicle: true, driver: true },
    });
    if (!trip) return res.status(404).json({ message: "Trajet introuvable" });
    res.json(trip);
  } catch (err) { next(err); }
}

// ---- Gestion admin agence ----

// GET /api/trips/mine
async function listMyTrips(req, res, next) {
  try {
    const trips = await prisma.trip.findMany({
      where: { agencyId: req.auth.agencyId },
      include: { vehicle: true, driver: true, _count: { select: { bookings: true } } },
      orderBy: { departureTime: 'desc' },
    });
    res.json(trips);
  } catch (err) { next(err); }
}

// POST /api/trips  (créer un trajet programmé : ex. Bus Moroni -> Mitsamiouli demain 9h)
async function createTrip(req, res, next) {
  try {
    const {
      vehicleId, driverId, originName, originLat, originLng,
      destinationName, destinationLat, destinationLng,
      departureTime, estimatedArrival, distanceKm, pricePerSeat,
    } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Véhicule introuvable pour cette agence" });
    }

    const trip = await prisma.trip.create({
      data: {
        agencyId: req.auth.agencyId,
        vehicleId,
        driverId: driverId || null,
        originName, originLat: Number(originLat), originLng: Number(originLng),
        destinationName, destinationLat: Number(destinationLat), destinationLng: Number(destinationLng),
        departureTime: new Date(departureTime),
        estimatedArrival: estimatedArrival ? new Date(estimatedArrival) : null,
        distanceKm: distanceKm ? Number(distanceKm) : null,
        pricePerSeat: Number(pricePerSeat),
        totalSeats: vehicle.seatCapacity,
      },
    });
    res.status(201).json(trip);
  } catch (err) { next(err); }
}

// PATCH /api/trips/:id/status  { status: 'BOARDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' }
async function updateTripStatus(req, res, next) {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip || trip.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Trajet introuvable" });
    }
    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = { searchTrips, getTrip, listMyTrips, createTrip, updateTripStatus };
