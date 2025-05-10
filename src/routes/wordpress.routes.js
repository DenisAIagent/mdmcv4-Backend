// routes/wordpress.routes.js (Middleware Réactivé)

const express = require('express');
const {
  connect,
  disconnect,
  getConnectionStatus,
  updateConnectionSettings,
  syncPosts,
  getPosts,
  getPost,
  deletePost
} = require('../controllers/wordpressController');

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

module.exports = router;
