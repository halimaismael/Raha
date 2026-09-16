const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');
const { nextAgencyCode } = require('../utils/professionalCode.util');

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
      agency: {
        id: admin.agency.id,
        name: admin.agency.name,
        status: admin.agency.status,
        type: admin.agency.type,
        professionalCode: admin.agency.professionalCode,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Une agence s'inscrit sur la plateforme. Reçoit automatiquement un
// identifiant professionnel unique RAHA-AG-xxxxxx, généré par Raha.
// Le compte est activé immédiatement (auto-approuvé) : il n'existe pas encore
// de tableau de bord super-admin pour valider manuellement les demandes, donc
// les laisser en PENDING les rendrait invisibles indéfiniment.
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
    const professionalCode = await nextAgencyCode();
    const agency = await prisma.agency.create({
      data: {
        professionalCode,
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
      message: `Votre compte a été créé. Votre identifiant professionnel Raha est ${professionalCode}. Vous pouvez dès à présent vous connecter.`,
      agency: { id: agency.id, name: agency.name, status: agency.status, type: agency.type, professionalCode },
    });
  } catch (err) {
    next(err);
  }
}

// -------- CHAUFFEUR INDÉPENDANT (App mobile — espace "Je suis un professionnel") --------

async function registerIndependentDriver(req, res, next) {
  try {
    const { firstName, lastName, phone, email, password, bio, zones, services, licenseNumber } = req.body;
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    const existing = await prisma.independentDriver.findUnique({ where: { phone } });
    if (existing) return res.status(409).json({ message: "Ce numéro est déjà utilisé" });

    // Important : contrairement à une agence, un chauffeur indépendant n'est
    // PAS immédiatement un professionnel validé. Son compte de connexion
    // (téléphone + mot de passe) est créé tout de suite pour qu'il puisse
    // déjà utiliser l'application, mais il reste en attente ("PENDING") et
    // n'a PAS encore d'identifiant professionnel Raha. Ce n'est qu'après
    // vérification de son dossier par Raha (rendez-vous) qu'il est validé et
    // qu'un identifiant unique (RAHA-CH-xxxxxx) lui est attribué — voir
    // validateIndependentDriver dans independentDriver.controller.js.
    const passwordHash = await bcrypt.hash(password, 10);
    const driver = await prisma.independentDriver.create({
      data: {
        firstName, lastName, phone, email, passwordHash,
        bio: bio || undefined,
        zones: Array.isArray(zones) ? zones : [],
        services: Array.isArray(services) ? services : [],
        licenseNumber: licenseNumber || undefined,
        status: 'PENDING',
      },
    });
    const token = signToken({ id: driver.id, role: 'INDEPENDENT_DRIVER' });
    res.status(201).json({
      message: "Votre compte a été créé et vous pouvez déjà vous connecter. Votre identifiant professionnel Raha vous sera attribué après validation de votre dossier par notre équipe.",
      token,
      driver: {
        id: driver.id, professionalCode: null, firstName, lastName, phone, email, status: driver.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function loginIndependentDriver(req, res, next) {
  try {
    // La connexion se fait obligatoirement avec l'identifiant professionnel
    // Raha (RAHA-CH-xxxxxx) une fois qu'il a été attribué. Tant que le
    // dossier est en attente de validation (statut PENDING), le chauffeur
    // n'a pas encore de code : le numéro de téléphone reste alors accepté,
    // uniquement pour lui permettre de revenir consulter l'état de son
    // dossier. Une fois validé (APPROVED), la connexion par téléphone est
    // explicitement refusée.
    const { identifier, phone, professionalCode, password } = req.body;
    const value = identifier || professionalCode || phone;
    if (!value || !password) return res.status(400).json({ message: "Identifiant et mot de passe requis" });
    const driver = await prisma.independentDriver.findFirst({
      where: { OR: [{ phone: value }, { professionalCode: value }] },
    });
    if (!driver) return res.status(401).json({ message: "Identifiants incorrects" });
    const valid = await bcrypt.compare(password, driver.passwordHash);
    if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });
    if (driver.status === 'SUSPENDED') {
      return res.status(403).json({ message: "Votre compte a été suspendu par la plateforme" });
    }
    const loggedInByPhone = value === driver.phone;
    if (driver.status === 'APPROVED' && loggedInByPhone) {
      return res.status(401).json({
        message: `Votre dossier est validé. Connectez-vous désormais avec votre identifiant professionnel ${driver.professionalCode} (le numéro de téléphone n'est plus accepté).`,
      });
    }
    const token = signToken({ id: driver.id, role: 'INDEPENDENT_DRIVER' });
    res.json({
      token,
      driver: {
        id: driver.id, professionalCode: driver.professionalCode, status: driver.status,
        firstName: driver.firstName, lastName: driver.lastName,
        phone: driver.phone, email: driver.email, photoUrl: driver.photoUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

// -------- SUPER-ADMIN RAHA (tableau de bord interne "Agence Raha") --------

// POST /api/auth/super-admin/bootstrap — crée le tout premier compte
// super-admin. Ne fonctionne qu'une seule fois : refuse dès qu'un compte
// super-admin existe déjà, et exige la clé RAHA_OPS_KEY pour éviter que
// n'importe qui puisse s'auto-créer un accès. Une fois le premier compte
// créé, on peut soit s'arrêter là, soit en créer d'autres directement en
// base de données si besoin — cette route ne sert qu'à démarrer.
async function bootstrapSuperAdmin(req, res, next) {
  try {
    const { name, email, password, key } = req.body;
    if (!process.env.RAHA_OPS_KEY || !key || key !== process.env.RAHA_OPS_KEY) {
      return res.status(403).json({ message: "Clé invalide" });
    }
    const existingCount = await prisma.superAdmin.count();
    if (existingCount > 0) {
      return res.status(409).json({ message: "Un compte super-admin existe déjà. Utilisez la connexion normale." });
    }
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ message: "Nom, email et mot de passe (6 caractères minimum) requis" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.superAdmin.create({ data: { name, email, passwordHash } });
    const token = signToken({ id: admin.id, role: 'SUPER_ADMIN' });
    res.status(201).json({
      message: "Compte super-admin créé.",
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });
  } catch (err) { next(err); }
}

async function loginSuperAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    const admin = await prisma.superAdmin.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ message: "Identifiants incorrects" });
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });
    const token = signToken({ id: admin.id, role: 'SUPER_ADMIN' });
    res.json({
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });
  } catch (err) { next(err); }
}

// -------- CHAUFFEUR D'AGENCE (App mobile — espace pro, une fois le compte activé par l'agence) --------

async function loginDriver(req, res, next) {
  try {
    // Le chauffeur d'agence a son identifiant professionnel Raha
    // (RAHA-PA-xxxxxx) dès sa création par l'agence — la connexion se fait
    // donc obligatoirement avec ce code, jamais avec le numéro de téléphone.
    const { identifier, professionalCode, password } = req.body;
    const value = identifier || professionalCode;
    if (!value || !password) return res.status(400).json({ message: "Identifiant professionnel et mot de passe requis" });
    const driver = await prisma.driver.findUnique({
      where: { professionalCode: value },
      include: { agency: true },
    });
    if (!driver || !driver.passwordHash) {
      return res.status(401).json({ message: "Identifiants incorrects, ou compte pas encore activé par votre agence" });
    }
    const valid = await bcrypt.compare(password, driver.passwordHash);
    if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });
    if (!driver.active) return res.status(403).json({ message: "Votre compte a été désactivé par votre agence" });
    const token = signToken({ id: driver.id, role: 'AGENCY_DRIVER', agencyId: driver.agencyId });
    res.json({
      token,
      driver: {
        id: driver.id, professionalCode: driver.professionalCode,
        name: driver.name, phone: driver.phone, photoUrl: driver.photoUrl,
      },
      agency: { id: driver.agency.id, name: driver.agency.name, professionalCode: driver.agency.professionalCode },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  registerUser, loginUser,
  loginAgencyAdmin, registerAgency,
  registerIndependentDriver, loginIndependentDriver,
  loginDriver,
  bootstrapSuperAdmin, loginSuperAdmin,
};
