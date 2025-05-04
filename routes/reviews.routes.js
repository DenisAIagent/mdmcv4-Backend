// routes/reviews.routes.js (Corrected & Middleware commented out)

const express = require("express");
const {
  createReview,
  getReviews,
  updateReviewStatus,
  deleteReview
} = require("../controllers/reviews"); // Path seems correct assuming standard structure

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Routes for the root ('/') :
router.route("/")
  .post(createReview) // Public endpoint to create a review
  .get(getReviews);    // Public endpoint to get reviews (filtering logic might be in controller)

// --- SECURITY WARNING ---
// The following routes for specific review IDs are NOT protected by authentication or authorization middleware.
// Access control should be implemented either here (if middleware becomes available)
// or within the controller functions themselves.
// Currently, PUT and DELETE operations are potentially open to anyone.
// --- END SECURITY WARNING ---

// Routes for operations on a specific review via its ID ('/:id') :
router.route("/:id")
  // .put(protect, authorize('admin'), updateReviewStatus) // Middleware commented out
  .put(updateReviewStatus) // WARNING: Unprotected - Allows anyone to change review status
  // .delete(protect, authorize('admin'), deleteReview); // Middleware commented out
  .delete(deleteReview); // WARNING: Unprotected - Allows anyone to delete reviews

module.exports = router;

