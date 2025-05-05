// middleware/auth.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler'); // Ou '../middleware/asyncHandler' si asyncHandler est là aussi
const ErrorResponse = require('../utils/errorResponse'); // Assurez-vous que le chemin est correct
const User = require('../models/User'); // Assurez-vous que le chemin est correct

// Middleware pour protéger les routes (vérifie le token JWT)
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Essayer d'obtenir le token depuis les headers Authorization (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Sinon, essayer d'obtenir le token depuis les cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // S'assurer que le token existe
  if (!token) {
    return next(new ErrorResponse('Non autorisé à accéder à cette route (pas de token)', 401));
  }

  try {
    // Vérifier le token avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trouver l'utilisateur associé à l'ID du token
    // Ne pas sélectionner le mot de passe ici
    req.user = await User.findById(decoded.id);

    if (!req.user) {
        // Si l'utilisateur associé au token n'existe plus
         return next(new ErrorResponse('Utilisateur du token non trouvé', 401));
    }

    next(); // Passer au middleware suivant si tout est OK
  } catch (err) {
    console.error("Erreur lors de la vérification du token:", err.message); // Log l'erreur pour debug
    // Gérer les erreurs spécifiques de JWT
    if (err.name === 'JsonWebTokenError') {
        return next(new ErrorResponse('Non autorisé à accéder à cette route (token invalide)', 401));
    }
    if (err.name === 'TokenExpiredError') {
        return next(new ErrorResponse('Non autorisé à accéder à cette route (token expiré)', 401));
    }
    // Autres erreurs potentielles
    return next(new ErrorResponse('Non autorisé à accéder à cette route', 401));
  }
});

// Middleware pour accorder l'accès à des rôles spécifiques
// Ex: authorize('admin') ou authorize('admin', 'publisher')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Vérifier si req.user a été défini par le middleware 'protect'
    if (!req.user) {
      // Ceci ne devrait pas arriver si 'protect' est utilisé avant 'authorize'
      return next(new ErrorResponse('Erreur interne: req.user non défini avant authorize', 500));
    }
    // Vérifier si le rôle de l'utilisateur est inclus dans les rôles autorisés
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Le rôle '${req.user.role}' n'est pas autorisé à accéder à cette route`,
          403 // 403 Forbidden (Interdit)
        )
      );
    }
    next(); // Passer au middleware suivant si autorisé
  };
};
