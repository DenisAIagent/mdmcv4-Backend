// middleware/auth.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  console.log(`[PROTECT] Vérification pour la route: ${req.originalUrl}`); // Log la route
  console.log('[PROTECT] Headers Authorization:', req.headers.authorization); // Log header
  console.log('[PROTECT] Cookies:', req.cookies); // Log cookies

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('[PROTECT] Token trouvé dans Header Bearer.');
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('[PROTECT] Token trouvé dans Cookie:', token ? 'Oui' : 'Non'); // Log si trouvé dans cookie
  } else {
     console.log('[PROTECT] Aucun token trouvé (Header ou Cookie).');
  }


  if (!token) {
    console.log('[PROTECT] Erreur: Pas de token. Renvoi 401.');
    return next(new ErrorResponse('Non autorisé à accéder à cette route (pas de token)', 401));
  }

  try {
    console.log('[PROTECT] Vérification du token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[PROTECT] Token décodé, ID utilisateur:', decoded.id);

    console.log('[PROTECT] Recherche de l\'utilisateur en BDD...');
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      console.log(`[PROTECT] Erreur: Utilisateur non trouvé pour l'ID ${decoded.id}. Renvoi 401.`);
      return next(new ErrorResponse('Utilisateur du token non trouvé', 401));
    }
    console.log(`[PROTECT] Utilisateur trouvé: ${req.user.email}. Passage à next().`);
    next(); // OK !
  } catch (err) {
    console.error("[PROTECT] Erreur lors de la vérification JWT:", err.name, err.message);
    // Ne pas logguer le token lui-même pour la sécurité
    return next(new ErrorResponse('Non autorisé (token invalide/expiré)', 401)); // Erreur générique 401
  }
});

// ... (le code pour authorize reste inchangé) ...
exports.authorize = (...roles) => {
  // ...
};
