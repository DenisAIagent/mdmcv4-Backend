// controllers/auth.js - COMPLET AVEC LOGIN MODIFIÉ POUR DEBUG

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
// Correction : Assurez-vous que le chemin vers asyncHandler est correct
// Si asyncHandler est dans le même dossier middleware que protect/authorize,
// alors le chemin devrait probablement être '../middleware/asyncHandler'
// S'il vient d'une librairie, ajustez le require.
// Je garde le chemin tel que fourni initialement.
const asyncHandler = require("../middleware/asyncHandler");
const sendEmail = require('../utils/sendEmail'); // Assurez-vous que ce chemin est correct
const crypto = require('crypto');

// @desc    S'inscrire en tant qu'utilisateur
// @route   POST /api/auth/register
// @access  Public
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

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
// ***** VERSION MODIFIÉE AVEC LOGS POUR DEBUG *****
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // LOG 1: Afficher l'email reçu (vérifier la casse et les espaces)
  console.log(`[LOGIN ATTEMPT] Received login attempt for email: "${email}"`);

  // Valider email et mot de passe
  if (!email || !password) {
    console.log('[LOGIN FAILED] Missing email or password'); // LOG 2: Champs manquants
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  // Vérifier l'utilisateur
  console.log(`[LOGIN ATTEMPT] Finding user with email: "${email}"`); // LOG 3: Recherche utilisateur
  const user = await User.findOne({ email }).select('+password'); // Recherche sensible à la casse par défaut

  if (!user) {
    console.log(`[LOGIN FAILED] User not found for email: "${email}"`); // LOG 4: Utilisateur non trouvé
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // LOG: Utilisateur trouvé, affichage de l'ID et email stocké pour comparaison
  console.log(`[LOGIN ATTEMPT] User found: ID=${user._id}, Email DB="${user.email}". Comparing password...`); // LOG 5: Utilisateur trouvé, comparaison mdp

  // Vérifier si le mot de passe correspond
  let isMatch = false; // Initialiser à false
  try {
      isMatch = await user.matchPassword(password); // Appel à bcrypt.compare via la méthode du modèle
      // LOG: Résultat de la comparaison
      console.log(`[LOGIN ATTEMPT] Password match result for ${user.email}: ${isMatch}`); // LOG 6: Résultat comparaison
  } catch (compareError) {
      // LOG: Erreur pendant la comparaison bcrypt elle-même (très rare)
      console.error(`[LOGIN ERROR] Error during password comparison for ${user.email}:`, compareError);
      return next(new ErrorResponse('Erreur lors de la vérification des identifiants', 500)); // Erreur serveur
  }


  if (!isMatch) {
    console.log(`[LOGIN FAILED] Password mismatch for user: ${user.email}`); // LOG 7: Mot de passe incorrect
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // --- Si on arrive ici, la comparaison a réussi ---
  console.log(`[LOGIN SUCCESS] Password matched for user: ${user.email}. Proceeding...`); // LOG 8: Succès comparaison

  // Mettre à jour la date de dernière connexion
  try {
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    console.log(`[LOGIN SUCCESS] Updated lastLogin for user: ${user.email}`); // LOG 9: lastLogin mis à jour
  } catch(saveError) {
    console.error(`[LOGIN ERROR] Failed to update lastLogin for user: ${user.email}`, saveError); // LOG 10: Erreur save lastLogin
    // On continue quand même pour envoyer le token si possible, mais on log l'erreur
  }

  // Envoyer le token (cette fonction contient l'appel à JWT_SECRET et JWT_COOKIE_EXPIRE)
  console.log(`[LOGIN SUCCESS] Calling sendTokenResponse for user: ${user.email}`); // LOG 11: Appel sendTokenResponse
  try {
      sendTokenResponse(user, 200, res);
      console.log(`[LOGIN SUCCESS] Token response sent for user: ${user.email}`); // LOG 12: Réponse envoyée
  } catch (tokenError) {
      console.error(`[LOGIN ERROR] Error during sendTokenResponse for user: ${user.email}`, tokenError); // LOG 13: Erreur sendTokenResponse
      // Si sendTokenResponse plante, le client peut ne pas recevoir de réponse correcte
      // On envoie une erreur serveur générique car le login a techniquement réussi mais l'envoi du token a échoué
      return next(new ErrorResponse('Erreur serveur lors de la finalisation de la connexion.', 500));
  }
});
// ***** FIN DE LA VERSION MODIFIÉE DE LOGIN *****


// @desc    Déconnexion utilisateur / effacer le cookie
// @route   GET /api/auth/logout
// @access  Private (devrait être protégé)
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtenir l'utilisateur actuel
// @route   GET /api/auth/me
// @access  Private (devrait être protégé)
exports.getMe = asyncHandler(async (req, res, next) => {
  // Note: req.user est normalement défini par le middleware 'protect'
  // Si 'protect' est commenté, req.user sera undefined ici et cela échouera.
  if (!req.user || !req.user.id) {
       return next(new ErrorResponse('Utilisateur non authentifié ou ID manquant', 401));
   }
  const user = await User.findById(req.user.id);

   if (!user) {
       return next(new ErrorResponse('Utilisateur non trouvé', 404));
   }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/updatepassword
// @access  Private (devrait être protégé)
exports.updatePassword = asyncHandler(async (req, res, next) => {
  // Note: req.user est normalement défini par le middleware 'protect'
   if (!req.user || !req.user.id) {
       return next(new ErrorResponse('Utilisateur non authentifié ou ID manquant pour la mise à jour du mot de passe', 401));
   }
  const user = await User.findById(req.user.id).select('+password');

   if (!user) {
       return next(new ErrorResponse('Utilisateur non trouvé pour la mise à jour du mot de passe', 404));
   }

  // Vérifier le mot de passe actuel
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
  }

  // Mettre à jour avec le nouveau mot de passe
  // Le hook pre('save') dans User.js s'occupera du hachage
  user.password = req.body.newPassword;
  await user.save(); // Laisser les validateurs tourner ici

  // Envoyer une notification par email (si configuré et souhaité)
  if (sendEmail && process.env.NOTIFICATION_EMAIL) {
      try {
          await sendEmail({
              email: process.env.NOTIFICATION_EMAIL, // Envoyer à l'admin
              subject: 'Alerte de sécurité - Changement de mot de passe',
              message: `Un changement de mot de passe a été effectué pour le compte ${user.email} sur MDMC Music Ads. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'administrateur immédiatement.`
          });
      } catch (emailError) {
          console.error("Erreur lors de l'envoi de l'email de notification de changement de mot de passe:", emailError);
          // Ne pas bloquer la réponse juste pour une notification échouée
      }
  } else {
      console.warn("NOTIFICATION_EMAIL non configuré ou sendEmail non disponible, pas de notification de changement de mot de passe envoyée.");
  }


  sendTokenResponse(user, 200, res); // Renvoyer un nouveau token après changement de mot de passe
});

// @desc    Mot de passe oublié
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
    // On renvoie toujours un succès apparent, mais l'email n'est envoyé que si l'utilisateur existe
    console.log(`[FORGOT PASSWORD] Attempt for non-existent email: ${req.body.email}`);
    return res.status(200).json({ success: true, data: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
  }

  // Obtenir le token de réinitialisation et la date d'expiration
  // Assurez-vous que la méthode getResetPasswordToken est définie dans models/User.js
  let resetToken;
  try {
    resetToken = user.getResetPasswordToken(); // Cette méthode doit générer ET sauvegarder le token hashé et l'expiration
    await user.save({ validateBeforeSave: false }); // Sauvegarde le token hashé et l'expiration
  } catch(tokenError){
      console.error("Erreur lors de la génération/sauvegarde du reset token:", tokenError);
      return next(new ErrorResponse('Erreur lors de la génération du token', 500));
  }


  // Créer l'URL de réinitialisation pointant vers le FRONTEND
  // Assurez-vous que FRONTEND_URL est défini dans vos variables d'environnement
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`; // Utilise le token NON hashé

  const message = `Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien suivant, ou copiez-le dans votre navigateur pour réinitialiser votre mot de passe. Ce lien expirera dans ${process.env.RESET_PASSWORD_EXPIRE || '10'} minutes: \n\n ${resetUrl}`;

  try {
    // Vérifier si sendEmail est fonctionnel
    if (!sendEmail) {
        console.error("Fonction sendEmail non disponible/importée.");
        throw new Error("Service email non configuré.");
    }

    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe - MDMC Music Ads',
      message
    });

    // Envoyer une notification à l'adresse de surveillance (si configurée)
    if (process.env.NOTIFICATION_EMAIL) {
        try {
            await sendEmail({
                email: process.env.NOTIFICATION_EMAIL,
                subject: 'Alerte - Demande de réinitialisation de mot de passe',
                message: `Une demande de réinitialisation de mot de passe a été effectuée pour le compte ${user.email} sur MDMC Music Ads.`
            });
        } catch (notifyError) {
             console.error("Erreur lors de l'envoi de l'email de notification pour forgotPassword:", notifyError);
        }
    }

    res.status(200).json({ success: true, data: 'Email envoyé' });
  } catch (err) {
    console.error("[FORGOT PASSWORD] Erreur lors de l'envoi de l'email:", err); // Log l'erreur réelle
    // Important : Il faut effacer le token si l'email n'est pas parti pour éviter qu'un token valide existe sans que l'utilisateur ait reçu le lien
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('L\'email n\'a pas pu être envoyé', 500));
  }
});

// @desc    Réinitialiser le mot de passe
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Obtenir le token hashé à partir du token reçu dans l'URL
  // Assurez-vous que la logique de hachage ici est la même que celle utilisée dans getResetPasswordToken si elle stocke un hash
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken) // Hasher le token reçu du client
    .digest('hex');

  // Trouver l'utilisateur par le token hashé ET vérifier l'expiration
  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken, // Comparer avec le token hashé stocké
    resetPasswordExpire: { $gt: Date.now() } // Vérifier que la date d'expiration est dans le futur
  });

  if (!user) {
    // Token non trouvé ou expiré
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }

  // Définir le nouveau mot de passe (le hook pre('save') s'occupera du hachage)
  user.password = req.body.password;
  // Nettoyer les champs de réinitialisation
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save(); // Sauvegarde l'utilisateur avec le nouveau mot de passe haché

  // Envoyer une notification par email (si configuré)
  if (sendEmail && process.env.NOTIFICATION_EMAIL) {
      try {
          await sendEmail({
              email: process.env.NOTIFICATION_EMAIL,
              subject: 'Alerte de sécurité - Mot de passe réinitialisé',
              message: `Le mot de passe a été réinitialisé avec succès pour le compte ${user.email} sur MDMC Music Ads via le processus de mot de passe oublié.`
          });
      } catch (notifyError) {
          console.error("Erreur lors de l'envoi de l'email de notification pour resetPassword:", notifyError);
      }
  }

  // Renvoyer un token de connexion
  sendTokenResponse(user, 200, res);
});


// Fonction utilitaire pour envoyer la réponse avec token
// (Normalement définie une seule fois dans le fichier)
const sendTokenResponse = (user, statusCode, res) => {
  // Créer le token
  const token = user.getSignedJwtToken();

  // Calculer l'expiration du cookie
  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10); // Utilise 30 jours par défaut si non défini
  const cookieExpireMs = cookieExpireDays * 24 * 60 * 60 * 1000;

  const options = {
    expires: new Date(Date.now() + cookieExpireMs),
    httpOnly: true // Le cookie n'est pas accessible via JavaScript côté client
  };

  // Mettre le cookie en secure uniquement en production (nécessite HTTPS)
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    // options.sameSite = 'None'; // Potentiellement nécessaire si frontend et backend sont sur des domaines différents pour les cookies tiers
  } else {
      // options.sameSite = 'Lax'; // Lax est un bon défaut en développement
  }

  res
    .status(statusCode)
    .cookie('token', token, options) // Envoi du cookie
    .json({ // Envoi du token dans le corps aussi (pratique pour certaines stratégies frontend)
      success: true,
      token
    });
};
