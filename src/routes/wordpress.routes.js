<<<<<<< HEAD
// routes/wordpress.routes.js (Middleware Réactivé)

const express = require("express");
=======
const express = require('express');
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
const {
  connect,
  disconnect,
  getConnectionStatus,
  updateConnectionSettings,
  syncPosts,
  getPosts,
  getPost,
  deletePost
<<<<<<< HEAD
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
=======
} = require('../controllers/wordpress');

const router = express.Router();

// Importer les middleware de protection et d'autorisation
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// Routes pour la connexion WordPress
router.post('/connect', connect);
router.post('/disconnect', disconnect);
router.get('/status', getConnectionStatus);
router.put('/settings', updateConnectionSettings);
router.post('/sync', syncPosts);

// Routes pour les articles WordPress
router.get('/posts', getPosts);
router.get('/posts/:id', getPost);
router.delete('/posts/:id', deletePost);
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)

module.exports = router;
