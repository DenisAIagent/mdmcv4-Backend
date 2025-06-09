// routes/wordpress.routes.js - Fix import/export avec logs détaillés
const express = require('express');
const router = express.Router();

// Système de logs pour les routes
const logger = {
  info: (msg, data = {}) => console.log(`✅ [${new Date().toISOString()}] WP-ROUTES: ${msg}`, data),
  error: (msg, error = {}) => console.error(`❌ [${new Date().toISOString()}] WP-ROUTES: ${msg}`, error),
  debug: (msg, data = {}) => console.log(`🔍 [${new Date().toISOString()}] WP-ROUTES: ${msg}`, data),
  request: (path, method, origin) => console.log(`📡 [${new Date().toISOString()}] WP-ROUTES: ${method} ${path} depuis ${origin || 'unknown'}`)
};

// Import correct du controller avec gestion d'erreur
let wordpressController;
try {
  wordpressController = require('../controllers/wordpress');
  logger.info('✅ Controller WordPress importé avec succès');
} catch (error) {
  logger.error('❌ Erreur import controller WordPress:', error.message);
  throw error;
}

const { getLatestPosts } = wordpressController;

// Middleware de logging pour toutes les routes WordPress
router.use((req, res, next) => {
  logger.request(req.path, req.method, req.headers.origin);
  logger.debug('Query params:', req.query);
  logger.debug('Headers clés:', {
    userAgent: req.headers['user-agent']?.substring(0, 50),
    accept: req.headers.accept,
    referer: req.headers.referer
  });
  next();
});

// Route publique pour récupérer les articles avec logs
router.get('/posts', async (req, res, next) => {
  logger.info('🎯 Route /posts appelée');
  try {
    await getLatestPosts(req, res);
    logger.info('✅ Route /posts traitée avec succès');
  } catch (error) {
    logger.error('💥 Erreur dans route /posts:', error.message);
    next(error);
  }
});

// Test route pour vérifier que le serveur fonctionne avec logs détaillés
router.get('/test', (req, res) => {
  logger.info('🧪 Route test appelée');
  
  const testResponse = {
    success: true,
    message: 'WordPress routes fonctionnent correctement',
    timestamp: new Date().toISOString(),
    routes: {
      posts: '/api/wordpress/posts',
      test: '/api/wordpress/test'
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      node: process.version
    },
    request: {
      method: req.method,
      path: req.path,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 100)
    }
  };
  
  logger.info('📤 Envoi réponse test:', {
    routes: Object.keys(testResponse.routes),
    uptime: testResponse.server.uptime
  });
  
  res.json(testResponse);
});

// Middleware d'erreur spécifique aux routes WordPress
router.use((error, req, res, next) => {
  logger.error('💥 Erreur interceptée dans routes WordPress:', {
    message: error.message,
    stack: error.stack?.split('\n')[0],
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Erreur dans les routes WordPress',
    error: error.message,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

logger.info('📋 Routes WordPress configurées:', {
  routes: ['GET /posts', 'GET /test'],
  middleware: ['logging', 'error-handler']
});

module.exports = router;
