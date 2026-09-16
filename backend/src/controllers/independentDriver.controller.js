const prisma = require('../config/db');
const { nextIndependentDriverCode } = require('../utils/professionalCode.util');

// ---- Validation par Raha (rendez-vous) ----

// PATCH /api/independent-drivers/:id/validate  — réservé à l'équipe Raha.
// Protégé par requireAuth(['SUPER_ADMIN']) au niveau de la route (voir
// independentDriver.routes.js) : seul un compte super-admin connecté au
// tableau de bord "Agence Raha" peut valider un dossier. C'est cette étape
// — après le rendez-vous / la vérification du dossier du chauffeur — qui
// lui attribue enfin son identifiant professionnel unique et le rend
// visible des usagers.

async function approve(driver) {
  const professionalCode = driver.professionalCode || await nextIndependentDriverCode();
  const updated = await prisma.independentDriver.update({
    where: { id: driver.id },
    data: { status: 'APPROVED', professionalCode },
  });
  const { passwordHash, ...safe } = updated;
  return safe;
}

// GET /api/independent-drivers/pending — liste les chauffeurs en attente de
// validation (id, nom, téléphone), pour retrouver facilement le "id" à
// utiliser dans validateDriver ci-dessous.
async function listPending(req, res, next) {
  try {
    const drivers = await prisma.independentDriver.findMany({
      where: { status: 'PENDING' },
      select: { id: true, firstName: true, lastName: true, phone: true, zones: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(drivers);
  } catch (err) { next(err); }
}

async function validateDriver(req, res, next) {
  try {
    const driver = await prisma.independentDriver.findUnique({ where: { id: req.params.id } });
    if (!driver) return res.status(404).json({ message: "Chauffeur introuvable" });
    const safe = await approve(driver);
    res.json({ message: `Chauffeur validé. Son identifiant professionnel Raha est ${safe.professionalCode}.`, driver: safe });
  } catch (err) { next(err); }
}

// DELETE /api/independent-drivers/:id/reject — réservé à l'équipe Raha.
// Rejette une candidature encore en attente (PENDING) : le dossier est
// supprimé définitivement. Ne fait jamais rien à un chauffeur déjà validé
// (APPROVED) ou suspendu — dans ce cas, utiliser la suspension plutôt que
// le rejet, pour ne pas supprimer un professionnel déjà actif.
async function rejectDriver(req, res, next) {
  try {
    const driver = await prisma.independentDriver.findUnique({ where: { id: req.params.id } });
    if (!driver) return res.status(404).json({ message: "Chauffeur introuvable" });
    if (driver.status !== 'PENDING') {
      return res.status(400).json({ message: "Seul un dossier en attente peut être refusé (utilisez la suspension pour un chauffeur déjà validé)." });
    }
    await prisma.independentDriver.delete({ where: { id: req.params.id } });
    res.json({ message: `La candidature de ${driver.firstName} ${driver.lastName} a été refusée.` });
  } catch (err) { next(err); }
}

// PATCH /api/independent-drivers/validate-by-phone  { phone }  — même chose
// mais en retrouvant le chauffeur par son numéro de téléphone, pour éviter
// d'avoir à chercher son "id" au préalable.
async function validateDriverByPhone(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "phone requis" });
    const driver = await prisma.independentDriver.findUnique({ where: { phone } });
    if (!driver) return res.status(404).json({ message: "Aucun chauffeur avec ce numéro" });
    const safe = await approve(driver);
    res.json({ message: `Chauffeur validé. Son identifiant professionnel Raha est ${safe.professionalCode}.`, driver: safe });
  } catch (err) { next(err); }
}

// ---- Profil ----

// GET /api/independent-drivers/me
async function getMe(req, res, next) {
  try {
    const driver = await prisma.independentDriver.findUnique({
      where: { id: req.auth.id },
      include: { vehicles: true, pricingRules: true },
    });
    if (!driver) return res.status(404).json({ message: "Profil introuvable" });
    const { passwordHash, ...safe } = driver;
    res.json(safe);
  } catch (err) { next(err); }
}

// PATCH /api/independent-drivers/me
async function updateMe(req, res, next) {
  try {
    const { firstName, lastName, photoUrl, bio, zones, services, licenseNumber } = req.body;
    const updated = await prisma.independentDriver.update({
      where: { id: req.auth.id },
      data: {
        firstName, lastName, photoUrl, bio,
        zones: Array.isArray(zones) ? zones : undefined,
        services: Array.isArray(services) ? services : undefined,
        licenseNumber,
      },
    });
    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (err) { next(err); }
}

// GET /api/independent-drivers/:id  (public — fiche consultée par l'usager)
async function getPublicProfile(req, res, next) {
  try {
    const driver = await prisma.independentDriver.findUnique({
      where: { id: req.params.id },
      include: {
        vehicles: { where: { status: 'ACTIVE' } },
        pricingRules: true,
      },
    });
    if (!driver || driver.status !== 'APPROVED') {
      return res.status(404).json({ message: "Chauffeur introuvable" });
    }
    const { passwordHash, email, ...safe } = driver;
    res.json(safe);
  } catch (err) { next(err); }
}

// GET /api/independent-drivers  (public — annuaire pour l'usager)
async function listIndependentDrivers(req, res, next) {
  try {
    const { city } = req.query;
    const drivers = await prisma.independentDriver.findMany({
      where: {
        status: 'APPROVED',
        ...(city ? { zones: { has: city } } : {}),
      },
      select: {
        id: true, professionalCode: true, firstName: true, lastName: true,
        photoUrl: true, bio: true, zones: true, services: true,
        _count: { select: { vehicles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(drivers);
  } catch (err) { next(err); }
}

// ---- Tarifs personnalisés (point 13 du cahier des charges) ----

// GET /api/independent-drivers/me/pricing
async function listMyPricing(req, res, next) {
  try {
    const rules = await prisma.driverPricing.findMany({
      where: { independentDriverId: req.auth.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json(rules);
  } catch (err) { next(err); }
}

// POST /api/independent-drivers/me/pricing  { kind, amount, label? }
async function createPricing(req, res, next) {
  try {
    const { kind, amount, label } = req.body;
    const validKinds = ['MINIMUM', 'PER_TRIP', 'PER_KM', 'FULL_DAY', 'AIRPORT', 'HOURLY', 'CUSTOM'];
    if (!validKinds.includes(kind) || typeof amount !== 'number') {
      return res.status(400).json({ message: "kind et amount (nombre) requis" });
    }
    const rule = await prisma.driverPricing.create({
      data: { independentDriverId: req.auth.id, kind, amount, label: label || null },
    });
    res.status(201).json(rule);
  } catch (err) { next(err); }
}

// PATCH /api/independent-drivers/me/pricing/:id
async function updatePricing(req, res, next) {
  try {
    const rule = await prisma.driverPricing.findUnique({ where: { id: req.params.id } });
    if (!rule || rule.independentDriverId !== req.auth.id) {
      return res.status(404).json({ message: "Tarif introuvable" });
    }
    const { kind, amount, label } = req.body;
    const updated = await prisma.driverPricing.update({
      where: { id: req.params.id },
      data: { kind, amount, label },
    });
    res.json(updated);
  } catch (err) { next(err); }
}

// DELETE /api/independent-drivers/me/pricing/:id
async function deletePricing(req, res, next) {
  try {
    const rule = await prisma.driverPricing.findUnique({ where: { id: req.params.id } });
    if (!rule || rule.independentDriverId !== req.auth.id) {
      return res.status(404).json({ message: "Tarif introuvable" });
    }
    await prisma.driverPricing.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// ---- Disponibilité (point 19 du cahier des charges) ----

// GET /api/independent-drivers/me/availability
async function listMyAvailability(req, res, next) {
  try {
    const entries = await prisma.driverAvailability.findMany({
      where: { independentDriverId: req.auth.id },
      orderBy: { date: 'asc' },
    });
    res.json(entries);
  } catch (err) { next(err); }
}

// PUT /api/independent-drivers/me/availability  { date, status, startTime?, endTime? }
async function setMyAvailability(req, res, next) {
  try {
    const { date, status, startTime, endTime } = req.body;
    if (!date || !['AVAILABLE', 'UNAVAILABLE'].includes(status)) {
      return res.status(400).json({ message: "date et status ('AVAILABLE' | 'UNAVAILABLE') requis" });
    }
    const day = new Date(date);
    const dayOnly = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
    const entry = await prisma.driverAvailability.upsert({
      where: { independentDriverId_date: { independentDriverId: req.auth.id, date: dayOnly } },
      update: { status, startTime, endTime },
      create: { independentDriverId: req.auth.id, date: dayOnly, status, startTime, endTime },
    });
    res.json(entry);
  } catch (err) { next(err); }
}

module.exports = {
  listPending, validateDriver, validateDriverByPhone, rejectDriver,
  getMe, updateMe, getPublicProfile, listIndependentDrivers,
  listMyPricing, createPricing, updatePricing, deletePricing,
  listMyAvailability, setMyAvailability,
};
