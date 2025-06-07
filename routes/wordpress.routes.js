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
  deletePost
} = require("../controllers/wordpress.js"); // Chemin correct vers wordpress.js

const router = express.Router();

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

// Route publique pour les articles de blog
// Cette route doit être définie AVANT l'application du middleware de protection
router.get("/posts", getPosts);             // GET /api/wordpress/posts (public)

// Application de la protection et autorisation pour les routes admin
router.use(protect);
router.use(authorize("admin"));

// Routes for WordPress connection (PROTÉGÉES)
router.post("/connect", connect);           // POST /api/wordpress/connect
router.post("/disconnect", disconnect);       // POST /api/wordpress/disconnect
router.get("/status", getConnectionStatus);     // GET /api/wordpress/status
router.put("/settings", updateConnectionSettings); // PUT /api/wordpress/settings
router.post("/sync", syncPosts);            // POST /api/wordpress/sync

// Routes for WordPress posts (PROTÉGÉES)
router.get("/posts/:id", getPost);          // GET /api/wordpress/posts/:id
router.delete("/posts/:id", deletePost);      // DELETE /api/wordpress/posts/:id

module.exports = router;

