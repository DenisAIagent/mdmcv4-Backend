const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware pour protéger les routes nécessitant une authentification
 * Vérifie la présence et la validité du token JWT dans les headers
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Vérifier si le header Authorization existe et commence par Bearer
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Extraire le token du header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Sinon, vérifier si le token est dans les cookies
      token = req.cookies.token;
    }
    
    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Non autorisé à accéder à cette ressource'
      });
    }
    
    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Ajouter l'utilisateur à la requête
      req.user = await User.findById(decoded.id);
      
      next();
    } catch (error) {
      logger.error(`Erreur de vérification du token: ${error.message}`);
      return res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré'
      });
    }
  } catch (error) {
    logger.error(`Erreur d'authentification: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * Middleware pour vérifier les rôles utilisateur
 * @param  {...string} roles - Rôles autorisés
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Vérifier si l'utilisateur existe et a un rôle autorisé
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Non autorisé à accéder à cette ressource'
      });
    }
    
    next();
  };
};

/**
 * Middleware pour vérifier la propriété d'une ressource
 * @param {string} model - Nom du modèle à vérifier
 * @param {string} paramName - Nom du paramètre contenant l'ID de la ressource
 */
exports.checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      // Récupérer le modèle
      const Model = require(`../models/${model}`);
      
      // Récupérer l'ID de la ressource
      const resourceId = req.params[paramName];
      
      // Récupérer la ressource
      const resource = await Model.findById(resourceId);
      
      // Vérifier si la ressource existe
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Ressource non trouvée'
        });
      }
      
      // Vérifier si l'utilisateur est le propriétaire de la ressource
      // ou s'il est admin (les admins peuvent tout faire)
      if (
        resource.user && 
        resource.user.toString() !== req.user.id && 
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
          error: 'Non autorisé à accéder à cette ressource'
        });
      }
      
      // Ajouter la ressource à la requête
      req.resource = resource;
      
      next();
    } catch (error) {
      logger.error(`Erreur de vérification de propriété: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Erreur serveur'
      });
    }
  };
};
