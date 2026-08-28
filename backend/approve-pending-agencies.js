// Script à usage unique : approuve toutes les agences/particuliers créés
// avant le correctif du 27/08/2026 (qui restaient bloqués en statut PENDING
// faute de tableau de bord super-admin pour les valider manuellement).
//
// À exécuter UNE SEULE FOIS depuis le dossier backend/ :
//   node approve-pending-agencies.js
//
// Nécessite que backend/.env (DATABASE_URL) soit présent, comme pour tout
// `npm run dev` habituel.

const prisma = require('./src/config/db');

(async () => {
  const result = await prisma.agency.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'APPROVED' },
  });
  console.log(`${result.count} agence(s)/particulier(s) approuvé(s) et désormais visibles dans l'app mobile.`);
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error('Erreur :', err);
  await prisma.$disconnect();
  process.exit(1);
});
