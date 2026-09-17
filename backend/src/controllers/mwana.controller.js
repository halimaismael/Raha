const prisma = require('../config/db');
const { nextMwanaReference } = require('../utils/professionalCode.util');
const { notifyUser } = require('../utils/notify.util');

const DURATIONS = ['UNE_SEMAINE', 'UN_MOIS', 'UN_TRIMESTRE', 'ANNEE_SCOLAIRE'];

function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Usager : envoie le formulaire Raha Mwana + le créneau de rendez-vous choisi
// EN MÊME TEMPS que les justificatifs (photos) et le nom de chaque enfant
// concerné, en une seule requête (le mobile enchaîne les écrans avant
// d'appeler l'API). Le dossier reste PENDING jusqu'au passage physique en
// agence, où l'équipe Raha vérifie les originaux et coche "dossier vérifié".
async function createMwanaRequest(req, res, next) {
  try {
    const {
      duration, numberOfPeople, tripsPerDay, city,
      contactFirstName, contactLastName, contactEmail, contactPhone,
      childrenNames, documents,
      appointmentDate,
    } = req.body;

    if (!DURATIONS.includes(duration)) {
      return res.status(400).json({ message: 'Durée souhaitée invalide.' });
    }
    if (!numberOfPeople || numberOfPeople < 1) {
      return res.status(400).json({ message: 'Le nombre de personnes doit être au moins 1.' });
    }
    if (!tripsPerDay || tripsPerDay < 1) {
      return res.status(400).json({ message: 'Le nombre de trajets par jour est requis.' });
    }
    if (!city || !contactFirstName || !contactLastName || !contactPhone) {
      return res.status(400).json({ message: 'Merci de renseigner tous les champs obligatoires.' });
    }
    if (!isValidEmail(contactEmail)) {
      return res.status(400).json({ message: 'Adresse email invalide.' });
    }

    const names = Array.isArray(childrenNames) ? childrenNames.map((n) => String(n).trim()).filter(Boolean) : [];
    if (names.length !== Number(numberOfPeople)) {
      return res.status(400).json({
        message: `Merci de renseigner le nom de ${numberOfPeople > 1 ? 'chacun des' : 'l\''} ${numberOfPeople} enfant${numberOfPeople > 1 ? 's' : ''} annoncé${numberOfPeople > 1 ? 's' : ''}.`,
      });
    }

    const docs = Array.isArray(documents) ? documents.filter((d) => typeof d === 'string' && d.startsWith('data:')) : [];
    if (docs.length === 0) {
      return res.status(400).json({ message: "Merci de joindre au moins un justificatif (pièce d'identité, extrait de naissance ou carte scolaire de l'enfant)." });
    }

    const appt = new Date(appointmentDate);
    if (!appointmentDate || Number.isNaN(appt.getTime()) || appt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Merci de choisir un rendez-vous valide, dans le futur.' });
    }

    const reference = await nextMwanaReference();

    const request = await prisma.mwanaRequest.create({
      data: {
        reference,
        userId: req.auth.id,
        duration,
        numberOfPeople: Number(numberOfPeople),
        tripsPerDay: Number(tripsPerDay),
        city,
        contactFirstName,
        contactLastName,
        contactEmail,
        contactPhone,
        childrenNames: names,
        documents: docs,
        appointmentDate: appt,
      },
    });

    const io = req.app.get('io');
    await notifyUser(io, {
      userId: req.auth.id,
      title: 'Rendez-vous Raha Mwana confirmé',
      body: `${reference} — présentez-vous en agence le ${appt.toLocaleDateString('fr-FR')} avec vos justificatifs d'identité.`,
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

// Usager : historique de ses propres demandes Raha Mwana
async function listMyMwanaRequests(req, res, next) {
  try {
    const requests = await prisma.mwanaRequest.findMany({
      where: { userId: req.auth.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

// ---- Super-admin Raha (tableau de bord "Agence Raha") ----

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

// GET /api/mwana-requests/admin/all — tous les rendez-vous Raha Mwana, avec
// les infos du compte usager (pour référence) en plus des champs contact*
// propres à chaque demande (le contact d'un rendez-vous peut différer du nom
// du compte qui l'a pris — ex: une même personne prend rendez-vous pour
// plusieurs proches).
async function listAllMwanaRequests(req, res, next) {
  try {
    const requests = await prisma.mwanaRequest.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { appointmentDate: 'asc' },
    });
    res.json(requests);
  } catch (err) { next(err); }
}

// PATCH /api/mwana-requests/:id/status  { status }
// À utiliser après le passage du client en agence : CONFIRMED (rendez-vous
// honoré, dossier en cours), COMPLETED (chauffeur mis en place), ou
// CANCELLED (le client ne s'est pas présenté / a annulé).
async function updateMwanaStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: `Statut invalide. Valeurs possibles : ${STATUSES.join(', ')}` });
    }
    const request = await prisma.mwanaRequest.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json({ message: `Dossier ${request.reference} mis à jour : ${status}.`, request });
  } catch (err) { next(err); }
}

// PATCH /api/mwana-requests/:id/dossier-reviewed  { reviewed: boolean }
// Coché par l'équipe Raha une fois le dossier physique (justificatifs
// papier) vérifié et complet, indépendamment du statut du rendez-vous.
async function updateDossierReviewed(req, res, next) {
  try {
    const { reviewed } = req.body;
    if (typeof reviewed !== 'boolean') {
      return res.status(400).json({ message: 'Le champ "reviewed" doit être un booléen (true/false).' });
    }
    const request = await prisma.mwanaRequest.update({
      where: { id: req.params.id },
      data: { dossierReviewed: reviewed },
    });
    res.json({ message: `Dossier ${request.reference} marqué comme ${reviewed ? 'vérifié' : 'non vérifié'}.`, request });
  } catch (err) { next(err); }
}

module.exports = {
  createMwanaRequest, listMyMwanaRequests,
  listAllMwanaRequests, updateMwanaStatus, updateDossierReviewed,
};
