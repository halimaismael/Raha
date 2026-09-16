const prisma = require('../config/db');

// GET /api/agencies?city=Moroni  (public - utilisé par l'app mobile pour choisir une agence)
async function listAgencies(req, res, next) {
  try {
    const { city } = req.query;
    const agencies = await prisma.agency.findMany({
      where: {
        status: 'APPROVED',
        ...(city ? { city } : {}),
      },
      select: {
        id: true, name: true, description: true, logoUrl: true,
        city: true, phone: true,
        _count: { select: { vehicles: true, trips: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(agencies);
  } catch (err) { next(err); }
}

// GET /api/agencies/:id (public)
async function getAgency(req, res, next) {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: req.params.id },
      include: {
        vehicles: { where: { status: 'ACTIVE' } },
        trips: {
          where: { status: 'SCHEDULED', departureTime: { gte: new Date() } },
          orderBy: { departureTime: 'asc' },
          take: 20,
        },
      },
    });
    if (!agency) return res.status(404).json({ message: "Agence introuvable" });
    res.json(agency);
  } catch (err) { next(err); }
}

// PATCH /api/agencies/me (admin agence connecté)
async function updateMyAgency(req, res, next) {
  try {
    const { agencyId } = req.auth;
    const { name, description, logoUrl, phone, email, address, city } = req.body;
    const agency = await prisma.agency.update({
      where: { id: agencyId },
      data: { name, description, logoUrl, phone, email, address, city },
    });
    res.json(agency);
  } catch (err) { next(err); }
}

// GET /api/agencies/me (dashboard admin agence)
async function getMyAgency(req, res, next) {
  try {
    const { agencyId } = req.auth;
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        _count: { select: { vehicles: true, drivers: true, trips: true, bookings: true } },
      },
    });
    res.json(agency);
  } catch (err) { next(err); }
}

module.exports = { listAgencies, getAgency, updateMyAgency, getMyAgency };
