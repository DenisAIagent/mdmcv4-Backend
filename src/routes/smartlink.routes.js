const express = require('express');
const router = express.Router();
const { protect, authorize, checkOwnership } = require('../middleware/auth');

// Contrôleur SmartLink (à implémenter)
const {
  getSmartLinks,
  getSmartLink,
  createSmartLink,
  updateSmartLink,
  deleteSmartLink,
  detectLinks,
  publishSmartLink,
  getSmartLinkAnalytics
} = require('../controllers/smartLinkController');

// Routes publiques
router.get('/public/:slug', getSmartLink);

// Routes protégées
router.use(protect); // Toutes les routes ci-dessous nécessitent une authentification

// Routes pour tous les utilisateurs authentifiés
router.get('/', getSmartLinks);
router.post('/', createSmartLink);
router.post('/detect', detectLinks);

// Routes nécessitant la propriété de la ressource
router.get('/:id', checkOwnership('SmartLink'), getSmartLink);
router.put('/:id', checkOwnership('SmartLink'), updateSmartLink);
router.delete('/:id', checkOwnership('SmartLink'), deleteSmartLink);
router.put('/:id/publish', checkOwnership('SmartLink'), publishSmartLink);
router.get('/:id/analytics', checkOwnership('SmartLink'), getSmartLinkAnalytics);

// Routes admin uniquement
router.get('/all', authorize('admin'), getSmartLinks);

module.exports = router;
