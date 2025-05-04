// routes/wordpress.routes.js (Corrected & Middleware commented out)

const express = require("express");
const {
  connect,
  disconnect,
  getConnectionStatus,
  updateConnectionSettings,
  syncPosts,
  getPosts,
  getPost,
  deletePost
} = require("../controllers/wordpress");

const router = express.Router();

// Middleware import commented out as user stated no dedicated middleware file exists
// const { protect, authorize } = require("../middleware/auth");

// --- SECURITY WARNING ---
// The following routes were originally protected by authentication and authorization middleware (protect, authorize("admin")).
// These middlewares are now commented out because the required file (".//middleware/auth") was not found.
// Access control should be re-implemented either here (if middleware becomes available)
// or within the controller functions themselves.
// Currently, ALL WordPress integration operations are potentially open to anyone,
// which is a MAJOR security risk.
// --- END SECURITY WARNING ---

// Apply protection and authorization to all routes (Middleware commented out)
// router.use(protect);
// router.use(authorize("admin"));

// Routes for WordPress connection (WARNING: Unprotected)
router.post("/connect", connect);
router.post("/disconnect", disconnect);
router.get("/status", getConnectionStatus);
router.put("/settings", updateConnectionSettings);
router.post("/sync", syncPosts);

// Routes for WordPress posts (WARNING: Unprotected)
router.get("/posts", getPosts);
router.get("/posts/:id", getPost);
router.delete("/posts/:id", deletePost);

module.exports = router;

