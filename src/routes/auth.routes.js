const express = require('express');
const router = express.Router();
const { authJwt } = require('../middleware');
const authController = require('../controllers/auth.controller');

/**
 * Routes d'authentification améliorées pour MDMC Music Ads v4
 * Intègre le middleware d'authentification et de gestion des droits
 */

// Route d'inscription
router.post('/signup', authController.signup);

// Route de connexion
router.post('/signin', authController.signin);

// Route de déconnexion
router.post('/signout', authController.signout);

// Route de rafraîchissement du token
router.post('/refresh-token', authController.refreshToken);

// Route de vérification du token
router.get('/verify-token', [authJwt.verifyToken], authController.verifyToken);

// Route de récupération du profil utilisateur
router.get('/profile', [authJwt.verifyToken, authJwt.isActive, authJwt.logAccess], authController.getUserProfile);

// Route de mise à jour du profil utilisateur
router.put('/profile', [authJwt.verifyToken, authJwt.isActive, authJwt.logAccess], authController.updateUserProfile);

// Route de changement de mot de passe
router.put('/change-password', [authJwt.verifyToken, authJwt.isActive, authJwt.logAccess], authController.changePassword);

// Route de demande de réinitialisation de mot de passe
router.post('/forgot-password', authController.forgotPassword);

// Route de réinitialisation de mot de passe
router.post('/reset-password', authController.resetPassword);

// Route d'administration des utilisateurs (réservée aux administrateurs)
router.get('/users', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:read']), 
  authJwt.logAccess
], authController.getAllUsers);

// Route de création d'utilisateur (réservée aux administrateurs)
router.post('/users', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:write']), 
  authJwt.logAccess
], authController.createUser);

// Route de mise à jour d'utilisateur (réservée aux administrateurs)
router.put('/users/:id', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:write']), 
  authJwt.logAccess
], authController.updateUser);

// Route de suppression d'utilisateur (réservée aux administrateurs)
router.delete('/users/:id', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:write']), 
  authJwt.logAccess
], authController.deleteUser);

// Route de gestion des rôles (réservée aux administrateurs)
router.get('/roles', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:read']), 
  authJwt.logAccess
], authController.getAllRoles);

// Route de création de rôle (réservée aux administrateurs)
router.post('/roles', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:write']), 
  authJwt.logAccess
], authController.createRole);

// Route de mise à jour de rôle (réservée aux administrateurs)
router.put('/roles/:id', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:write']), 
  authJwt.logAccess
], authController.updateRole);

// Route de suppression de rôle (réservée aux administrateurs)
router.delete('/roles/:id', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:write']), 
  authJwt.logAccess
], authController.deleteRole);

// Route de récupération des permissions (réservée aux administrateurs)
router.get('/permissions', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['users:read']), 
  authJwt.logAccess
], authController.getAllPermissions);

// Route de journalisation des accès (réservée aux administrateurs)
router.get('/access-logs', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.isAdmin, 
  authJwt.logAccess
], authController.getAccessLogs);

module.exports = router;
