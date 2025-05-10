// ----- Code COMPLET et SÉCURISÉ pour routes/reviews.routes.js -----

const express = require('express');
const {
  createReview,
  getReviews,
  updateReviewStatus,
  deleteReview
} = require('../controllers/reviewsController');

// Importation des middlewares d'authentification et d'autorisation
const { protect, authorize } = require('../middleware/auth');

// Crée une instance du routeur Express
const router = express.Router();

// Routes pour la racine ('/') :
router.route('/')
  .post(createReview) // POST /api/reviews (Public pour créer un avis)
  .get(getReviews);    // GET /api/reviews (Public pour lire les avis, potentiellement filtrés par statut)

// Routes pour les opérations sur un avis spécifique via son ID ('/:id') :
router.route('/:id')
  .put(protect, authorize('admin'), updateReviewStatus) // PUT /api/reviews/:id (Admin seulement)
  .delete(protect, authorize('admin'), deleteReview); // DELETE /api/reviews/:id (Admin seulement)

// Exporte le routeur pour qu'il puisse être utilisé dans votre fichier principal
module.exports = router;

// ----- Fin du code COMPLET et SÉCURISÉ -----
