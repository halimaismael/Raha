const prisma = require('../config/db');

// GET /api/super-admin/stats — vue d'ensemble pour la page d'accueil du
// tableau de bord "Agence Raha" : à retenir en un coup d'œil, combien de
// monde utilise la plateforme et ce qui attend une action de l'équipe Raha.
async function getStats(req, res, next) {
  try {
    const [
      usersCount,
      agenciesApproved,
      agenciesPending,
      independentApproved,
      independentPending,
      mwanaPending,
      mwanaTotal,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.agency.count({ where: { status: 'APPROVED' } }),
      prisma.agency.count({ where: { status: 'PENDING' } }),
      prisma.independentDriver.count({ where: { status: 'APPROVED' } }),
      prisma.independentDriver.count({ where: { status: 'PENDING' } }),
      prisma.mwanaRequest.count({ where: { status: 'PENDING' } }),
      prisma.mwanaRequest.count(),
    ]);
    res.json({
      users: { total: usersCount },
      agencies: { approved: agenciesApproved, pending: agenciesPending },
      independentDrivers: { approved: independentApproved, pending: independentPending },
      mwanaRequests: { pending: mwanaPending, total: mwanaTotal },
    });
  } catch (err) { next(err); }
}

// GET /api/super-admin/users — liste des usagers inscrits (compte + activité
// de base). Limité aux 500 plus récents pour rester léger ; à paginer plus
// tard si la base grandit beaucoup.
async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, firstName: true, lastName: true, phone: true, email: true, createdAt: true,
        _count: { select: { bookings: true, mwanaRequests: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json(users);
  } catch (err) { next(err); }
}

module.exports = { getStats, listUsers };
