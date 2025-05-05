// routes/reviews.routes.js (Updated with Security & Validation)

const express = require("express");
const {
  createReview,
  getReviews,
  updateReviewStatus,
  deleteReview
} = require("../controllers/reviews"); // Path seems correct

// Assuming middleware/auth.js exists and exports protect, authorize
const { protect, authorize } = require("../middleware/auth");

const { body, param, query, validationResult } = require("express-validator");

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

// Validation rules for creating a review (assuming public access)
const createReviewValidationRules = [
  body("name", "Le nom est requis").not().isEmpty().trim(),
  body("rating", "La note est requise et doit être un nombre entre 1 et 5").isInt({ min: 1, max: 5 }),
  body("comment", "Le commentaire est requis").not().isEmpty().trim(),
  // Add other fields as necessary (e.g., email, service used)
];

// Validation rules for getting reviews (query params)
const getReviewsValidationRules = [
    query('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage("Statut invalide"),
    query('page').optional().isInt({ min: 1 }).withMessage("Le paramètre page doit être un entier positif"),
    query('limit').optional().isInt({ min: 1 }).withMessage("Le paramètre limit doit être un entier positif")
];

// Validation rules for updating review status (Admin only)
const updateReviewStatusValidationRules = [
  param("id", "ID d'avis invalide dans l'URL").isMongoId(),
  body("status", "Le statut est requis et doit être 'approved' ou 'rejected'")
    .isIn(["approved", "rejected"])
];

// Routes for the root ('/') :
router.route("/")
  .post(
    createReviewValidationRules,
    handleValidationErrors,
    createReview // Public endpoint to create a review
  )
  .get(
    getReviewsValidationRules,
    handleValidationErrors,
    getReviews // Public endpoint to get reviews (filtering logic might be in controller)
  );

// Routes for operations on a specific review via its ID ('/:id') :
router.route("/:id")
  .put(
    protect,
    authorize("admin"),
    updateReviewStatusValidationRules,
    handleValidationErrors,
    updateReviewStatus // Protected: Allows admin to change review status
  )
  .delete(
    protect,
    authorize("admin"),
    param("id", "ID d'avis invalide dans l'URL").isMongoId(),
    handleValidationErrors,
    deleteReview // Protected: Allows admin to delete reviews
  );

module.exports = router;

