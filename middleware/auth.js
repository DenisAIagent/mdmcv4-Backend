// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

/**
 * @desc Middleware pour protéger les routes (vérifie le token JWT)
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Essayer d'obtenir le token depuis l'en-tête Authorization (Bearer)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Sinon, essayer depuis les cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 3. Si aucun token n'est trouvé, renvoyer une erreur 401
  if (!token) {
    return next(new ErrorResponse('Non autorisé à accéder à cette route (token manquant)', 401));
  }

  try {
    // 4. Vérifier et décoder le token avec la clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Trouver l'utilisateur correspondant en BDD et l'attacher à req.user
    //    Ne pas sélectionner le mot de passe
    req.user = await User.findById(decoded.id).select('-password');

    // 6. Si l'utilisateur associé au token n'existe plus, renvoyer une erreur 401
    if (!req.user) {
       return next(new ErrorResponse('Utilisateur associé au token non trouvé', 401));
    }

    // 7. Si tout est OK, passer au middleware ou au contrôleur suivant
    next();
  } catch (err) {
    // Gérer les erreurs de vérification JWT (token invalide, expiré)
    console.error("Erreur de vérification JWT dans 'protect':", err.name, err.message);
    let message = 'Non autorisé';
    if (err.name === 'JsonWebTokenError') message = 'Token invalide';
    if (err.name === 'TokenExpiredError') message = 'Token expiré';
    return next(new ErrorResponse(message, 401));
  }
});

/**
 * @desc Middleware pour autoriser l'accès basé sur les rôles utilisateur
 * @param {...string} roles - Liste des rôles autorisés (ex: 'admin', 'publisher')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Erreur interne du serveur (req.user manquant)', 500));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Le rôle utilisateur '${req.user.role}' n'est pas autorisé à accéder à cette route.`,
          403
        )
      );
    }
    next();
  };
};
