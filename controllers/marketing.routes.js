// routes/marketing.routes.js (Updated with Security & Validation)

const express = require("express");
const {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
} = require("../controllers/marketing");

// Assuming middleware/auth.js exists and exports protect, authorize
const { protect, authorize } = require("../middleware/auth");

const { body, param, validationResult } = require("express-validator");

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

// Validation rules for creating/updating a marketing integration
// Adjust required fields and validation based on the actual MarketingIntegration model
const integrationValidationRules = [
  body("platform", "La plateforme est requise (ex: Meta, TikTok, Google)").not().isEmpty().trim(),
  body("apiKey", "La clé API ou l\'ID est requis").not().isEmpty().trim(),
  body("description", "Description invalide").optional().trim()
  // Add other fields as necessary (e.g., accountId, specific settings)
];

// Apply protection and authorization to all routes in this file
router.use(protect);
router.use(authorize("admin"));

// Routes for marketing integrations (Now Protected)
router.route("/")
  .get(getIntegrations) // Get all integrations
  .post(
    integrationValidationRules,
    handleValidationErrors,
    createIntegration // Create a new integration
  );

router.route("/:id")
  .get(
    param("id", "ID d\'intégration invalide dans l\'URL").isMongoId(),
    handleValidationErrors,
    getIntegration // Get a specific integration
  )
  .put(
    param("id", "ID d\'intégration invalide dans l\'URL").isMongoId(),
    integrationValidationRules, // Use the same rules for update, adjust if needed
    handleValidationErrors,
    updateIntegration // Update an integration
  )
  .delete(
    param("id", "ID d\'intégration invalide dans l\'URL").isMongoId(),
    handleValidationErrors,
    deleteIntegration // Delete an integration
  );

// Route to test an integration
router.route("/:id/test")
  .post(
    param("id", "ID d\'intégration invalide dans l\'URL").isMongoId(),
    handleValidationErrors,
    testIntegration // Test a specific integration
  );

module.exports = router;

