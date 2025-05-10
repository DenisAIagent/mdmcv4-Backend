// routes/artists.js (Corrigé)

const express = require('express');
const {
  createArtist,
  getAllArtists,
  getArtistBySlug,
  updateArtist,
  deleteArtist
} = require('../controllers/ArtistController'); // <<< Assurez-vous que cette ligne est EXACTEMENT comme ça

// Importer les middlewares de protection (si/quand vous les aurez)
// const { protect, authorize } = require('../middleware/auth'); // Exemple

const router = express.Router();

// Définition des routes pour la ressource "artists"

// Route pour la racine ('/') de cette ressource (correspondra à /api/v1/artists)
router.route('/')
  .post(/* protect, authorize('admin'), */ createArtist)
  .get(getAllArtists);

// Route pour les opérations sur un artiste spécifique via son slug ('/:artistSlug')
router.route('/:artistSlug')
  .get(getArtistBySlug)
  .put(/* protect, authorize('admin'), */ updateArtist)
  .delete(/* protect, authorize('admin'), */ deleteArtist);

module.exports = router;
