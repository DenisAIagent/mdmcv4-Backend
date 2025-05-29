const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const db = require('../models');

/**
 * Middleware d'authentification pour MDMC Music Ads v4
 * Vérifie la présence et la validité du token JWT
 */

const verifyToken = (req, res, next) => {
  // Récupérer le token depuis l'en-tête Authorization ou les cookies
  const token = req.headers['x-access-token'] || req.headers['authorization']?.split(' ')[1] || req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Aucun token fourni. Authentification requise.'
    });
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, config.secret);
    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.',
        expired: true
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token non valide. Authentification requise.'
    });
  }
};

/**
 * Middleware de vérification du rôle administrateur
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await db.user.findById(req.userId).populate('roles');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    // Vérifier si l'utilisateur a le rôle 'admin'
    const roles = user.roles.map(role => role.name);
    
    if (roles.includes('admin')) {
      next();
      return;
    }
    
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Rôle administrateur requis.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des rôles.',
      error: error.message
    });
  }
};

/**
 * Middleware de vérification des rôles
 */
const hasRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = await db.user.findById(req.userId).populate('roles');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé.'
        });
      }
      
      // Vérifier si l'utilisateur a au moins un des rôles requis
      const userRoles = user.roles.map(role => role.name);
      
      // Les administrateurs ont accès à tout
      if (userRoles.includes('admin')) {
        next();
        return;
      }
      
      // Vérifier l'intersection entre les rôles de l'utilisateur et les rôles requis
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (hasRequiredRole) {
        next();
        return;
      }
      
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Rôle requis: ' + requiredRoles.join(', ')
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des rôles.',
        error: error.message
      });
    }
  };
};

/**
 * Middleware de vérification des permissions
 */
const hasPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = await db.user.findById(req.userId).populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé.'
        });
      }
      
      // Récupérer toutes les permissions de l'utilisateur
      let userPermissions = [];
      
      // Les administrateurs ont toutes les permissions
      const isUserAdmin = user.roles.some(role => role.name === 'admin');
      if (isUserAdmin) {
        next();
        return;
      }
      
      // Collecter toutes les permissions de tous les rôles de l'utilisateur
      user.roles.forEach(role => {
        if (role.permissions.some(perm => perm.name === 'all')) {
          // Si un rôle a la permission 'all', l'utilisateur a toutes les permissions
          userPermissions.push('all');
        } else {
          // Sinon, ajouter les permissions spécifiques
          role.permissions.forEach(perm => {
            if (!userPermissions.includes(perm.name)) {
              userPermissions.push(perm.name);
            }
          });
        }
      });
      
      // Vérifier si l'utilisateur a toutes les permissions requises
      const hasAllRequiredPermissions = userPermissions.includes('all') || 
        requiredPermissions.every(perm => userPermissions.includes(perm));
      
      if (hasAllRequiredPermissions) {
        next();
        return;
      }
      
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Permissions requises: ' + requiredPermissions.join(', ')
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions.',
        error: error.message
      });
    }
  };
};

/**
 * Middleware de vérification du statut actif
 */
const isActive = async (req, res, next) => {
  try {
    const user = await db.user.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Compte inactif. Veuillez contacter un administrateur.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du statut.',
      error: error.message
    });
  }
};

/**
 * Middleware de journalisation des accès
 */
const logAccess = async (req, res, next) => {
  try {
    // Enregistrer l'accès dans la base de données
    const accessLog = new db.accessLog({
      userId: req.userId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    await accessLog.save();
    next();
  } catch (error) {
    // Ne pas bloquer la requête en cas d'erreur de journalisation
    console.error('Erreur de journalisation:', error);
    next();
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  hasRole,
  hasPermission,
  isActive,
  logAccess
};

module.exports = authJwt;
