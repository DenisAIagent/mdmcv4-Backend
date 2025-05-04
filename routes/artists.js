// routes/artists.js (Corrected & Middleware commented out)

const express = require('express');
const {
  createArtist,
  getAllArtists,
  getArtistBySlug,
  updateArtist,
  deleteArtist
} = require('../controllers/ArtistController'); // Path seems correct assuming standard structure

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// --- SECURITY WARNING ---
// The following routes are NOT protected by authentication or authorization middleware.
// Access control should be implemented either here (if middleware becomes available)
// or within the controller functions themselves if fine-grained control is needed per operation.
// Currently, POST, PUT, DELETE operations are potentially open to anyone.
// --- END SECURITY WARNING ---

// Route for the root ('/') of this resource (will map to /api/v1/artists)
router.route('/')
  // .post(protect, authorize('admin'), createArtist) // Middleware commented out
  .post(createArtist) // WARNING: Unprotected
  .get(getAllArtists);

// Route for operations on a specific artist via their slug ('/:artistSlug')
router.route('/:artistSlug')
  .get(getArtistBySlug)
  // .put(protect, authorize('admin'), updateArtist) // Middleware commented out
  .put(updateArtist) // WARNING: Unprotected
  // .delete(protect, authorize('admin'), deleteArtist); // Middleware commented out
  .delete(deleteArtist); // WARNING: Unprotected

module.exports = router;

