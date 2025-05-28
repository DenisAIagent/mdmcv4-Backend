// backend/controllers/authController.js

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require("../middleware/asyncHandler"); // Assure-toi que ce chemin est correct
const sendEmail = require('../utils/sendEmail'); // Assure-toi que ce chemin est correct
const crypto = require('crypto');

// --- Fonction Utilitaire pour envoyer Token et Cookie ---
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken(); 
  
  console.log('[sendTokenResponse] Generated Token:', token ? 'Token généré (longueur: ' + token.length + ')' : 'Aucun token généré');

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS || '30', 10);
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true, 
    path: '/',      
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;    
    options.sameSite = 'None';  
  } else {
    options.sameSite = 'Lax'; 
  }

  console.log('[sendTokenResponse] Cookie options:', options);

  res
    .status(statusCode)
    .cookie('token', token, options) 
    .json({
      success: true,
      token: token, 
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

  sendTokenResponse(user, 201, res);
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
    return next(new ErrorResponse('Identifiants invalides', 401));
  }
  console.log(`[LOGIN ATTEMPT] User found: ID=${user._id}. Comparing password...`);

  const isMatch = await user.matchPassword(password);
  console.log(`[LOGIN ATTEMPT] Password match result for ${user.email}: ${isMatch}`);

  if (!isMatch) {
    console.log(`[LOGIN FAILED] Password mismatch for user: ${user.email}`);
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  console.log(`[LOGIN SUCCESS] Password matched for user: ${user.email}. Proceeding...`);

  try {
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    console.log(`[LOGIN SUCCESS] Updated lastLogin for user: ${user.email}`);
  } catch(saveError) {
    console.error(`[LOGIN ERROR] Failed to update lastLogin for user: ${user.email}`, saveError);
  }

  console.log(`[LOGIN SUCCESS] Calling sendTokenResponse for user: ${user.email}`);
  sendTokenResponse(user, 200, res);
  console.log(`[LOGIN SUCCESS] Token response sent for user: ${user.email}`);
});


/**
 * @desc     Déconnexion utilisateur / effacer le cookie
 * @route    GET /api/auth/logout
 * @access   Privé (nécessite 'protect' sur la route)
 */
exports.logout = asyncHandler(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() - 10 * 1000), 
    httpOnly: true,
    path: '/', 
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'None'; 
  } else {
    cookieOptions.sameSite = 'Lax'; 
  }

  console.log('[logout] Clearing cookie with options:', cookieOptions);

  res.status(200)
     .cookie('token', 'none', cookieOptions) 
     .json({
       success: true,
       data: {}
     });
});

/**
 * @desc     Obtenir l'utilisateur actuel (basé sur le token)
 * @route    GET /api/auth/me
 * @access   Privé (nécessite 'protect')
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.id) { 
      return next(new ErrorResponse('Utilisateur non authentifié ou non trouvé dans la requête', 401));
  }
  res.status(200).json({
    success: true,
    data: req.user 
  });
});

/**
 * @desc     Mettre à jour le mot de passe (utilisateur connecté)
 * @route    PUT /api/auth/updatepassword
 * @access   Privé (nécessite 'protect')
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return next(new ErrorResponse('Utilisateur non authentifié pour la mise à jour du mot de passe', 401));
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new ErrorResponse('Veuillez fournir le mot de passe actuel et le nouveau mot de passe', 400));
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        return next(new ErrorResponse('Utilisateur non trouvé', 404));
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
    }

    user.password = newPassword; 
    await user.save();
    
    // Plutôt que de renvoyer un nouveau token ici, on peut juste confirmer le succès.
    // Le token existant reste valide jusqu'à son expiration.
    res.status(200).json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
});

/**
 * @desc     Mot de passe oublié (demande de réinitialisation)
 * @route    POST /api/auth/forgotpassword
 * @access   Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
      return next(new ErrorResponse('Veuillez fournir un email', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    console.log(`[FORGOT PASSWORD] Tentative pour email (potentiellement inexistant): ${email}`);
    return res.status(200).json({ success: true, data: 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.' });
  }

  let resetToken;
  try {
    resetToken = user.getResetPasswordToken(); 
    await user.save({ validateBeforeSave: false }); 
  } catch(tokenError){
      console.error("Erreur génération/sauvegarde reset token:", tokenError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      try { await user.save({ validateBeforeSave: false }); } catch (e) { /* ignore */ }
      return next(new ErrorResponse('Erreur lors de la génération du token de réinitialisation', 500));
  }

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/resetpassword/${resetToken}`;
  const message = `Vous recevez cet email car une réinitialisation de mot de passe a été demandée pour votre compte MDMC Music Ads.\n\nCliquez sur le lien suivant ou copiez-le dans votre navigateur pour définir un nouveau mot de passe. Ce lien expirera dans ${process.env.RESET_PASSWORD_EXPIRE_MINUTES || 10} minutes:\n\n${resetUrl}\n\nSi vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.`;

  try {
    if (!sendEmail || typeof sendEmail !== 'function') { // Vérification plus robuste
        console.error("Service d'envoi d'email non configuré ou non importé correctement.");
        throw new Error("Service d'envoi d'email non disponible.");
    }
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de votre mot de passe MDMC Music Ads',
      message 
    });

    console.log(`[FORGOT PASSWORD] Email envoyé à ${user.email}`);
    res.status(200).json({ success: true, data: 'Email de réinitialisation envoyé avec succès.' });

  } catch (err) {
    console.error("[FORGOT PASSWORD] Erreur lors de l'envoi de l'email:", err.message);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    try {
        await user.save({ validateBeforeSave: false });
    } catch (saveErr) {
        console.error("Erreur lors de l'annulation du token après échec d'envoi email:", saveErr);
    }
    return next(new ErrorResponse("L'email de réinitialisation n'a pas pu être envoyé", 500));
  }
});

/**
 * @desc     Réinitialiser le mot de passe (via le lien reçu par email)
 * @route    PUT /api/auth/resetpassword/:resettoken
 * @access   Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { resettoken } = req.params; 

  if (!password) {
      return next(new ErrorResponse('Veuillez fournir un nouveau mot de passe', 400));
  }
  if (!resettoken) {
      return next(new ErrorResponse('Token de réinitialisation manquant dans l\'URL', 400));
  }

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken, 
    resetPasswordExpire: { $gt: Date.now() } 
  });

  if (!user) {
    return next(new ErrorResponse('Le lien de réinitialisation est invalide ou a expiré', 400));
  }

  user.password = password; 
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});
