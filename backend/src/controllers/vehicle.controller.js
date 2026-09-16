const prisma = require('../config/db');
const { findConflictingBooking, isDriverUnavailableOnDate } = require('../utils/availability.util');

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

const AVERAGE_SPEED_KMH = 28;

// GET /api/vehicles/search?type=VOITURE&city=Moroni&source=AGENCY|INDEPENDENT
//   &scheduledDate=2026-08-30T09:00:00Z&scheduledEndDate=...   (public - app mobile)
//
// IMPORTANT : si scheduledDate est fourni, seuls les véhicules réellement
// disponibles pour CE créneau précis sont retournés — un véhicule déjà
// réservé sur ce créneau, ou dont le chauffeur indépendant s'est déclaré
// indisponible ce jour-là, n'apparaît jamais dans le fil de résultats.
async function searchVehicles(req, res, next) {
  try {
    const { type, city, pickupLat, pickupLng, source, scheduledDate, scheduledEndDate } = req.query;

    // Par défaut, la recherche mélange les véhicules d'agence ET ceux des
    // chauffeurs indépendants — le backend est la seule source de vérité,
    // l'usager n'a pas à savoir "où" est stocké le véhicule.
    const orBranches = [];
    if (source !== 'INDEPENDENT') {
      orBranches.push({ agency: { status: 'APPROVED', ...(city ? { city } : {}) } });
    }
    if (source !== 'AGENCY') {
      orBranches.push({ independentDriver: { status: 'APPROVED', ...(city ? { zones: { has: city } } : {}) } });
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'ACTIVE',
        ...(type ? { type } : {}),
        OR: orBranches,
      },
      include: {
        agency: { select: { id: true, name: true, city: true, logoUrl: true, type: true, professionalCode: true } },
        independentDriver: { select: { id: true, firstName: true, lastName: true, photoUrl: true, professionalCode: true, zones: true } },
        drivers: true,
      },
      orderBy: { basePrice: 'asc' },
    });

    // Filtrage "disponibilité réelle" pour le créneau demandé — c'est le
    // point le plus important : ne jamais proposer un véhicule qui ne peut
    // pas effectuer ce trajet précis.
    let available = vehicles;
    if (scheduledDate) {
      const checks = await Promise.all(
        vehicles.map(async (v) => {
          const conflict = await findConflictingBooking({
            vehicleId: v.id,
            start: scheduledDate,
            end: scheduledEndDate || null,
          });
          if (conflict) return false;
          if (v.independentDriverId) {
            const unavailable = await isDriverUnavailableOnDate({
              independentDriverId: v.independentDriverId,
              date: scheduledDate,
            });
            if (unavailable) return false;
          }
          return true;
        })
      );
      available = vehicles.filter((_, i) => checks[i]);
    }

    if (pickupLat && pickupLng) {
      const lat = Number(pickupLat);
      const lng = Number(pickupLng);
      const withEta = available.map((v) => {
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

    res.json(available);
  } catch (err) { next(err); }
}

// ---- Location de voiture (point 4 du dernier cahier des charges) ----
// Un véhicule peut être mis en location par son propriétaire (agence ou
// chauffeur indépendant) pour une période donnée (ex : du 1er au 7
// septembre). Les "jours restants" ne sont jamais stockés directement : ils
// se calculent toujours comme totalDays - bookedDays, pour ne jamais risquer
// une incohérence entre plusieurs réservations simultanées.

function daysBetweenInclusive(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const ms = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
    - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  return Math.round(ms / 86400000) + 1;
}

// GET /api/vehicles/rental-search?type=&brand=&ownerType=AGENCE|PARTICULIER (public)
// Ne renvoie que les véhicules ayant au moins une période de location active
// avec des jours encore disponibles aujourd'hui.
async function searchRentalVehicles(req, res, next) {
  try {
    const { type, brand, ownerType } = req.query;
    const orBranches = [];
    if (ownerType !== 'PARTICULIER') orBranches.push({ agency: { status: 'APPROVED' } });
    if (ownerType !== 'AGENCE') orBranches.push({ independentDriver: { status: 'APPROVED' } });

    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'ACTIVE',
        ...(type ? { type } : {}),
        ...(brand ? { brand: { contains: brand, mode: 'insensitive' } } : {}),
        OR: orBranches,
        rentalPeriods: { some: { active: true, endDate: { gte: new Date() } } },
      },
      include: {
        agency: { select: { id: true, name: true, city: true, logoUrl: true, type: true, professionalCode: true } },
        independentDriver: { select: { id: true, firstName: true, lastName: true, photoUrl: true, professionalCode: true, zones: true } },
        rentalPeriods: { where: { active: true, endDate: { gte: new Date() } }, orderBy: { startDate: 'asc' } },
      },
      orderBy: { basePrice: 'asc' },
    });

    const withAvailability = vehicles
      .map((v) => {
        const periods = v.rentalPeriods
          .map((p) => ({ ...p, remainingDays: Math.max(0, p.totalDays - p.bookedDays) }))
          .filter((p) => p.remainingDays > 0);
        return { ...v, rentalPeriods: periods };
      })
      .filter((v) => v.rentalPeriods.length > 0);

    res.json(withAvailability);
  } catch (err) { next(err); }
}

// POST /api/vehicles/:id/rental-periods  { startDate, endDate }  (propriétaire du véhicule)
async function createRentalPeriod(req, res, next) {
  try {
    const vehicle = await assertOwnership(req);
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ message: "startDate et endDate requis" });
    const totalDays = daysBetweenInclusive(startDate, endDate);
    if (totalDays < 1) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début" });
    }
    const period = await prisma.vehicleRentalPeriod.create({
      data: {
        vehicleId: vehicle.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalDays,
      },
    });
    res.status(201).json(period);
  } catch (err) { next(err); }
}

// GET /api/vehicles/:id/rental-periods  (propriétaire du véhicule)
async function listRentalPeriods(req, res, next) {
  try {
    const vehicle = await assertOwnership(req);
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });
    const periods = await prisma.vehicleRentalPeriod.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: { startDate: 'desc' },
    });
    res.json(periods.map((p) => ({ ...p, remainingDays: Math.max(0, p.totalDays - p.bookedDays) })));
  } catch (err) { next(err); }
}

async function assertPeriodOwnership(req) {
  const period = await prisma.vehicleRentalPeriod.findUnique({ where: { id: req.params.periodId } });
  if (!period) return null;
  const vehicle = await prisma.vehicle.findUnique({ where: { id: period.vehicleId } });
  if (!vehicle) return null;
  const where = ownerWhere(req.auth);
  if (where.agencyId && vehicle.agencyId !== where.agencyId) return null;
  if (where.independentDriverId && vehicle.independentDriverId !== where.independentDriverId) return null;
  return period;
}

// PATCH /api/vehicles/rental-periods/:periodId  { active }  (propriétaire)
async function updateRentalPeriod(req, res, next) {
  try {
    const period = await assertPeriodOwnership(req);
    if (!period) return res.status(404).json({ message: "Période de location introuvable" });
    const { active } = req.body;
    const updated = await prisma.vehicleRentalPeriod.update({
      where: { id: period.id },
      data: { active: typeof active === 'boolean' ? active : period.active },
    });
    res.json({ ...updated, remainingDays: Math.max(0, updated.totalDays - updated.bookedDays) });
  } catch (err) { next(err); }
}

// DELETE /api/vehicles/rental-periods/:periodId  (propriétaire — uniquement si aucun jour n'a été réservé)
async function deleteRentalPeriod(req, res, next) {
  try {
    const period = await assertPeriodOwnership(req);
    if (!period) return res.status(404).json({ message: "Période de location introuvable" });
    if (period.bookedDays > 0) {
      return res.status(400).json({ message: "Impossible de supprimer une période déjà réservée — désactivez-la plutôt." });
    }
    await prisma.vehicleRentalPeriod.delete({ where: { id: period.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// GET /api/vehicles/:id (public)
async function getVehicle(req, res, next) {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        agency: true,
        independentDriver: { select: { id: true, firstName: true, lastName: true, photoUrl: true, professionalCode: true, phone: true } },
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

// ---- Gestion par le professionnel connecté (agence OU chauffeur indépendant) ----

function ownerWhere(auth) {
  return auth.role === 'INDEPENDENT_DRIVER'
    ? { independentDriverId: auth.id }
    : { agencyId: auth.agencyId };
}

// GET /api/vehicles/mine
async function listMyVehicles(req, res, next) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: ownerWhere(req.auth),
      orderBy: { createdAt: 'desc' },
    });
    res.json(vehicles);
  } catch (err) { next(err); }
}

// POST /api/vehicles
async function createVehicle(req, res, next) {
  try {
    const { type, brand, model, plateNumber, seatCapacity, photoUrl, features, basePrice, pricePerKm, transmission, year, description } = req.body;
    if (!type || !brand || !model || !plateNumber || !seatCapacity || !basePrice) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const vehicle = await prisma.vehicle.create({
      data: {
        ...ownerWhere(req.auth),
        type, brand, model, plateNumber,
        seatCapacity: Number(seatCapacity),
        photoUrl,
        features: features || [],
        transmission: transmission || null,
        year: year ? Number(year) : null,
        description: description || null,
        basePrice: Number(basePrice),
        pricePerKm: pricePerKm ? Number(pricePerKm) : null,
      },
    });
    res.status(201).json(vehicle);
  } catch (err) { next(err); }
}

async function assertOwnership(req) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) return null;
  const where = ownerWhere(req.auth);
  if (where.agencyId && vehicle.agencyId !== where.agencyId) return null;
  if (where.independentDriverId && vehicle.independentDriverId !== where.independentDriverId) return null;
  return vehicle;
}

// PATCH /api/vehicles/:id
async function updateVehicle(req, res, next) {
  try {
    const vehicle = await assertOwnership(req);
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });
    const { agencyId, independentDriverId, ...safeBody } = req.body;
    const updated = await prisma.vehicle.update({ where: { id: req.params.id }, data: safeBody });
    res.json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/vehicles/:id
async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await assertOwnership(req);
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// PATCH /api/vehicles/:id/location — l'agence/le chauffeur indique où se trouve son véhicule maintenant
async function updateVehicleLocation(req, res, next) {
  try {
    const vehicle = await assertOwnership(req);
    if (!vehicle) return res.status(404).json({ message: "Véhicule introuvable" });
    const { lat, lng } = req.body;
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { currentLat: Number(lat), currentLng: Number(lng), locationUpdatedAt: new Date() },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

module.exports = {
  searchVehicles, getVehicle, listMyVehicles, createVehicle, updateVehicle, deleteVehicle, updateVehicleLocation,
  searchRentalVehicles, createRentalPeriod, listRentalPeriods, updateRentalPeriod, deleteRentalPeriod,
};
