const WordPressConnection = require('../models/WordPressConnection');
const WordPressPost = require('../models/WordPressPost');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require("../middleware/asyncHandler");
const crypto = require('crypto');

// @desc    Connecter à un site WordPress
// @route   POST /api/wordpress/connect
// @access  Private/Admin
exports.connect = asyncHandler(async (req, res, next) => {
  const { siteUrl, username, applicationPassword, categories, syncFrequency } = req.body;

  // Vérifier si une connexion existe déjà
  let connection = await WordPressConnection.findOne();
  
  if (connection) {
    // Mettre à jour la connexion existante
    connection = await WordPressConnection.findByIdAndUpdate(
      connection._id,
      {
        siteUrl,
        username,
        applicationPassword,
        categories: categories || [],
        syncFrequency: syncFrequency || 'manual',
        status: 'connected',
        updatedAt: Date.now()
      },
      {
        new: true,
        runValidators: true
      }
    );
  } else {
    // Créer une nouvelle connexion
    connection = await WordPressConnection.create({
      siteUrl,
      username,
      applicationPassword,
      categories: categories || [],
      syncFrequency: syncFrequency || 'manual',
      status: 'connected'
    });
  }

  // Ne pas renvoyer le mot de passe dans la réponse
  connection.applicationPassword = undefined;

  res.status(200).json({
    success: true,
    data: connection
  });
});

// @desc    Déconnecter du site WordPress
// @route   POST /api/wordpress/disconnect
// @access  Private/Admin
exports.disconnect = asyncHandler(async (req, res, next) => {
  const connection = await WordPressConnection.findOne();
  
  if (!connection) {
    return next(
      new ErrorResponse('Aucune connexion WordPress trouvée', 404)
    );
  }

  connection.status = 'disconnected';
  connection.updatedAt = Date.now();
  await connection.save();

  res.status(200).json({
    success: true,
    data: connection
  });
});

// @desc    Obtenir le statut de la connexion WordPress
// @route   GET /api/wordpress/status
// @access  Private/Admin
exports.getConnectionStatus = asyncHandler(async (req, res, next) => {
  const connection = await WordPressConnection.findOne().select('-applicationPassword');
  
  if (!connection) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'disconnected',
        message: 'Aucune connexion WordPress configurée'
      }
    });
  }

  res.status(200).json({
    success: true,
    data: connection
  });
});

// @desc    Mettre à jour les paramètres de connexion WordPress
// @route   PUT /api/wordpress/settings
// @access  Private/Admin
exports.updateConnectionSettings = asyncHandler(async (req, res, next) => {
  const { categories, syncFrequency } = req.body;
  
  const connection = await WordPressConnection.findOne();
  
  if (!connection) {
    return next(
      new ErrorResponse('Aucune connexion WordPress trouvée', 404)
    );
  }

  connection.categories = categories || connection.categories;
  connection.syncFrequency = syncFrequency || connection.syncFrequency;
  connection.updatedAt = Date.now();
  await connection.save();

  res.status(200).json({
    success: true,
    data: connection
  });
});

// @desc    Synchroniser les articles WordPress
// @route   POST /api/wordpress/sync
// @access  Private/Admin
exports.syncPosts = asyncHandler(async (req, res, next) => {
  const connection = await WordPressConnection.findOne().select('+applicationPassword');
  
  if (!connection) {
    return next(
      new ErrorResponse('Aucune connexion WordPress trouvée', 404)
    );
  }

  if (connection.status !== 'connected') {
    return next(
      new ErrorResponse('La connexion WordPress est inactive', 400)
    );
  }

  // Dans une implémentation réelle, nous ferions un appel à l'API WordPress ici
  // Pour cette démonstration, nous simulons la synchronisation
  
  // Simuler la récupération des articles WordPress
  const mockPosts = [
    {
      wpId: 1,
      title: 'Comment promouvoir votre musique en 2025',
      content: 'Contenu détaillé sur la promotion musicale...',
      excerpt: 'Découvrez les meilleures stratégies pour promouvoir votre musique en 2025',
      slug: 'promouvoir-musique-2025',
      featuredImage: 'https://example.com/images/promotion-musicale.jpg',
      categories: ['Marketing', 'Promotion'],
      tags: ['musique', 'promotion', '2025'],
      status: 'publish',
      publishedDate: new Date()
    },
    {
      wpId: 2,
      title: 'Les tendances du marketing musical pour 2025',
      content: 'Analyse des tendances marketing dans l\'industrie musicale...',
      excerpt: 'Quelles sont les tendances marketing à suivre dans l\'industrie musicale en 2025',
      slug: 'tendances-marketing-musical-2025',
      featuredImage: 'https://example.com/images/tendances-marketing.jpg',
      categories: ['Marketing', 'Tendances'],
      tags: ['musique', 'marketing', 'tendances'],
      status: 'publish',
      publishedDate: new Date()
    }
  ];

  // Enregistrer ou mettre à jour les articles dans la base de données
  for (const post of mockPosts) {
    await WordPressPost.findOneAndUpdate(
      { wpId: post.wpId },
      {
        ...post,
        syncedAt: Date.now()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  // Mettre à jour la date de dernière synchronisation
  connection.lastSync = Date.now();
  await connection.save();

  res.status(200).json({
    success: true,
    message: 'Synchronisation réussie',
    count: mockPosts.length,
    lastSync: connection.lastSync
  });
});

// @desc    Obtenir tous les articles WordPress
// @route   GET /api/wordpress/posts
// @access  Private/Admin
exports.getPosts = asyncHandler(async (req, res, next) => {
  const posts = await WordPressPost.find().sort('-publishedDate');
  
  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts
  });
});

// @desc    Obtenir un article WordPress spécifique
// @route   GET /api/wordpress/posts/:id
// @access  Private/Admin
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await WordPressPost.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Article non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Supprimer un article WordPress
// @route   DELETE /api/wordpress/posts/:id
// @access  Private/Admin
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await WordPressPost.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Article non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  await post.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
