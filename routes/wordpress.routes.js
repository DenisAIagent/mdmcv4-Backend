// routes/wordpress.routes.js (Middleware Réactivé)

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
} = require("../controllers/wordpress.js"); // Chemin correct vers wordpress.js

const router = express.Router();

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

// Application de la protection et autorisation DÉCOMMENTÉE
// Protège TOUTES les routes définies ci-dessous
router.use(protect);
router.use(authorize("admin"));

// Routes for WordPress connection (MAINTENANT PROTÉGÉES)
router.post("/connect", connect);           // POST /api/wordpress/connect
router.post("/disconnect", disconnect);       // POST /api/wordpress/disconnect
router.get("/status", getConnectionStatus);     // GET /api/wordpress/status
router.put("/settings", updateConnectionSettings); // PUT /api/wordpress/settings
router.post("/sync", syncPosts);            // POST /api/wordpress/sync

// Routes for WordPress posts (MAINTENANT PROTÉGÉES)
router.get("/posts", getPosts);             // GET /api/wordpress/posts
router.get("/posts/:id", getPost);          // GET /api/wordpress/posts/:id
router.delete("/posts/:id", deletePost);      // DELETE /api/wordpress/posts/:id

module.exports = router;
