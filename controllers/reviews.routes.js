// ----- Début du code pour routes/reviews.routes.js -----

const express = require('express');
const {
  createReview,
  getReviews,
  updateReviewStatus
} = require('../controllers/reviews'); // Importe les fonctions du contrôleur (vérifie le chemin)

// Crée une instance du routeur Express
const router = express.Router();

// Définit les routes relatives au chemin de base (qui sera /api/v1/reviews ou similaire)

// Routes pour la racine ('/') :
router.route('/')
  .post(createReview)   // Lorsqu'une requête POST arrive, exécute createReview
  .get(getReviews);    // Lorsqu'une requête GET arrive, exécute getReviews

// Route pour les opérations sur un avis spécifique via son ID ('/:id') :
router.route('/:id')
  .put(updateReviewStatus); // Lorsqu'une requête PUT arrive, exécute updateReviewStatus
  // On pourrait ajouter ici .get(getSingleReview) ou .delete(deleteReview) plus tard

// Exporte le routeur pour qu'il puisse être utilisé dans le fichier principal du serveur
module.exports = router;

// ----- Fin du code pour routes/reviews.routes.js -----
