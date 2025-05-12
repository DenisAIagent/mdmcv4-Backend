// backend/controllers/authController.js

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require("../middleware/asyncHandler"); // Assure-toi que ce chemin est correct
const sendEmail = require('../utils/sendEmail'); // Assure-toi que ce chemin est correct
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Générer le token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Générer le refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

// Envoyer la réponse avec les tokens
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(statusCode)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, { ...options, path: '/api/v1/auth/refresh-token' })
    .json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
};

/**
 * @desc     S'inscrire en tant qu'utilisateur
 * @route    POST /api/v1/auth/register
 * @access   Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { name, email, password, role } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('Un utilisateur avec cet email existe déjà', 400));
  }

  // Créer l'utilisateur
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  // Envoyer l'email de confirmation
  const confirmToken = user.getConfirmEmailToken();
  await user.save({ validateBeforeSave: false });

  const confirmUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/confirm-email/${confirmToken}`;
  const message = `Vous recevez cet email car vous vous êtes inscrit sur MDMC Music Ads. Veuillez confirmer votre email en cliquant sur le lien suivant: \n\n ${confirmUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Confirmation de votre inscription',
      message
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    user.confirmEmailToken = undefined;
    user.confirmEmailExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email ne peut pas être envoyé', 500));
  }
});

/**
 * @desc     Connexion utilisateur
 * @route    POST /api/v1/auth/login
 * @access   Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log('Tentative de connexion avec:', { email });

  // Vérifier si l'email et le mot de passe sont fournis
  if (!email || !password) {
    return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));
  }

  // Vérifier si l'utilisateur existe
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Vérifier si le mot de passe correspond
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Identifiants invalides', 401));
  }

  // Vérifier si l'utilisateur est actif
  if (!user.isActive) {
    return next(new ErrorResponse('Compte désactivé', 401));
  }

  // Générer le token JWT
  const token = user.getSignedJwtToken();
  console.log('Token généré:', token);

  // Configurer les options du cookie
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Envoyer la réponse avec le token dans le cookie et le header
  res
    .status(200)
    .cookie('accessToken', token, options)
    .header('Authorization', `Bearer ${token}`)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  console.log('Connexion réussie pour:', email);
});

/**
 * @desc     Déconnexion utilisateur / effacer le cookie
 * @route    GET /api/v1/auth/logout
 * @access   Privé (nécessite 'protect' sur la route)
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('accessToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    path: '/api/v1/auth/refresh-token'
  });

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc     Obtenir l'utilisateur actuel (basé sur le token)
 * @route    GET /api/v1/auth/me
 * @access   Privé (nécessite 'protect')
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc     Mettre à jour le mot de passe (utilisateur connecté)
 * @route    PUT /api/v1/auth/updatepassword
 * @access   Privé (nécessite 'protect')
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  // Vérifier l'ancien mot de passe
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * @desc     Mot de passe oublié (demande de réinitialisation)
 * @route    POST /api/v1/auth/forgotpassword
 * @access   Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('Aucun utilisateur avec cet email', 404));
  }

  // Générer le token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Créer l'URL de réinitialisation
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;
  const message = `Vous recevez cet email car vous (ou quelqu'un d'autre) avez demandé la réinitialisation du mot de passe. Veuillez faire une requête PUT à: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Réinitialisation du mot de passe',
      message
    });

    res.status(200).json({ success: true, data: 'Email envoyé' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email ne peut pas être envoyé', 500));
  }
});

/**
 * @desc     Réinitialiser le mot de passe (via le lien reçu par email)
 * @route    PUT /api/v1/auth/resetpassword/:resettoken
 * @access   Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

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

  sendTokenResponse(user, 200, res);
});

/**
 * @desc     Confirmer l'email de l'utilisateur
 * @route    GET /api/v1/auth/confirm-email/:token
 * @access   Public
 */
exports.confirmEmail = asyncHandler(async (req, res, next) => {
  // Hasher le token
  const confirmEmailToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    confirmEmailToken,
    confirmEmailExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Token invalide ou expiré', 400));
  }

  // Mettre à jour l'utilisateur
  user.isEmailConfirmed = true;
  user.confirmEmailToken = undefined;
  user.confirmEmailExpire = undefined;
  await user.save();

  // Rediriger vers le frontend avec un message de succès
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  res.redirect(`${frontendUrl}/login?confirmed=true`);
});
