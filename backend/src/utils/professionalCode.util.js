const prisma = require('../config/db');

// Les identifiants professionnels Raha sont générés par des séquences
// Postgres (créées dans la migration 20260828120000_professional_platform) :
// atomiques, jamais choisis par le professionnel, jamais réutilisés.

async function nextAgencyCode() {
  const rows = await prisma.$queryRaw`SELECT nextval('raha_agency_code_seq') AS n`;
  const n = Number(rows[0].n);
  return `RAHA-AG-${String(n).padStart(6, '0')}`;
}

// Chauffeur indépendant ("particulier") — attribué uniquement une fois son
// dossier validé par Raha (jamais à l'inscription). Préfixe RAHA-CH.
async function nextIndependentDriverCode() {
  const rows = await prisma.$queryRaw`SELECT nextval('raha_driver_code_seq') AS n`;
  const n = Number(rows[0].n);
  return `RAHA-CH-${String(n).padStart(6, '0')}`;
}

// Chauffeur d'agence — attribué dès sa création par l'agence (avant même
// l'activation de son compte). Préfixe RAHA-PA, distinct de celui des
// chauffeurs indépendants pour qu'on distingue les deux profils au premier
// coup d'œil sur l'identifiant.
async function nextAgencyDriverCode() {
  const rows = await prisma.$queryRaw`SELECT nextval('raha_agency_driver_code_seq') AS n`;
  const n = Number(rows[0].n);
  return `RAHA-PA-${String(n).padStart(6, '0')}`;
}

async function nextBookingReference() {
  const rows = await prisma.$queryRaw`SELECT nextval('raha_booking_ref_seq') AS n`;
  const n = Number(rows[0].n);
  return `RAHA-BK-${String(n).padStart(8, '0')}`;
}

async function nextMwanaReference() {
  const rows = await prisma.$queryRaw`SELECT nextval('raha_mwana_ref_seq') AS n`;
  const n = Number(rows[0].n);
  return `RAHA-MW-${String(n).padStart(8, '0')}`;
}

module.exports = {
  nextAgencyCode,
  nextIndependentDriverCode,
  nextAgencyDriverCode,
  nextBookingReference,
  nextMwanaReference,
};
