/**
 * Contrôleur d'authentification pour MDMC Music Ads v4
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;

/**
 * Inscription d'un nouvel utilisateur
 */
exports.signup = async (req, res) => {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [
        { username: req.body.username },
        { email: req.body.email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur ou l'email est déjà utilisé"
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Trouver le rôle utilisateur par défaut
    const role = await Role.findOne({ name: "user" });

    if (!role) {
      return res.status(500).json({
        success: false,
        message: "Rôle utilisateur non trouvé"
      });
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      fullName: req.body.fullName,
      roles: [role._id]
    });

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: ["user"]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'inscription",
      error: error.message
    });
  }
};

/**
 * Connexion d'un utilisateur
 */
exports.signin = async (req, res) => {
  try {
    // Trouver l'utilisateur par son nom d'utilisateur
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Nom d'utilisateur ou mot de passe incorrect"
      });
    }

    // Vérifier le mot de passe
    const passwordIsValid = await user.comparePassword(req.body.password);

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Nom d'utilisateur ou mot de passe incorrect"
      });
    }

    // Vérifier si le compte est actif
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: "Compte inactif. Veuillez contacter un administrateur."
      });
    }

    // Générer le token JWT
    const token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: config.jwtExpiration
    });

    // Générer le refresh token
    const refreshToken = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: config.jwtRefreshExpiration
    });

    // Enregistrer le refresh token dans la base de données
    await db.refreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiryDate: new Date(Date.now() + config.jwtRefreshExpiration * 1000)
    });

    // Mettre à jour la date de dernière connexion
    user.lastLogin = Date.now();
    await user.save();

    // Récupérer les rôles de l'utilisateur
    const roles = await Role.find({ _id: { $in: user.roles } });
    const roleNames = roles.map(role => role.name);

    // Envoyer la réponse
    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      accessToken: token,
      refreshToken: refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: roleNames
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la connexion",
      error: error.message
    });
  }
};

/**
 * Déconnexion d'un utilisateur
 */
exports.signout = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token requis"
      });
    }

    // Supprimer le refresh token de la base de données
    await db.refreshToken.findOneAndDelete({ token: refreshToken });

    // Supprimer le cookie de refresh token si présent
    if (req.cookies.refreshToken) {
      res.clearCookie('refreshToken');
    }

    res.status(200).json({
      success: true,
      message: "Déconnexion réussie"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la déconnexion",
      error: error.message
    });
  }
};

/**
 * Rafraîchissement du token
 */
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token requis"
      });
    }

    // Vérifier si le refresh token existe dans la base de données
    const refreshTokenDoc = await db.refreshToken.findOne({ token: refreshToken });

    if (!refreshTokenDoc) {
      return res.status(403).json({
        success: false,
        message: "Refresh token invalide"
      });
    }

    // Vérifier si le refresh token est expiré
    if (refreshTokenDoc.expiryDate.getTime() < new Date().getTime()) {
      await db.refreshToken.findByIdAndDelete(refreshTokenDoc._id);
      
      return res.status(403).json({
        success: false,
        message: "Refresh token expiré. Veuillez vous reconnecter."
      });
    }

    // Générer un nouveau token JWT
    const newAccessToken = jwt.sign({ id: refreshTokenDoc.userId }, config.secret, {
      expiresIn: config.jwtExpiration
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du rafraîchissement du token",
      error: error.message
    });
  }
};

/**
 * Vérification du token
 */
exports.verifyToken = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Token valide",
    userId: req.userId
  });
};

/**
 * Récupération du profil utilisateur
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Récupérer les rôles de l'utilisateur
    const roles = await Role.find({ _id: { $in: user.roles } });
    const roleNames = roles.map(role => role.name);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: roleNames,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du profil",
      error: error.message
    });
  }
};

/**
 * Mise à jour du profil utilisateur
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Mettre à jour les champs modifiables
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.email) user.email = req.body.email;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du profil",
      error: error.message
    });
  }
};

/**
 * Changement de mot de passe
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe actuel et nouveau mot de passe requis"
      });
    }

    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier le mot de passe actuel
    const passwordIsValid = await user.comparePassword(currentPassword);

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe actuel incorrect"
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe changé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du changement de mot de passe",
      error: error.message
    });
  }
};

/**
 * Demande de réinitialisation de mot de passe
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email requis"
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      // Pour des raisons de sécurité, ne pas indiquer si l'email existe ou non
      return res.status(200).json({
        success: true,
        message: "Si l'email existe, un lien de réinitialisation a été envoyé"
      });
    }

    // Générer un token de réinitialisation
    const resetToken = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: '1h'
    });

    // Enregistrer le token de réinitialisation dans la base de données
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Dans une application réelle, envoyer un email avec le lien de réinitialisation
    // Pour ce test, nous retournons simplement le token
    res.status(200).json({
      success: true,
      message: "Si l'email existe, un lien de réinitialisation a été envoyé",
      resetToken // À supprimer en production
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la demande de réinitialisation de mot de passe",
      error: error.message
    });
  }
};

/**
 * Réinitialisation de mot de passe
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token et nouveau mot de passe requis"
      });
    }

    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, config.secret);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré"
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe",
      error: error.message
    });
  }
};

/**
 * Récupération de tous les utilisateurs (admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('roles');
    
    const formattedUsers = users.map(user => {
      const roleNames = user.roles.map(role => role.name);
      
      return {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: roleNames,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      };
    });

    res.status(200).json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
      error: error.message
    });
  }
};

/**
 * Création d'un utilisateur (admin)
 */
exports.createUser = async (req, res) => {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [
        { username: req.body.username },
        { email: req.body.email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur ou l'email est déjà utilisé"
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Trouver les rôles
    let roles = [];
    if (req.body.roles && req.body.roles.length > 0) {
      roles = await Role.find({ name: { $in: req.body.roles } });
    } else {
      // Rôle utilisateur par défaut
      const defaultRole = await Role.findOne({ name: "user" });
      if (defaultRole) {
        roles = [defaultRole];
      }
    }

    if (roles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Rôles invalides"
      });
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      fullName: req.body.fullName,
      roles: roles.map(role => role._id),
      status: req.body.status || 'active'
    });

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: roles.map(role => role.name),
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur",
      error: error.message
    });
  }
};

/**
 * Mise à jour d'un utilisateur (admin)
 */
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier si le nom d'utilisateur ou l'email est déjà utilisé
    if (req.body.username && req.body.username !== user.username) {
      const existingUsername = await User.findOne({ username: req.body.username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Ce nom d'utilisateur est déjà utilisé"
        });
      }
      user.username = req.body.username;
    }

    if (req.body.email && req.body.email !== user.email) {
      const existingEmail = await User.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Cet email est déjà utilisé"
        });
      }
      user.email = req.body.email;
    }

    // Mettre à jour les autres champs
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.status) user.status = req.body.status;

    // Mettre à jour le mot de passe si fourni
    if (req.body.password) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashedPassword;
    }

    // Mettre à jour les rôles si fournis
    if (req.body.roles && req.body.roles.length > 0) {
      const roles = await Role.find({ name: { $in: req.body.roles } });
      if (roles.length > 0) {
        user.roles = roles.map(role => role._id);
      }
    }

    await user.save();

    // Récupérer les noms des rôles
    const roles = await Role.find({ _id: { $in: user.roles } });
    const roleNames = roles.map(role => role.name);

    res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles: roleNames,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'utilisateur",
      error: error.message
    });
  }
};

/**
 * Suppression d'un utilisateur (admin)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Vérifier si l'utilisateur est un admin
    const roles = await Role.find({ _id: { $in: user.roles } });
    const isAdmin = roles.some(role => role.name === 'admin');

    // Empêcher la suppression du dernier admin
    if (isAdmin) {
      const adminCount = await User.countDocuments({
        roles: { $in: roles.filter(role => role.name === 'admin').map(role => role._id) }
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "Impossible de supprimer le dernier administrateur"
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
      error: error.message
    });
  }
};

/**
 * Récupération de tous les rôles (admin)
 */
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions');
    
    const formattedRoles = roles.map(role => {
      return {
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions.map(perm => perm.name)
      };
    });

    res.status(200).json({
      success: true,
      roles: formattedRoles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des rôles",
      error: error.message
    });
  }
};

/**
 * Création d'un rôle (admin)
 */
exports.createRole = async (req, res) => {
  try {
    // Vérifier si le rôle existe déjà
    const existingRole = await Role.findOne({ name: req.body.name });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Ce rôle existe déjà"
      });
    }

    // Trouver les permissions
    let permissions = [];
    if (req.body.permissions && req.body.permissions.length > 0) {
      permissions = await db.permission.find({ name: { $in: req.body.permissions } });
    }

    // Créer le nouveau rôle
    const role = await Role.create({
      name: req.body.name,
      displayName: req.body.displayName || req.body.name,
      description: req.body.description || '',
      permissions: permissions.map(perm => perm._id)
    });

    res.status(201).json({
      success: true,
      message: "Rôle créé avec succès",
      role: {
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: permissions.map(perm => perm.name)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du rôle",
      error: error.message
    });
  }
};

/**
 * Mise à jour d'un rôle (admin)
 */
exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rôle non trouvé"
      });
    }

    // Empêcher la modification du rôle admin
    if (role.name === 'admin') {
      return res.status(400).json({
        success: false,
        message: "Le rôle admin ne peut pas être modifié"
      });
    }

    // Vérifier si le nom est déjà utilisé
    if (req.body.name && req.body.name !== role.name) {
      const existingRole = await Role.findOne({ name: req.body.name });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: "Ce nom de rôle est déjà utilisé"
        });
      }
      role.name = req.body.name;
    }

    // Mettre à jour les autres champs
    if (req.body.displayName) role.displayName = req.body.displayName;
    if (req.body.description) role.description = req.body.description;

    // Mettre à jour les permissions si fournies
    if (req.body.permissions && req.body.permissions.length > 0) {
      const permissions = await db.permission.find({ name: { $in: req.body.permissions } });
      if (permissions.length > 0) {
        role.permissions = permissions.map(perm => perm._id);
      }
    }

    await role.save();

    // Récupérer les noms des permissions
    const permissions = await db.permission.find({ _id: { $in: role.permissions } });
    const permissionNames = permissions.map(perm => perm.name);

    res.status(200).json({
      success: true,
      message: "Rôle mis à jour avec succès",
      role: {
        id: role._id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: permissionNames
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du rôle",
      error: error.message
    });
  }
};

/**
 * Suppression d'un rôle (admin)
 */
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Rôle non trouvé"
      });
    }

    // Empêcher la suppression des rôles essentiels
    if (['admin', 'user'].includes(role.name)) {
      return res.status(400).json({
        success: false,
        message: "Les rôles essentiels ne peuvent pas être supprimés"
      });
    }

    // Vérifier si des utilisateurs utilisent ce rôle
    const usersWithRole = await User.countDocuments({ roles: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Ce rôle est utilisé par ${usersWithRole} utilisateur(s) et ne peut pas être supprimé`
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Rôle supprimé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du rôle",
      error: error.message
    });
  }
};

/**
 * Récupération de toutes les permissions (admin)
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await db.permission.find();
    
    const formattedPermissions = permissions.map(perm => {
      return {
        id: perm._id,
        name: perm.name,
        description: perm.description
      };
    });

    res.status(200).json({
      success: true,
      permissions: formattedPermissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des permissions",
      error: error.message
    });
  }
};

/**
 * Récupération des journaux d'accès (admin)
 */
exports.getAccessLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const logs = await db.accessLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email');

    const total = await db.accessLog.countDocuments();

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des journaux d'accès",
      error: error.message
    });
  }
};
