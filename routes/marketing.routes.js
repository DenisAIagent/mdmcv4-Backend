// routes/marketing.routes.js (Corrected & Middleware commented out)

const express = require("express");
const {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
} = require("../controllers/marketing");

const router = express.Router();

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect, authorize } = require("../middleware/auth");

// --- SECURITY WARNING ---
// The following routes were originally protected by authentication and authorization middleware (protect, authorize("admin")).
// These middlewares are now commented out because the required file (".//middleware/auth") was not found.
// Access control should be re-implemented either here (if middleware becomes available)
// or within the controller functions themselves.
// Currently, ALL marketing integration operations are potentially open to anyone,
// which is a MAJOR security risk.
// --- END SECURITY WARNING ---

// Apply protection and authorization to all routes (Middleware commented out)
// router.use(protect);
// router.use(authorize("admin"));

// Routes for marketing integrations (WARNING: Unprotected)
router.route("/")
  .get(getIntegrations)
  .post(createIntegration);

router.route("/:id")
  .get(getIntegration)
  .put(updateIntegration)
  .delete(deleteIntegration);

router.route("/:id/test")
  .post(testIntegration);

module.exports = router;

