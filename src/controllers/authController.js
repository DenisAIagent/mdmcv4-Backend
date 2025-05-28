const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password
    });

    // Envoyer la réponse avec le token
    sendTokenResponse(user, 201, res);
  } catch (error) {
    logger.error(`Erreur lors de l'inscription: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Valider les champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Vérifier si le mot de passe correspond
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      });
    }

    // Envoyer la réponse avec le token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Erreur lors de la connexion: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Déconnexion d'un utilisateur
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    // Supprimer le cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Erreur lors de la déconnexion: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Obtenir l'utilisateur actuellement connecté
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération du profil: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Rafraîchir le token JWT
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token manquant'
      });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      });
    }

    // Générer un nouveau token
    sendTokenResponse(user, 200, res);
  } catch (error) {
    logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`);
    res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

/**
 * Fonction utilitaire pour envoyer la réponse avec le token
 * @param {Object} user - Utilisateur
 * @param {number} statusCode - Code de statut HTTP
 * @param {Object} res - Objet de réponse Express
 */
const sendTokenResponse = (user, statusCode, res) => {
  // Créer le token
  const token = user.getSignedJwtToken();
  const refreshToken = user.getSignedRefreshToken();

  // Options pour le cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // Ajouter l'option secure en production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Envoyer la réponse avec le cookie
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      refreshToken
    });
};
