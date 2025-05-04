// routes/chatbot.routes.js (Corrected & Middleware commented out)

const express = require("express");
const {
  getConfig,
  updateConfig,
  sendMessage,
  getDocumentation
} = require("../controllers/chatbot");

const router = express.Router();

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect, authorize } = require("../middleware/auth");

// --- SECURITY WARNING ---
// The following routes were originally protected by authentication and authorization middleware (protect, authorize("admin")).
// These middlewares are now commented out because the required file (".//middleware/auth") was not found.
// Access control should be re-implemented either here (if middleware becomes available)
// or within the controller functions themselves.
// Currently, ALL chatbot operations are potentially open to anyone,
// which is a MAJOR security risk.
// --- END SECURITY WARNING ---

// Apply protection and authorization to all routes (Middleware commented out)
// router.use(protect);
// router.use(authorize("admin"));

// Routes for the chatbot (WARNING: Unprotected)
router.route("/config")
  .get(getConfig)
  .put(updateConfig);

router.post("/message", sendMessage);
router.get("/documentation", getDocumentation);

module.exports = router;

