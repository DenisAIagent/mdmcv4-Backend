// routes/smartLinkRoutes.js

const express = require('express');
const {
  createSmartLink,
  getAllSmartLinks,
  getSmartLinkById,
  updateSmartLinkById,
  deleteSmartLinkById,
  getSmartLinksByArtistSlug,
  getSmartLinkBySlugs
} = require('../controllers/smartLinkController'); // Importer les fonctions du contrôleur

// Importer les middlewares de protection (si/quand vous les aurez)
// const { protect, authorize } = require('../middleware/auth'); // Exemple

const router = express.Router();

// --- Routes Principales CRUD (généralement pour l'admin) ---

// Correspondra à /api/v1/smartlinks
router.route('/')
  .post(/* protect, authorize('admin'), */ createSmartLink)      // Créer un SmartLink
  .get(/* protect, authorize('admin'), */ getAllSmartLinks);       // Lister tous les SmartLinks (avec filtres/pagination)

// Correspondra à /api/v1/smartlinks/:id
router.route('/:id')
  .get(/* protect, authorize('admin'), */ getSmartLinkById)        // Lire un SmartLink par son ID
  .put(/* protect, authorize('admin'), */ updateSmartLinkById)     // Mettre à jour un SmartLink par son ID
  .delete(/* protect, authorize('admin'), */ deleteSmartLinkById); // Supprimer un SmartLink par son ID


// --- Routes spécifiques pour récupérer les données par Slugs (pour frontend/public) ---

// Correspondra à /api/v1/smartlinks/by-artist/:artistSlug
router.route('/by-artist/:artistSlug')
  .get(getSmartLinksByArtistSlug); // Récupérer tous les SmartLinks d'un artiste via son slug

// Correspondra à /api/v1/smartlinks/details/:artistSlug/:trackSlug
router.route('/details/:artistSlug/:trackSlug')
  .get(getSmartLinkBySlugs); // Récupérer les détails d'un SmartLink spécifique via les slugs


module.exports = router; // Exporter le routeur configuré