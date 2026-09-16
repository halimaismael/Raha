const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { nextAgencyDriverCode } = require('../utils/professionalCode.util');

// ---- Gestion par l'admin agence ----

async function listMyDrivers(req, res, next) {
  try {
    const drivers = await prisma.driver.findMany({
      where: { agencyId: req.auth.agencyId },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(drivers);
  } catch (err) { next(err); }
}

// Un chauffeur reçoit automatiquement son identifiant professionnel Raha
// (RAHA-CH-xxxxxx) — jamais choisi par l'agence ni par le chauffeur.
// Son compte de connexion (mot de passe) reste inactif tant que l'agence
// ne l'a pas explicitement activé (voir activateDriver ci-dessous) : cela
// évite de créer un accès avant que le chauffeur n'ait un mot de passe.
async function createDriver(req, res, next) {
  try {
    const { name, phone, licenseNumber, photoUrl, vehicleId } = req.body;
    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const existing = await prisma.driver.findUnique({ where: { phone } });
    if (existing) return res.status(409).json({ message: "Ce numéro est déjà utilisé par un autre chauffeur" });

    const professionalCode = await nextAgencyDriverCode();
    const driver = await prisma.driver.create({
      data: {
        agencyId: req.auth.agencyId,
        professionalCode,
        name, phone, licenseNumber, photoUrl,
        vehicleId: vehicleId || null,
      },
    });
    res.status(201).json(driver);
  } catch (err) { next(err); }
}

async function updateDriver(req, res, next) {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver || driver.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Chauffeur introuvable" });
    }
    // On ne laisse jamais modifier le code professionnel ou le mot de passe par cette route.
    const { professionalCode, passwordHash, ...safeBody } = req.body;
    const updated = await prisma.driver.update({ where: { id: req.params.id }, data: safeBody });
    res.json(updated);
  } catch (err) { next(err); }
}

async function deleteDriver(req, res, next) {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver || driver.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Chauffeur introuvable" });
    }
    await prisma.driver.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
}

// PATCH /api/drivers/:id/activate  { password }  — l'agence définit le mot de
// passe initial du chauffeur, qui peut ensuite se connecter à sa propre
// application avec son numéro de téléphone (voir loginDriver).
async function activateDriver(req, res, next) {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver || driver.agencyId !== req.auth.agencyId) {
      return res.status(404).json({ message: "Chauffeur introuvable" });
    }
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ message: "Mot de passe requis (4 caractères minimum)" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: { passwordHash, active: true },
    });
    res.json({
      message: `Compte activé. Le chauffeur peut se connecter avec le numéro ${driver.phone}.`,
      driver: { id: updated.id, professionalCode: updated.professionalCode, phone: updated.phone },
    });
  } catch (err) { next(err); }
}

// ---- Espace du chauffeur d'agence lui-même (une fois connecté) ----

async function getMe(req, res, next) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.auth.id },
      include: { agency: { select: { id: true, name: true, professionalCode: true, logoUrl: true } }, vehicle: true },
    });
    if (!driver) return res.status(404).json({ message: "Chauffeur introuvable" });
    const { passwordHash, ...safe } = driver;
    res.json(safe);
  } catch (err) { next(err); }
}

async function updateMe(req, res, next) {
  try {
    const { name, photoUrl } = req.body;
    const updated = await prisma.driver.update({
      where: { id: req.auth.id },
      data: { name, photoUrl },
    });
    const { passwordHash, ...safe } = updated;
    res.json(safe);
  } catch (err) { next(err); }
}

// GET /api/drivers/me/availability  — calendrier de dispo du chauffeur d'agence
async function listMyAvailability(req, res, next) {
  try {
    const entries = await prisma.driverAvailability.findMany({
      where: { driverId: req.auth.id },
      orderBy: { date: 'asc' },
    });
    res.json(entries);
  } catch (err) { next(err); }
}

// PUT /api/drivers/me/availability  { date, status, startTime?, endTime? }
async function setMyAvailability(req, res, next) {
  try {
    const { date, status, startTime, endTime } = req.body;
    if (!date || !['AVAILABLE', 'UNAVAILABLE'].includes(status)) {
      return res.status(400).json({ message: "date et status ('AVAILABLE' | 'UNAVAILABLE') requis" });
    }
    const day = new Date(date);
    const dayOnly = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
    const entry = await prisma.driverAvailability.upsert({
      where: { driverId_date: { driverId: req.auth.id, date: dayOnly } },
      update: { status, startTime, endTime },
      create: { driverId: req.auth.id, date: dayOnly, status, startTime, endTime },
    });
    res.json(entry);
  } catch (err) { next(err); }
}

module.exports = {
  listMyDrivers, createDriver, updateDriver, deleteDriver, activateDriver,
  getMe, updateMe, listMyAvailability, setMyAvailability,
};
