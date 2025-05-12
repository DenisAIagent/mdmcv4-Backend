const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Générer le token JWT
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE
});

// Générer le refresh token
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
  expiresIn: process.env.JWT_REFRESH_EXPIRE
});

// Envoyer la réponse avec les cookies sécurisés
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/'
  };

  const refreshOptions = {
    ...options,
    path: '/api/v1/auth/refresh-token'
  };

  res
    .status(statusCode)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, refreshOptions)
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

// REGISTER
exports.register = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new ErrorResponse(errors.array()[0].msg, 400));

  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) return next(new ErrorResponse('Un utilisateur avec cet email existe déjà', 400));

  const user = await User.create({ name, email, password, role: role || 'user' });

  const confirmToken = user.getConfirmEmailToken();
  await user.save({ validateBeforeSave: false });

  const confirmUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/confirm-email/${confirmToken}`;
  const message = `Veuillez confirmer votre email :\n\n${confirmUrl}`;

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

// LOGIN
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  console.log('Tentative de connexion avec:', { email });

  if (!email || !password) return next(new ErrorResponse('Veuillez fournir un email et un mot de passe', 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new ErrorResponse('Identifiants invalides', 401));

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return next(new ErrorResponse('Identifiants invalides', 401));

  if (!user.isActive) return next(new ErrorResponse('Compte désactivé', 401));
  if (!user.isEmailConfirmed) return next(new ErrorResponse('Veuillez confirmer votre email avant de vous connecter', 401));

  sendTokenResponse(user, 200, res);
  console.log('Connexion réussie pour:', email);
});

// LOGOUT
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('accessToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/'
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/api/v1/auth/refresh-token'
  });

  res.status(200).json({ success: true, data: {} });
});

// GET CURRENT USER
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: user });
});

// UPDATE PASSWORD
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new ErrorResponse(errors.array()[0].msg, 400));

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Mot de passe actuel incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// FORGOT PASSWORD
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new ErrorResponse('Aucun utilisateur avec cet email', 404));

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;
  const message = `Réinitialisez votre mot de passe ici :\n\n${resetUrl}`;

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

// RESET PASSWORD
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new ErrorResponse(errors.array()[0].msg, 400));

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) return next(new ErrorResponse('Token invalide', 400));

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// CONFIRM EMAIL
exports.confirmEmail = asyncHandler(async (req, res, next) => {
  const confirmEmailToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    confirmEmailToken,
    confirmEmailExpire: { $gt: Date.now() }
  });

  if (!user) return next(new ErrorResponse('Token invalide ou expiré', 400));

  user.isEmailConfirmed = true;
  user.confirmEmailToken = undefined;
  user.confirmEmailExpire = undefined;
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  res.redirect(`${frontendUrl}/login?confirmed=true`);
});
