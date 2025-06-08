// routes/wordpress.routes.js - Fix import/export
const express = require('express');
const router = express.Router();

// Import correct du controller
const { getLatestPosts } = require('../controllers/wordpress');

// Route publique pour récupérer les articles
router.get('/posts', getLatestPosts);

// Test route pour vérifier que le serveur fonctionne
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'WordPress routes fonctionnent correctement',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
