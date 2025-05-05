// backend/controllers/authController.js
// (Anciennement auth.js)

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
// Assure-toi que ces chemins sont corrects par rapport à l'emplacement de ce fichier
const asyncHandler = require("../middleware/asyncHandler");
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    S'inscrire en tant qu'utilisateur
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Créer l'utilisateur
  const user = await User.create({
    username,
    email,
    password // Le hook pre('save') dans User.js s'occupera du hachage
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
// ***** VERSION AVEC LOGS POUR DEBUG - Peut être nettoyée plus tard *****
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // LOG 1: Afficher l'email reçu
  console.log(`[LOGIN ATTEMPT] Received login attempt for email: "${email}"`);

  // Valider email et mot de passe
  if (!email || !password) {
    console.log('[LOGIN FAILED] Missing email or password'); // LOG 2
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  // Vérifier l'utilisateur
  console.log(`[LOGIN ATTEMPT] Finding user with email: "${email}"`); // LOG 3
  // Important: .select('+password') pour récupérer le mot de passe qui est caché par défaut
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.log(`[LOGIN FAILED] User not found for email: "${email}"`); // LOG 4
    return next(new ErrorResponse('Identifiants invalides', 401)); // Erreur générique
  }

  // LOG: Utilisateur trouvé
  console.log(`[LOGIN ATTEMPT] User found: ID=${user._id}, Email DB="${user.email}". Comparing password...`); // LOG 5

  // Vérifier si le mot de passe correspond
  let isMatch = false;
  try {
      isMatch = await user.matchPassword(password); // Méthode définie dans le modèle User
      // LOG: Résultat de la comparaison
      console.log(`[LOGIN ATTEMPT] Password match result for ${user.email}: ${isMatch}`); // LOG 6
  } catch (compareError) {
      // LOG: Erreur pendant la comparaison (rare)
      console.error(`[LOGIN ERROR] Error during password comparison for ${user.email}:`, compareError);
      return next(new ErrorResponse('Erreur lors de la vérification des identifiants', 500));
  }


  if (!isMatch) {
    console.log(`[LOGIN FAILED] Password mismatch for user: ${user.email}`); // LOG 7
    return next(new ErrorResponse('Identifiants invalides', 401)); // Erreur générique
  }

  // --- Mot de passe correct ---
  console.log(`[LOGIN SUCCESS] Password matched for user: ${user.email}. Proceeding...`); // LOG 8

  // Mettre à jour la date de dernière connexion (optionnel)
  try {
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false }); // Sauvegarde sans relancer les validateurs
    console.log(`[LOGIN SUCCESS] Updated lastLogin for user: ${user.email}`); // LOG 9
  } catch(saveError) {
    console.error(`[LOGIN ERROR] Failed to update lastLogin for user: ${user.email}`, saveError); // LOG 10
    // Pas bloquant, on continue
  }

  // Envoyer le token JWT et le cookie
  console.log(`[LOGIN SUCCESS] Calling sendTokenResponse for user: ${user.email}`); // LOG 11
  try {
      sendTokenResponse(user, 200, res);
      console.log(`[LOGIN SUCCESS] Token response sent for user: ${user.email}`); // LOG 12
  } catch (tokenError) {
      console.error(`[LOGIN ERROR] Error during sendTokenResponse for user: ${user.email}`, tokenError); // LOG 13
      return next(new ErrorResponse('Erreur serveur lors de la finalisation de la connexion.', 500));
  }
});
// ***** FIN DE LA VERSION AVEC LOGS DE LOGIN *****


// @desc    Déconnexion utilisateur / effacer le cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Efface le cookie en le renvoyant avec une date d'expiration passée
  res.cookie('token', 'none', {
    expires: new Date(Date.now() - 10 * 1000), // Expiration dans le passé
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir l'utilisateur actuel (basé sur le token)
// @route   GET /api/auth/me
// @access  Private (nécessite le middleware 'protect')
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user est ajouté par le middleware 'protect'
  if (!req.user || !req.user.id) {
       return next(new ErrorResponse('Utilisateur non authentifié', 401));
   }
  // Pas besoin de re-fetcher si protect attache déjà l'utilisateur trouvé
  // const user = await User.findById(req.user.id);
  // if (!user) {
  //     return next(new ErrorResponse('Utilisateur non trouvé', 404)); // Sécurité : ne devrait pas arriver si protect fonctionne
  // }

  res.status(200).json({
    success: true,
    // Renvoyer req.user directement (qui vient du middleware 'protect')
    data: req.user
  });
});

// @desc    Mettre à jour le mot de passe (utilisateur connecté)
// @route   PUT /api/auth/updatepassword
// @access  Private (nécessite le middleware 'protect')
exports.updatePassword = asyncHandler(async (req, res, next) => {
   if (!req.user || !req.user.id) {
       return next(new ErrorResponse('Utilisateur non authentifié', 401));
   }
   // Important de récupérer l'utilisateur avec son mot de passe pour comparer l'ancien
   const user = await User.findById(req.user.id).select('+password');

   if (!user) { // Sécurité : ne devrait pas arriver
       return next(new ErrorResponse('Utilisateur non trouvé', 404));
   }

  // Vérifier le mot de passe actuel fourni
  if (!req.body.currentPassword || !(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
  }

  // Vérifier si le nouveau mot de passe est fourni
  if (!req.body.newPassword) {
      return next(new ErrorResponse('Veuillez fournir un nouveau mot de passe', 400));
  }

  // Mettre à jour avec le nouveau mot de passe
  user.password = req.body.newPassword;
  // Le hook pre('save') s'occupe du hachage
  await user.save();

  // Optionnel: Envoyer une notification par email
  // (Ton code existant pour l'email de notification ici)
  if (sendEmail && process.env.NOTIFICATION_EMAIL) {
      try {
          await sendEmail(/* ... options email ... */);
      } catch (emailError) {
          console.error("Erreur envoi email notif update password:", emailError);
      }
  } else {
      console.warn("Email de notification non envoyé (config manquante).");
  }


  // Renvoyer un nouveau token après changement de mot de passe est une bonne pratique
  sendTokenResponse(user, 200, res);
});

// @desc    Mot de passe oublié (demande de réinitialisation)
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  if (!req.body.email) {
     return next(new ErrorResponse('Veuillez fournir un email', 400));
  }
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Sécurité : Ne pas révéler si l'email existe ou non.
    console.log(`[FORGOT PASSWORD] Attempt for non-existent email: ${req.body.email}`);
    // On renvoie quand même un succès pour ne pas donner d'indice.
    return res.status(200).json({ success: true, data: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
  }

  // Générer et sauvegarder le token de réinitialisation (hashé) et sa date d'expiration
  let resetToken;
  try {
    // Assure-toi que user.getResetPasswordToken() existe et fonctionne dans ton modèle User.js
    resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false }); // Sauvegarde token hashé + expiration
  } catch(tokenError){
      console.error("Erreur génération/sauvegarde reset token:", tokenError);
      user.resetPasswordToken = undefined; // Nettoyer en cas d'erreur
      user.resetPasswordExpire = undefined;
      // Ne pas sauvegarder ici pour éviter boucle infinie si save plante
      return next(new ErrorResponse('Erreur lors de la génération du token', 500));
  }


  // Créer l'URL de réinitialisation pour l'email (pointe vers le FRONTEND)
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`; // Le token NON hashé est dans l'URL

  const message = `Vous recevez cet email car une réinitialisation de mot de passe a été demandée pour votre compte. Cliquez sur le lien suivant ou copiez-le dans votre navigateur. Ce lien expirera dans ${process.env.RESET_PASSWORD_EXPIRE_MINUTES || 10} minutes:\n\n${resetUrl}`;

  try {
    // Envoyer l'email
    if (!sendEmail) throw new Error("Service email non configuré.");
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe - MDMC Music Ads',
      message
    });

    // Optionnel: Notifier l'admin
    if (process.env.NOTIFICATION_EMAIL) {
        try { await sendEmail(/* ... options email admin ... */); } catch(e){ console.error("Erreur notif admin forgotPwd:", e); }
    }

    res.status(200).json({ success: true, data: 'Email envoyé avec succès.' });
  } catch (err) {
    console.error("[FORGOT PASSWORD] Erreur envoi email:", err);
    // Très important: Annuler le token si l'email n'a pas pu être envoyé
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("L'email n'a pas pu être envoyé", 500));
  }
});

// @desc    Réinitialiser le mot de passe (après clic sur lien email)
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hasher le token reçu de l'URL pour le comparer à celui (hashé) en BDD
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  // Trouver l'utilisateur avec le token hashé VALIDE (non expiré)
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() } // Vérifie que la date d'expiration est future
  });

  if (!user) {
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }

  // Vérifier si le nouveau mot de passe est fourni
  if (!req.body.password) {
      return next(new ErrorResponse('Veuillez fournir un nouveau mot de passe', 400));
  }

  // Définir le nouveau mot de passe et effacer les champs de reset
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  // Le hook pre('save') hachera le nouveau mot de passe
  await user.save();

  // Optionnel: Envoyer notification email
  if (sendEmail && process.env.NOTIFICATION_EMAIL) {
      try { await sendEmail(/* ... options email admin ... */); } catch(e){ console.error("Erreur notif admin resetPwd:", e); }
  }

  // Connecter l'utilisateur en renvoyant un nouveau token
  sendTokenResponse(user, 200, res);
});


// --- Fonction Utilitaire sendTokenResponse ---
// Placée à la fin pour la clarté
const sendTokenResponse = (user, statusCode, res) => {
  // Créer le token JWT (via méthode du modèle User)
  const token = user.getSignedJwtToken();

  // Options du cookie
  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS || '30', 10);
  const options = {
    // Expiration en millisecondes
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true // Empêche l'accès via JavaScript côté client (sécurité XSS)
  };

  // Ajouter 'secure: true' pour le cookie en production (HTTPS requis)
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    // options.sameSite = 'None'; // Si frontend et backend sur domaines différents
  }

  // Envoi de la réponse : cookie + token dans le JSON
  res
    .status(statusCode)
    .cookie('token', token, options) // Définit le cookie HttpOnly
    .json({
      success: true,
      token // Renvoie aussi le token dans le corps (utile pour certains cas)
    });
};
