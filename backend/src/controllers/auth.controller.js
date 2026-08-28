const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');

// -------- USAGERS (App mobile) --------

async function registerUser(req, res, next) {
  try {
    const { firstName, lastName, phone, email, password } = req.body;
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(409).json({ message: "Ce numéro est déjà utilisé" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { firstName, lastName, phone, email, passwordHash },
    });
    const token = signToken({ id: user.id, role: 'USER' });
    res.status(201).json({
      token,
      user: { id: user.id, firstName, lastName, phone, email },
    });
  } catch (err) {
    next(err);
  }
}

async function loginUser(req, res, next) {
  try {
    const { phone, password } = req.body;
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return res.status(401).json({ message: "Identifiants incorrects" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });
    const token = signToken({ id: user.id, role: 'USER' });
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------- ADMIN AGENCE (Plateforme web) --------

async function loginAgencyAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    const admin = await prisma.agencyAdmin.findUnique({
      where: { email },
      include: { agency: true },
    });
    if (!admin) return res.status(401).json({ message: "Identifiants incorrects" });
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });
    if (admin.agency.status !== 'APPROVED') {
      return res.status(403).json({ message: "Votre agence n'est pas encore validée par la plateforme" });
    }
    const token = signToken({ id: admin.id, role: 'AGENCY_ADMIN', agencyId: admin.agencyId });
    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      agency: { id: admin.agency.id, name: admin.agency.name, status: admin.agency.status, type: admin.agency.type },
    });
  } catch (err) {
    next(err);
  }
}

// Une agence OU un particulier s'inscrit sur la plateforme.
// Le compte est activé immédiatement (auto-approuvé) : il n'existe pas encore
// de tableau de bord super-admin pour valider manuellement les demandes, donc
// les laisser en PENDING les rendrait invisibles indéfiniment (ni sur l'app
// mobile, ni sur la connexion agence).
async function registerAgency(req, res, next) {
  try {
    const {
      agencyName, city, phone, email, address, adminName, adminEmail, password, type,
      licenseB, licenseType, ownsVehicle, appointmentDate,
    } = req.body;
    if (!agencyName || !adminEmail || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const existingAdmin = await prisma.agencyAdmin.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) return res.status(409).json({ message: "Cet email admin est déjà utilisé" });

    const passwordHash = await bcrypt.hash(password, 10);
    const agency = await prisma.agency.create({
      data: {
        name: agencyName,
        city,
        phone,
        email,
        address,
        type: type === 'PARTICULIER' ? 'PARTICULIER' : 'AGENCE',
        status: 'APPROVED',
        licenseB: typeof licenseB === 'boolean' ? licenseB : undefined,
        licenseType: licenseType || undefined,
        ownsVehicle: typeof ownsVehicle === 'boolean' ? ownsVehicle : undefined,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
        admins: {
          create: { name: adminName, email: adminEmail, passwordHash, role: 'OWNER' },
        },
      },
      include: { admins: true },
    });
    res.status(201).json({
      message: "Votre compte a été créé. Vous pouvez dès à présent vous connecter.",
      agency: { id: agency.id, name: agency.name, status: agency.status, type: agency.type },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerUser, loginUser, loginAgencyAdmin, registerAgency };
