// backend/controllers/authController.js

const User = require('../models/User'); // Adapte le chemin si nécessaire
const ErrorResponse = require('../utils/errorResponse'); // Adapte le chemin si nécessaire
const asyncHandler = require("../middleware/asyncHandler"); // <--- IMPORT AJOUTÉ/VÉRIFIÉ
const sendEmail = require('../utils/sendEmail'); // Adapte le chemin si nécessaire
const crypto = require('crypto');

// --- Fonction Utilitaire pour envoyer Token et Cookie ---
// Cette fonction est appelée par login, register, et resetPassword
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken(); // Méthode de ton modèle User.js
  
  console.log('[sendTokenResponse] Generated Token:', token ? 'Token généré (longueur: ' + token.length + ')' : 'Aucun token généré');

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS || '30', 10);
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true, 
    path: '/',      // Important pour la portée du cookie
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;    // Cookie envoyé uniquement sur HTTPS
    options.sameSite = 'None';  // Nécessaire pour les contextes inter-sites (ex: API et frontend sur des sous-domaines différents)
  } else {
    options.sameSite = 'Lax'; // 'Lax' est un bon défaut pour le développement
  }

  console.log('[sendTokenResponse] Cookie options:', options);

  res
    .status(statusCode)
    .cookie('token', token, options) 
    .json({
      success: true,
      token: token, // Renvoyer le token dans le JSON est optionnel si purement basé sur cookie
      // Tu peux aussi renvoyer les données utilisateur si AdminLogin.jsx en a besoin immédiatement
      // data: { id: user._id, username: user.username, email: user.email, role: user.role } 
    });
};


/**
 * @desc     S'inscrire en tant qu'utilisateur
 * @route    POST /api/auth/register
 * @access   Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;

  const user = await User.create({
    username,
    email,
    password,
    role 
  });

  sendTokenResponse(user, 201, res); // 201 Created
});

/**
 * @desc     Connexion utilisateur
 * @route    POST /api/auth/login
 * @access   Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(`[LOGIN ATTEMPT] Received login attempt for email: "${email}"`);

  if (!email || !password) {
    console.log('[LOGIN FAILED] Missing email or password');
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  console.log(`[LOGIN ATTEMPT] Finding user with email: "${email}"`);
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.log(`[LOGIN FAILED] User not found for email: "${email}"`);
    return next(new ErrorResponse('Identifiants invalides (utilisateur)', 401)); // Message légèrement différent pour debug
  }
  console.log(`[LOGIN ATTEMPT] User found: ID=${user._id}. Comparing password...`);

  const isMatch = await user.matchPassword(password);
  console.log(`[LOGIN ATTEMPT] Password match result for ${user.email}: ${isMatch}`);

  if (!isMatch) {
    console.log(`[LOGIN FAILED] Password mismatch for user: ${user.email}`);
    return next(new ErrorResponse('Identifiants invalides (mot de passe)', 401)); // Message légèrement différent pour debug
  }

  console.log(`[LOGIN SUCCESS] Password matched for user: ${user.email}. Proceeding...`);

  try {
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    console.log(`[LOGIN SUCCESS] Updated lastLogin for user: ${user.email}`);
  } catch(saveError) {
    console.error(`[LOGIN ERROR] Failed to update lastLogin for user: ${user.email}`, saveError);
    // Ne pas bloquer le login pour une erreur de lastLogin
  }

  console.log(`[LOGIN SUCCESS] Calling sendTokenResponse for user: ${user.email}`);
  sendTokenResponse(user, 200, res); // 200 OK
  console.log(`[LOGIN SUCCESS] Token response sent for user: ${user.email}`);
});


/**
 * @desc     Déconnexion utilisateur / effacer le cookie
 * @route    GET /api/auth/logout
 * @access   Privé (nécessite 'protect' sur la route)
 */
exports.logout = asyncHandler(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() - 10 * 1000), // Date d'expiration dans le passé immédiat
    httpOnly: true,
    path: '/', // ESSENTIEL : Doit correspondre au 'path' utilisé lors de la création du cookie
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'None'; // ESSENTIEL : Doit correspondre aux options de sendTokenResponse en prod
  } else {
    cookieOptions.sameSite = 'Lax'; // ESSENTIEL : Doit correspondre
