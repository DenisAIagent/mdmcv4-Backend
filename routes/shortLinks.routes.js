// backend/routes/shortLinks.routes.js
const express = require('express');
const {
  createShortLink,
  resolveShortLink,
  getShortLinkStats,
  getAllShortLinks,
  deactivateShortLink,
  activateShortLink
} = require('../controllers/shortLinkController');

// Middleware d'authentification (optionnel selon votre setup)
// const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/:shortCode', resolveShortLink);

// Routes privées (admin) - décommentez protect/authorize selon votre setup
router.post('/', createShortLink); // protect, authorize('admin'), 
router.get('/', getAllShortLinks); // protect, authorize('admin'), 
router.get('/:shortCode/stats', getShortLinkStats); // protect, authorize('admin'), 
router.delete('/:shortCode', deactivateShortLink); // protect, authorize('admin'), 
router.patch('/:shortCode/activate', activateShortLink); // protect, authorize('admin'), 

module.exports = router;