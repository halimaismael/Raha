// Middleware Express de gestion centralisée des erreurs.
// Toutes les routes appellent next(err) en cas d'erreur ; ce middleware
// (déclaré en dernier dans server.js) transforme n'importe quelle erreur
// en réponse JSON cohérente avec le reste de l'API : { message }.

function errorHandler(err, req, res, next) {
  // Erreur déjà gérée / réponse déjà envoyée : on laisse Express faire.
  if (res.headersSent) {
    return next(err);
  }

  console.error('[errorHandler]', err);

  // Erreurs Prisma connues (contrainte unique, enregistrement introuvable, etc.)
  if (err && err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'ce champ';
    return res.status(409).json({ message: `Une entrée existe déjà avec ${fields}.` });
  }
  if (err && err.code === 'P2025') {
    return res.status(404).json({ message: "Ressource introuvable." });
  }

  // Erreurs de validation explicites (si un jour levées via `throw` avec un statusCode)
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode < 500 && err.message
    ? err.message
    : "Une erreur interne est survenue. Merci de réessayer.";

  res.status(statusCode).json({ message });
}

module.exports = { errorHandler };
