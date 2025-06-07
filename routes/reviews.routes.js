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

// Route publique pour obtenir les avis
router.get("/", getReviews);

// Route publique pour créer un avis
router.post("/", createReview);

// Routes protégées pour l'administration
router.route("/:id")
  // Seul un admin connecté peut mettre à jour le statut (approuver/rejeter)
  .put(protect, authorize('admin'), updateReviewStatus)
  // Seul un admin connecté peut supprimer un avis
  .delete(protect, authorize('admin'), deleteReview);

module.exports = router;
