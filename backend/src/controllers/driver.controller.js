const prisma = require('../config/db');

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

async function createDriver(req, res, next) {
  try {
    const { name, phone, licenseNumber, photoUrl, vehicleId } = req.body;
    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const driver = await prisma.driver.create({
      data: { agencyId: req.auth.agencyId, name, phone, licenseNumber, photoUrl, vehicleId: vehicleId || null },
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
    const updated = await prisma.driver.update({ where: { id: req.params.id }, data: req.body });
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

module.exports = { listMyDrivers, createDriver, updateDriver, deleteDriver };
