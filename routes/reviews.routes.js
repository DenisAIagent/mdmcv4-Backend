// routes/reviews.routes.js (Middleware Réactivé pour PUT/DELETE)

const express = require("express");

const {
  createReview,
  getReviews,
  updateReviewStatus,
  deleteReview
} = require("../controllers/reviewsController.js"); // Chemin contrôleur OK

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// --- Routes PUBLIQUES ---
// Laisser ces routes accessibles sans authentification/autorisation

router.route("/")
  .post(createReview) // Tout le monde peut poster un avis (il sera 'pending')
  .get(getReviews);   // Tout le monde peut lister les avis (le contrôleur filtre peut-être par statut 'approved' pour les non-admins)

// --- Routes PROTÉGÉES (Admin seulement) ---
// Appliquer le middleware uniquement à ces routes spécifiques

router.route("/:id")
  // Seul un admin connecté peut mettre à jour le statut (approuver/rejeter)
  .put(protect, authorize('admin'), updateReviewStatus)
  // Seul un admin connecté peut supprimer un avis
  .delete(protect, authorize('admin'), deleteReview);

module.exports = router;
