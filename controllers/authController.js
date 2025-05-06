// backend/controllers/authController.js

const User = require('../models/User'); // Adaptez le chemin si nécessaire
const ErrorResponse = require('../utils/errorResponse'); // Adaptez le chemin si nécessaire
const asyncHandler = require("../middleware/asyncHandler"); // Adaptez le chemin si nécessaire
const sendEmail = require('../utils/sendEmail'); // Adaptez le chemin si nécessaire
const crypto = require('crypto');

/**
 * @desc    S'inscrire en tant qu'utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body; // Role peut être optionnel selon votre modèle User

  // Créer l'utilisateur (le hook pre-save dans User.js hachera le mot de passe)
  const user = await User.create({
    username,
    email,
    password,
    role // Assurez-vous que votre modèle User gère le rôle
  });

  // Envoyer le token et la réponse
  sendTokenResponse(user, 201, res); // 201 Created
});

/**
 * @desc    Connexion utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(`[LOGIN ATTEMPT] Received login attempt for email: "${email}"`);

  // Valider email et mot de passe
  if (!email || !password) {
    console.log('[LOGIN FAILED] Missing email or password');
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  // Vérifier l'utilisateur et récupérer le mot de passe haché
  console.log(`[LOGIN ATTEMPT] Finding user with email: "${email}"`);
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.log(`[LOGIN FAILED] User not found for email: "${email}"`);
    // Utiliser une erreur générique pour ne pas révéler si l'email existe
    return next(new ErrorResponse('Identifiants invalides', 401));
  }
  console.log(`[LOGIN ATTEMPT] User found: ID=${user._id}. Comparing password...`);

  // Vérifier si le mot de passe correspond
  let isMatch = false;
  try {
      isMatch = await user.matchPassword(password); // Méthode du modèle User
      console.log(`[LOGIN ATTEMPT] Password match result for ${user.email}: ${isMatch}`);
  } catch (compareError) {
      console.error(`[LOGIN ERROR] Error during password comparison for ${user.email}:`, compareError);
      return next(new ErrorResponse('Erreur lors de la vérification des identifiants', 500));
  }

  if (!isMatch) {
    console.log(`[LOGIN FAILED] Password mismatch for user: ${user.email}`);
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // --- Mot de passe correct ---
  console.log(`[LOGIN SUCCESS] Password matched for user: ${user.email}. Proceeding...`);

  // Mettre à jour la date de dernière connexion (optionnel)
  try {
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false }); // Sauvegarde sans relancer les validateurs
    console.log(`[LOGIN SUCCESS] Updated lastLogin for user: ${user.email}`);
  } catch(saveError) {
    console.error(`[LOGIN ERROR] Failed to update lastLogin for user: ${user.email}`, saveError);
    // Pas bloquant, on continue
  }

  // Envoyer le token JWT et le cookie
  console.log(`[LOGIN SUCCESS] Calling sendTokenResponse for user: ${user.email}`);
  try {
      sendTokenResponse(user, 200, res); // 200 OK
      console.log(`[LOGIN SUCCESS] Token response sent for user: ${user.email}`);
  } catch (tokenError) {
      console.error(`[LOGIN ERROR] Error during sendTokenResponse for user: ${user.email}`, tokenError);
      return next(new ErrorResponse('Erreur serveur lors de la finalisation de la connexion.', 500));
  }
});


/**
 * @desc    Déconnexion utilisateur / effacer le cookie
 * @route   GET /api/auth/logout
 * @access  Privé (nécessite 'protect')
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Efface le cookie en le renvoyant avec une date d'expiration passée
  // et les mêmes options (secure, httpOnly, sameSite) que lors de sa création
  const cookieOptions = {
    expires: new Date(Date.now() - 10 * 1000), // Expiration dans le passé immédiat
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    // cookieOptions.sameSite = 'None'; // Décommentez si frontend/backend sur domaines différents en prod
  }

  res.status(200)
     .cookie('token', 'none', cookieOptions) // Envoyer le cookie avec expiration passée
     .json({
        success: true,
        data: {} // Pas de données à renvoyer
     });
});

/**
 * @desc    Obtenir l'utilisateur actuel (basé sur le token)
 * @route   GET /api/auth/me
 * @access  Privé (nécessite 'protect')
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user est ajouté par le middleware 'protect'
  // Il contient déjà les données de l'utilisateur (sans le mot de passe)
  if (!req.user || !req.user.id) {
       // Sécurité: ne devrait pas arriver si 'protect' est bien appliqué avant
       return next(new ErrorResponse('Utilisateur non authentifié ou non trouvé dans la requête', 401));
   }

  // Renvoyer directement l'objet utilisateur attaché par le middleware 'protect'
  res.status(200).json({
    success: true,
    data: req.user
  });
});

/**
 * @desc    Mettre à jour le mot de passe (utilisateur connecté)
 * @route   PUT /api/auth/updatepassword
 * @access  Privé (nécessite 'protect')
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
    // req.user est défini par 'protect'
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Utilisateur non authentifié', 401));
    }

    const { currentPassword, newPassword } = req.body;

    // Valider les entrées
    if (!currentPassword || !newPassword) {
        return next(new ErrorResponse('Veuillez fournir le mot de passe actuel et le nouveau mot de passe', 400));
    }

    // Récupérer l'utilisateur AVEC son mot de passe pour la comparaison
    const user = await User.findById(req.user.id).select('+password');

    if (!user) { // Sécurité supplémentaire
        return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    // Vérifier si le mot de passe actuel fourni correspond
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
    }

    // Mettre à jour avec le nouveau mot de passe
    user.password = newPassword;
    // Le hook pre('save') dans le modèle User s'occupera du hachage
    await user.save();

    // Optionnel: Envoyer une notification par email de changement de mot de passe
    // ... (logique d'envoi d'email) ...

    // Renvoyer un nouveau token est une bonne pratique après un changement de mot de passe
    sendTokenResponse(user, 200, res);
});

/**
 * @desc    Mot de passe oublié (demande de réinitialisation)
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
     return next(new ErrorResponse('Veuillez fournir un email', 400));
  }

  const user = await User.findOne({ email });

  // Sécurité : Ne pas révéler si l'email existe ou non dans la réponse directe.
  if (!user) {
    console.log(`[FORGOT PASSWORD] Tentative pour email inexistant: ${email}`);
    // Renvoyer un succès générique même si l'utilisateur n'est pas trouvé
    return res.status(200).json({ success: true, data: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
  }

  // Générer et sauvegarder le token de réinitialisation (hashé) et sa date d'expiration
  let resetToken;
  try {
    // Assurez-vous que la méthode getResetPasswordToken existe dans votre modèle User.js
    resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false }); // Sauvegarde token hashé + expiration
  } catch(tokenError){
      console.error("Erreur génération/sauvegarde reset token:", tokenError);
      // Nettoyer les champs en cas d'erreur pour éviter un état invalide
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      // Ne pas essayer de sauvegarder à nouveau ici pour éviter une boucle si save échoue
      return next(new ErrorResponse('Erreur lors de la génération du token de réinitialisation', 500));
  }

  // Créer l'URL de réinitialisation (pointe vers la page frontend correspondante)
  // Utiliser une variable d'environnement pour l'URL du frontend
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`; // Le token NON hashé est dans l'URL

  const message = `Vous recevez cet email car une réinitialisation de mot de passe a été demandée pour votre compte MDMC Music Ads.\n\nCliquez sur le lien suivant ou copiez-le dans votre navigateur pour définir un nouveau mot de passe. Ce lien expirera dans ${process.env.RESET_PASSWORD_EXPIRE_MINUTES || 10} minutes:\n\n${resetUrl}\n\nSi vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.`;

  try {
    // Envoyer l'email (assurez-vous que sendEmail est configuré)
    if (!sendEmail) throw new Error("Service d'envoi d'email non configuré.");
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de votre mot de passe MDMC Music Ads',
      message // Utiliser 'text' ou 'html' selon votre fonction sendEmail
    });

    console.log(`[FORGOT PASSWORD] Email envoyé à ${user.email}`);
    res.status(200).json({ success: true, data: 'Email de réinitialisation envoyé avec succès.' });

  } catch (err) {
    console.error("[FORGOT PASSWORD] Erreur lors de l'envoi de l'email:", err);
    // Très important: Annuler le token si l'email n'a pas pu être envoyé pour éviter qu'il reste valide en BDD
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Essayer de sauvegarder l'annulation du token
    try {
        await user.save({ validateBeforeSave: false });
    } catch (saveErr) {
        console.error("Erreur lors de l'annulation du token après échec d'envoi email:", saveErr);
    }

    return next(new ErrorResponse("L'email de réinitialisation n'a pas pu être envoyé", 500));
  }
});

/**
 * @desc    Réinitialiser le mot de passe (via le lien reçu par email)
 * @route   PUT /api/auth/resetpassword/:resettoken
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  if (!password) {
      return next(new ErrorResponse('Veuillez fournir un nouveau mot de passe', 400));
  }
  if (!resettoken) {
      return next(new ErrorResponse('Token de réinitialisation manquant', 400));
  }

  // Hasher le token reçu de l'URL pour le comparer à celui (hashé) stocké en BDD
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resettoken)
    .digest('hex');

  // Trouver l'utilisateur avec le token hashé VALIDE (non expiré)
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() } // Vérifie que la date d'expiration est future
  });

  if (!user) {
    // Le token n'est pas trouvé ou a expiré
    return next(new ErrorResponse('Le lien de réinitialisation est invalide ou a expiré', 400));
  }

  // Définir le nouveau mot de passe
  user.password = password;
  // Effacer les champs de reset pour qu'ils ne soient pas réutilisables
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  // Le hook pre('save') dans le modèle User hachera le nouveau mot de passe
  await user.save();

  // Optionnel: Envoyer une notification email de confirmation de changement
  // ... (logique d'envoi d'email) ...

  // Connecter l'utilisateur automatiquement après réinitialisation en renvoyant un nouveau token
  sendTokenResponse(user, 200, res);
});


// --- Fonction Utilitaire pour envoyer Token et Cookie ---
// Factorisée pour être réutilisée par login, register, updatePassword, resetPassword
const sendTokenResponse = (user, statusCode, res) => {
  // Créer le token JWT signé (méthode à définir dans le modèle User.js)
  const token = user.getSignedJwtToken();

  // Options pour le cookie HttpOnly
  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS || '30', 10);
  const options = {
    // Date d'expiration du cookie
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true, // Le cookie n'est pas accessible via JavaScript côté client
    // secure: false, // Par défaut en dev (HTTP)
    // sameSite: 'Lax' // Politique SameSite par défaut
  };

  // En production (HTTPS), le cookie DOIT être 'secure'
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    // Si votre frontend et backend sont sur des domaines différents en production,
    // vous pourriez avoir besoin de 'SameSite=None; Secure'.
    // Mais s'ils sont sur le même domaine ou sous-domaines, 'Lax' ou 'Strict' est mieux.
    // options.sameSite = 'None'; // À utiliser avec précaution et seulement si nécessaire
  }

  // Envoi de la réponse :
  // 1. Définit le cookie 'token' dans le navigateur du client
  // 2. Renvoie une réponse JSON avec succès et le token (optionnel mais parfois utile pour le client)
  res
    .status(statusCode)
    .cookie('token', token, options) // Définit le cookie
    .json({
      success: true,
      // Optionnel: Renvoyer aussi le token dans le corps JSON
      // token: token,
      // Optionnel: Renvoyer certaines données utilisateur (sans le mot de passe)
      // data: { _id: user._id, username: user.username, email: user.email, role: user.role }
    });
};
