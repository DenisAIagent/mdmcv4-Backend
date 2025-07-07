// backend/routes/analytics.js
const express = require('express');
const router = express.Router();

const {
  trackClick,
  getSmartLinkAnalytics,
  getArtistAnalytics,
  getGlobalAnalytics,
  getDashboardStats,
  trackingPixel
} = require('../controllers/analyticsController');

// Routes publiques pour le tracking
router.post('/click', trackClick);
router.get('/pixel.gif', trackingPixel);

// Routes protégées pour les analytics (admin)
// TODO: Ajouter middleware d'authentification protect
router.get('/dashboard', getDashboardStats);
router.get('/smartlink/:id', getSmartLinkAnalytics);
router.get('/artist/:id', getArtistAnalytics);
router.get('/global', getGlobalAnalytics);

module.exports = router;