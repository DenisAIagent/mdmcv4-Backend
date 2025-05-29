const express = require('express');
const router = express.Router();
const { authJwt } = require('../middleware');
const smartlinkController = require('../controllers/smartlink.controller');

/**
 * Routes de Smart Links améliorées pour MDMC Music Ads v4
 * Intègre le middleware d'authentification et de gestion des droits
 */

// Routes publiques (accessibles sans authentification)

// Récupérer un Smart Link public par son slug
router.get('/public/:slug', smartlinkController.getPublicSmartLinkBySlug);

// Enregistrer une visite sur un Smart Link
router.post('/public/:slug/visit', smartlinkController.recordVisit);

// Enregistrer un partage de Smart Link
router.post('/public/:slug/share', smartlinkController.recordShare);

// Enregistrer un clic sur une plateforme
router.post('/public/:slug/click', smartlinkController.recordPlatformClick);

// Routes protégées (nécessitent une authentification)

// Récupérer tous les Smart Links (avec pagination et filtres)
router.get('/', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:read']), 
  authJwt.logAccess
], smartlinkController.getAllSmartLinks);

// Créer un nouveau Smart Link
router.post('/', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:write']), 
  authJwt.logAccess
], smartlinkController.createSmartLink);

// Récupérer un Smart Link par son ID
router.get('/:id', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:read']), 
  authJwt.logAccess
], smartlinkController.getSmartLinkById);

// Mettre à jour un Smart Link
router.put('/:id', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:write']), 
  authJwt.logAccess
], smartlinkController.updateSmartLink);

// Supprimer un Smart Link
router.delete('/:id', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:write']), 
  authJwt.logAccess
], smartlinkController.deleteSmartLink);

// Récupérer les statistiques d'un Smart Link
router.get('/:id/stats', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:read', 'analytics:read']), 
  authJwt.logAccess
], smartlinkController.getSmartLinkStats);

// Générer un code QR pour un Smart Link
router.get('/:id/qrcode', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:read']), 
  authJwt.logAccess
], smartlinkController.generateQRCode);

// Ajouter une plateforme à un Smart Link
router.post('/:id/platforms', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:write']), 
  authJwt.logAccess
], smartlinkController.addPlatform);

// Mettre à jour une plateforme d'un Smart Link
router.put('/:id/platforms/:platformId', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:write']), 
  authJwt.logAccess
], smartlinkController.updatePlatform);

// Supprimer une plateforme d'un Smart Link
router.delete('/:id/platforms/:platformId', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:write']), 
  authJwt.logAccess
], smartlinkController.deletePlatform);

// Réordonner les plateformes d'un Smart Link
router.put('/:id/platforms/reorder', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:write']), 
  authJwt.logAccess
], smartlinkController.reorderPlatforms);

// Exporter les statistiques d'un Smart Link (CSV, PDF)
router.get('/:id/export/:format', [
  authJwt.verifyToken, 
  authJwt.isActive, 
  authJwt.hasPermission(['smartlinks:read', 'analytics:read']), 
  authJwt.logAccess
], smartlinkController.exportStats);

module.exports = router;
