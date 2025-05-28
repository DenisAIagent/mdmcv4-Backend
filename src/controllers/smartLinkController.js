const SmartLink = require('../models/SmartLink');
const odesliService = require('../services/odesliService');
const logger = require('../utils/logger');

/**
 * @desc    Récupérer tous les SmartLinks
 * @route   GET /api/v1/smartlinks
 * @access  Privé
 */
exports.getSmartLinks = async (req, res, next) => {
  try {
    // Filtrer par utilisateur si pas admin
    const filter = req.user.role === 'admin' ? {} : { user: req.user.id };
    
    const smartLinks = await SmartLink.find(filter);
    
    res.status(200).json({
      success: true,
      count: smartLinks.length,
      data: smartLinks
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des SmartLinks: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Récupérer un SmartLink par ID ou slug
 * @route   GET /api/v1/smartlinks/:id
 * @route   GET /api/v1/smartlinks/public/:slug
 * @access  Privé/Public
 */
exports.getSmartLink = async (req, res, next) => {
  try {
    const query = req.params.id ? { _id: req.params.id } : { slug: req.params.slug };
    
    const smartLink = await SmartLink.findOne(query);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    // Si route publique, incrémenter les vues
    if (req.originalUrl.includes('/public/')) {
      smartLink.views += 1;
      await smartLink.save();
    }
    
    res.status(200).json({
      success: true,
      data: smartLink
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération du SmartLink: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Créer un SmartLink
 * @route   POST /api/v1/smartlinks
 * @access  Privé
 */
exports.createSmartLink = async (req, res, next) => {
  try {
    // Ajouter l'utilisateur au body
    req.body.user = req.user.id;
    
    const smartLink = await SmartLink.create(req.body);
    
    res.status(201).json({
      success: true,
      data: smartLink
    });
  } catch (error) {
    logger.error(`Erreur lors de la création du SmartLink: ${error.message}`);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Mettre à jour un SmartLink
 * @route   PUT /api/v1/smartlinks/:id
 * @access  Privé
 */
exports.updateSmartLink = async (req, res, next) => {
  try {
    let smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    smartLink = await SmartLink.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: smartLink
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du SmartLink: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Supprimer un SmartLink
 * @route   DELETE /api/v1/smartlinks/:id
 * @access  Privé
 */
exports.deleteSmartLink = async (req, res, next) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    await smartLink.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    logger.error(`Erreur lors de la suppression du SmartLink: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Détecter les liens à partir d'une URL
 * @route   POST /api/v1/smartlinks/detect
 * @access  Privé
 */
exports.detectLinks = async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Veuillez fournir une URL'
      });
    }
    
    const result = await odesliService.detectLinks(url);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Erreur lors de la détection des liens: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la détection des liens'
    });
  }
};

/**
 * @desc    Publier un SmartLink
 * @route   PUT /api/v1/smartlinks/:id/publish
 * @access  Privé
 */
exports.publishSmartLink = async (req, res, next) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    smartLink.isPublished = true;
    smartLink.publishedAt = Date.now();
    
    await smartLink.save();
    
    res.status(200).json({
      success: true,
      data: smartLink
    });
  } catch (error) {
    logger.error(`Erreur lors de la publication du SmartLink: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Récupérer les analytics d'un SmartLink
 * @route   GET /api/v1/smartlinks/:id/analytics
 * @access  Privé
 */
exports.getSmartLinkAnalytics = async (req, res, next) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    // Ici, on pourrait récupérer des analytics plus détaillées depuis une autre collection
    // Pour l'instant, on renvoie juste les vues et les clics
    const analytics = {
      views: smartLink.views,
      clicks: smartLink.clicks,
      platforms: smartLink.platformClicks || {},
      publishedAt: smartLink.publishedAt,
      lastUpdated: smartLink.updatedAt
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des analytics: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};
