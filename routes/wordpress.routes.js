// routes/wordpress.routes.js (Middleware Réactivé avec route publique)

const express = require("express");
const {
  connect,
  disconnect,
  getConnectionStatus,
  updateConnectionSettings,
  syncPosts,
  getPosts,
  getPost,
  deletePost,
  getLatestPosts
} = require("../controllers/wordpress.js"); // Chemin correct vers wordpress.js

const router = express.Router();

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

// Routes publiques pour les articles de blog
router.get("/posts", getLatestPosts);       // GET /api/v1/wordpress/posts (public)
router.get("/posts/all", getPosts);         // GET /api/v1/wordpress/posts/all (public)

// Application de la protection et autorisation pour les routes admin
router.use(protect);
router.use(authorize("admin"));

// Routes for WordPress connection (PROTÉGÉES)
router.post("/connect", connect);           // POST /api/v1/wordpress/connect
router.post("/disconnect", disconnect);     // POST /api/v1/wordpress/disconnect
router.get("/status", getConnectionStatus); // GET /api/v1/wordpress/status
router.put("/settings", updateConnectionSettings); // PUT /api/v1/wordpress/settings
router.post("/sync", syncPosts);            // POST /api/v1/wordpress/sync

// Routes for WordPress posts (PROTÉGÉES)
router.get("/posts/:id", getPost);          // GET /api/v1/wordpress/posts/:id
router.delete("/posts/:id", deletePost);    // DELETE /api/v1/wordpress/posts/:id

module.exports = router;

