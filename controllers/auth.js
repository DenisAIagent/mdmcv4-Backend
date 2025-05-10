const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
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
    password
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Connexion utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Valider email et mot de passe
  if (!email || !password) {
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  // Vérifier l'utilisateur
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Vérifier si le mot de passe correspond
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Mettre à jour la date de dernière connexion
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Déconnexion utilisateur / effacer le cookie
// @route   GET /api/auth/logout
// @access  Private
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
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Mettre à jour le mot de passe
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Vérifier le mot de passe actuel
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Mot de passe incorrect', 401));
  }

  // Envoyer une notification par email
  await sendEmail({
    email: process.env.NOTIFICATION_EMAIL || 'adpromo.media@gmail.com',
    subject: 'Alerte de sécurité - Changement de mot de passe',
    message: `Un changement de mot de passe a été effectué pour le compte ${user.email} sur MDMC Music Ads. Si vous n'êtes pas à l'origine de cette action, veuillez contacter l'administrateur immédiatement.`
  });

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Mot de passe oublié
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Aucun utilisateur avec cet email', 404));
  }

  // Obtenir le token de réinitialisation
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Créer l'URL de réinitialisation
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`;

  const message = `Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe : \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation de mot de passe',
      message
    });

    // Envoyer une notification à l'adresse de surveillance
    await sendEmail({
      email: process.env.NOTIFICATION_EMAIL || 'adpromo.media@gmail.com',
      subject: 'Alerte de sécurité - Demande de réinitialisation de mot de passe',
      message: `Une demande de réinitialisation de mot de passe a été effectuée pour le compte ${user.email} sur MDMC Music Ads.`
    });

    res.status(200).json({ success: true, data: 'Email envoyé' });
  } catch (err) {
    console.log(err);
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
  // Obtenir le token hashé
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token invalide', 400));
  }

  // Définir le nouveau mot de passe
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Envoyer une notification par email
  await sendEmail({
    email: process.env.NOTIFICATION_EMAIL || 'adpromo.media@gmail.com',
    subject: 'Alerte de sécurité - Mot de passe réinitialisé',
    message: `Le mot de passe a été réinitialisé pour le compte ${user.email} sur MDMC Music Ads.`
  });

  sendTokenResponse(user, 200, res);
});

// Fonction utilitaire pour envoyer la réponse avec token
const sendTokenResponse = (user, statusCode, res) => {
  // Créer le token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};
