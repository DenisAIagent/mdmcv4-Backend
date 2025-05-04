// routes/landingPage.routes.js (Corrected & Middleware commented out)

const express = require("express");
const {
  getTemplates,
  getTemplate,
  getLandingPages,
  getLandingPage,
  createLandingPage,
  updateLandingPage,
  publishLandingPage,
  unpublishLandingPage,
  deleteLandingPage,
  previewLandingPage
} = require("../controllers/landingPage");

const router = express.Router();

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect, authorize } = require("../middleware/auth");

// --- SECURITY WARNING ---
// The following routes were originally protected by authentication and authorization middleware (protect, authorize("admin")).
// These middlewares are now commented out because the required file (".//middleware/auth") was not found.
// Access control should be re-implemented either here (if middleware becomes available)
// or within the controller functions themselves.
// Currently, ALL landing page and template operations are potentially open to anyone,
// which is a MAJOR security risk.
// --- END SECURITY WARNING ---

// Apply protection and authorization to all routes (Middleware commented out)
// router.use(protect);
// router.use(authorize("admin"));

// Routes for landing page templates (WARNING: Unprotected)
router.get("/templates", getTemplates);
router.get("/templates/:id", getTemplate);

// Routes for landing pages (WARNING: Unprotected)
router.route("/")
  .get(getLandingPages)
  .post(createLandingPage);

router.route("/:id")
  .get(getLandingPage)
  .put(updateLandingPage)
  .delete(deleteLandingPage);

router.post("/:id/publish", publishLandingPage);
router.post("/:id/unpublish", unpublishLandingPage);
router.get("/:id/preview", previewLandingPage);

module.exports = router;

