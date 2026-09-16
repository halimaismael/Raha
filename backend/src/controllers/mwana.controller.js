const prisma = require('../config/db');
const { nextMwanaReference } = require('../utils/professionalCode.util');
const { notifyUser } = require('../utils/notify.util');

const DURATIONS = ['UNE_SEMAINE', 'UN_MOIS', 'UN_TRIMESTRE', 'ANNEE_SCOLAIRE'];

function isValidEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Usager : envoie le formulaire Raha Mwana + le créneau de rendez-vous choisi
// en une seule requête (le mobile enchaîne les deux écrans avant d'appeler
// l'API). Le dossier reste PENDING jusqu'au passage physique en agence.
async function createMwanaRequest(req, res, next) {
  try {
    const {
      duration, numberOfPeople, tripsPerDay, city,
      contactFirstName, contactLastName, contactEmail, contactPhone,
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

module.exports = { createMwanaRequest, listMyMwanaRequests };
