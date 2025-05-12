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

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Token depuis le header Authorization
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.accessToken) {
    // Token depuis les cookies
    token = req.cookies.accessToken;
  }

  if (!token) {
    console.log('Aucun token trouvé dans la requête');
    return next(new ErrorResponse('Non autorisé à accéder à cette route', 401));
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);

    // Vérifier si l'utilisateur existe toujours
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('Utilisateur non trouvé pour l\'ID:', decoded.id);
      return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    // Vérifier si l'utilisateur a été désactivé
    if (!user.isActive) {
      console.log('Compte désactivé pour l\'utilisateur:', user.email);
      return next(new ErrorResponse('Compte désactivé', 401));
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    console.log('Utilisateur authentifié:', { id: user._id, email: user.email, role: user.role });
    next();
  } catch (err) {
    console.log('Erreur de vérification du token:', err);
    if (err.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Token expiré', 401));
    }
    return next(new ErrorResponse('Non autorisé à accéder à cette route', 401));
  }
});

/**
 * @desc Middleware pour autoriser l'accès basé sur les rôles utilisateur
 * @param {...string} roles - Liste des rôles autorisés (ex: 'admin', 'publisher')
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Vérification du rôle:', { userRole: req.user.role, allowedRoles: roles });
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Le rôle ${req.user ? req.user.role : 'non défini'} n'est pas autorisé à accéder à cette route`,
          403
        )
      );
    }
    next();
  };
};

// Vérifier le refresh token
exports.verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return next(new ErrorResponse('Refresh token non fourni', 401));
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    if (!user.isActive) {
      return next(new ErrorResponse('Compte désactivé', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Refresh token expiré', 401));
    }
    return next(new ErrorResponse('Refresh token invalide', 401));
  }
});

// Vérifier si l'utilisateur est le propriétaire de la ressource
exports.checkOwnership = (model) => asyncHandler(async (req, res, next) => {
  const resource = await model.findById(req.params.id);

  if (!resource) {
    return next(new ErrorResponse('Ressource non trouvée', 404));
  }

  // Vérifier si l'utilisateur est admin ou le propriétaire
  if (req.user.role !== 'admin' && resource.userId.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        'Non autorisé à modifier cette ressource',
        403
      )
    );
  }

  next();
});
