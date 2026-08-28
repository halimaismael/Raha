const { verifyToken } = require('../utils/jwt');

// Vérifie qu'un token valide est présent. Attache req.auth = { id, role, agencyId? }
function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authentification requise" });
    }
    const token = header.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Accès refusé pour ce rôle" });
      }
      req.auth = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }
  };
}

module.exports = { requireAuth };
