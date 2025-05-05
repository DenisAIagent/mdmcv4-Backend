// routes/reviews.routes.js (Chemin contrôleur CORRIGÉ, Middleware commenté)

const express = require("express");

// *** LA CORRECTION ESSENTIELLE EST ICI ***
const {
  createReview,
  getReviews,
  updateReviewStatus,
  deleteReview
} = require("../controllers/reviewsController.js"); // <-- Chemin Corrigé pour pointer vers reviewsController.js

// Importation Middleware commentée (cohérent avec les autres fichiers)
// const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Routes pour la racine ('/') :
router.route("/")
  .post(createReview) // Point de terminaison public pour créer un avis
  .get(getReviews);   // Point de terminaison public pour obtenir les avis (filtrage possible dans le contrôleur)

// --- ALERTE SÉCURITÉ ---
// Les routes suivantes pour des ID d'avis spécifiques ne sont PAS protégées par middleware d'authentification ou d'autorisation.
// Le contrôle d'accès devrait être implémenté soit ici (si le middleware devient disponible)
// soit dans les fonctions du contrôleur elles-mêmes.
// Actuellement, les opérations PUT et DELETE sont potentiellement ouvertes à tous.
// --- FIN ALERTE SÉCURITÉ ---

// Routes pour opérations sur un avis spécifique via son ID ('/:id') :
router.route("/:id")
  // .put(protect, authorize('admin'), updateReviewStatus) // Middleware commenté
  .put(updateReviewStatus) // ATTENTION: Non protégé - Permet à quiconque de changer le statut d'un avis
  // .delete(protect, authorize('admin'), deleteReview); // Middleware commenté
  .delete(deleteReview); // ATTENTION: Non protégé - Permet à quiconque de supprimer des avis

module.exports = router;
