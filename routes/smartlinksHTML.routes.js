// routes/smartlinksHTML.routes.js
// Routes API REST pour l'architecture HTML simplifiée

const express = require('express');
const router = express.Router();
const SmartLinkHTML = require('../models/SmartLinkHTML');
const { body, param, validationResult } = require('express-validator');

// 🛡️ Middleware de validation des erreurs
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array()
    });
  }
  next();
};

// 📋 GET /api/smartlinks - Liste tous les smartlinks (avec pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const filter = { isPublished: true };
    
    // Recherche par artiste ou titre
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { artist: searchRegex },
        { title: searchRegex }
      ];
    }
    
    const [smartlinks, total] = await Promise.all([
      SmartLinkHTML.find(filter)
        .select('slug artistSlug trackSlug artist title imageUrl viewCount clickCount createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SmartLinkHTML.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        smartlinks,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur liste smartlinks:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// 🔍 GET /api/smartlinks/:slug - Récupère un smartlink par slug
router.get('/:slug(*)', 
  param('slug').notEmpty().withMessage('Slug requis'),
  handleValidationErrors,
  async (req, res) => {
    try {
      let { slug } = req.params;
      
      // Nettoyer le slug (enlever slashes multiples)
      slug = slug.replace(/\/+/g, '/');
      
      console.log(`🔍 Recherche SmartLink: "${slug}"`);
      
      const smartlink = await SmartLinkHTML.findOne({ 
        slug: slug,
        isPublished: true 
      }).lean();
      
      if (!smartlink) {
        return res.status(404).json({
          success: false,
          message: 'SmartLink non trouvé',
          slug: slug
        });
      }
      
      // Incrémenter le compteur de vues (async, non bloquant)
      SmartLinkHTML.findByIdAndUpdate(smartlink._id, 
        { $inc: { viewCount: 1 } }
      ).catch(err => console.warn('⚠️ Erreur incrémentation vue:', err.message));
      
      res.json({
        success: true,
        data: smartlink
      });
      
    } catch (error) {
      console.error('❌ Erreur récupération smartlink:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      });
    }
  }
);

// ✅ POST /api/smartlinks - Crée un nouveau smartlink
router.post('/',
  [
    body('artist').notEmpty().withMessage('Nom d\'artiste requis').trim(),
    body('title').notEmpty().withMessage('Titre requis').trim(),
    body('imageUrl').isURL().withMessage('URL d\'image valide requise'),
    body('spotifyUrl').optional().isURL().withMessage('URL Spotify invalide'),
    body('appleUrl').optional().isURL().withMessage('URL Apple Music invalide'),
    body('youtubeUrl').optional().isURL().withMessage('URL YouTube invalide'),
    body('deezerUrl').optional().isURL().withMessage('URL Deezer invalide'),
    body('amazonUrl').optional().isURL().withMessage('URL Amazon Music invalide'),
    body('tidalUrl').optional().isURL().withMessage('URL Tidal invalide'),
    body('soundcloudUrl').optional().isURL().withMessage('URL SoundCloud invalide'),
    body('bandcampUrl').optional().isURL().withMessage('URL Bandcamp invalide'),
    body('description').optional().trim(),
    body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Couleur hex invalide'),
    body('template').optional().isIn(['default', 'minimal', 'dark', 'gradient'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const smartlinkData = req.body;
      
      // Vérifier qu'au moins une plateforme est fournie
      const platformUrls = [
        smartlinkData.spotifyUrl,
        smartlinkData.appleUrl,
        smartlinkData.youtubeUrl,
        smartlinkData.deezerUrl,
        smartlinkData.amazonUrl,
        smartlinkData.tidalUrl,
        smartlinkData.soundcloudUrl,
        smartlinkData.bandcampUrl
      ].filter(Boolean);
      
      if (platformUrls.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Au moins une URL de plateforme est requise'
        });
      }
      
      // Ajouter l'ID du créateur (à remplacer par l'auth)
      smartlinkData.createdBy = req.user?.id || new require('mongoose').Types.ObjectId();
      
      const smartlink = new SmartLinkHTML(smartlinkData);
      await smartlink.save();
      
      console.log(`✅ SmartLink créé: ${smartlink.slug}`);
      
      res.status(201).json({
        success: true,
        message: 'SmartLink créé avec succès',
        data: smartlink
      });
      
    } catch (error) {
      console.error('❌ Erreur création smartlink:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Un SmartLink avec ce slug existe déjà',
          error: 'Slug duplicate'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      });
    }
  }
);

// 🔄 PUT /api/smartlinks/:slug - Met à jour un smartlink
router.put('/:slug(*)',
  [
    param('slug').notEmpty().withMessage('Slug requis'),
    body('artist').optional().notEmpty().withMessage('Nom d\'artiste invalide').trim(),
    body('title').optional().notEmpty().withMessage('Titre invalide').trim(),
    body('imageUrl').optional().isURL().withMessage('URL d\'image invalide'),
    body('spotifyUrl').optional().isURL().withMessage('URL Spotify invalide'),
    body('appleUrl').optional().isURL().withMessage('URL Apple Music invalide'),
    body('youtubeUrl').optional().isURL().withMessage('URL YouTube invalide'),
    body('deezerUrl').optional().isURL().withMessage('URL Deezer invalide'),
    body('amazonUrl').optional().isURL().withMessage('URL Amazon Music invalide'),
    body('tidalUrl').optional().isURL().withMessage('URL Tidal invalide'),
    body('soundcloudUrl').optional().isURL().withMessage('URL SoundCloud invalide'),
    body('bandcampUrl').optional().isURL().withMessage('URL Bandcamp invalide'),
    body('description').optional().trim(),
    body('isPublished').optional().isBoolean(),
    body('primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Couleur hex invalide'),
    body('template').optional().isIn(['default', 'minimal', 'dark', 'gradient'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      let { slug } = req.params;
      slug = slug.replace(/\/+/g, '/');
      
      const updateData = req.body;
      
      // Si on modifie artist ou title, on doit recalculer les slugs
      if (updateData.artist || updateData.title) {
        const currentSmartlink = await SmartLinkHTML.findOne({ slug });
        if (!currentSmartlink) {
          return res.status(404).json({
            success: false,
            message: 'SmartLink non trouvé'
          });
        }
        
        // Forcer le recalcul des slugs en marquant les champs comme modifiés
        const updatedSmartlink = await SmartLinkHTML.findOneAndUpdate(
          { slug },
          updateData,
          { new: true, runValidators: true }
        );
        
        // Sauvegarder à nouveau pour déclencher le middleware pre-save
        await updatedSmartlink.save();
        
        console.log(`🔄 SmartLink mis à jour: ${slug} → ${updatedSmartlink.slug}`);
        
        return res.json({
          success: true,
          message: 'SmartLink mis à jour avec succès',
          data: updatedSmartlink
        });
      }
      
      const smartlink = await SmartLinkHTML.findOneAndUpdate(
        { slug },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!smartlink) {
        return res.status(404).json({
          success: false,
          message: 'SmartLink non trouvé'
        });
      }
      
      console.log(`🔄 SmartLink mis à jour: ${slug}`);
      
      res.json({
        success: true,
        message: 'SmartLink mis à jour avec succès',
        data: smartlink
      });
      
    } catch (error) {
      console.error('❌ Erreur mise à jour smartlink:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      });
    }
  }
);

// 🗑️ DELETE /api/smartlinks/:slug - Supprime un smartlink
router.delete('/:slug(*)',
  param('slug').notEmpty().withMessage('Slug requis'),
  handleValidationErrors,
  async (req, res) => {
    try {
      let { slug } = req.params;
      slug = slug.replace(/\/+/g, '/');
      
      const smartlink = await SmartLinkHTML.findOneAndDelete({ slug });
      
      if (!smartlink) {
        return res.status(404).json({
          success: false,
          message: 'SmartLink non trouvé'
        });
      }
      
      console.log(`🗑️ SmartLink supprimé: ${slug}`);
      
      res.json({
        success: true,
        message: 'SmartLink supprimé avec succès',
        data: { slug }
      });
      
    } catch (error) {
      console.error('❌ Erreur suppression smartlink:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      });
    }
  }
);

// 📊 POST /api/smartlinks/:slug/click - Enregistre un clic sur une plateforme
router.post('/:slug(*)/click',
  [
    param('slug').notEmpty().withMessage('Slug requis'),
    body('platform').optional().isIn(['spotify', 'apple', 'youtube', 'deezer', 'amazon', 'tidal', 'soundcloud', 'bandcamp'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      let { slug } = req.params;
      const { platform } = req.body;
      
      slug = slug.replace(/\/+/g, '/');
      
      const updateQuery = { $inc: { clickCount: 1 } };
      if (platform) {
        updateQuery.$inc[`platformClicks.${platform}`] = 1;
      }
      
      const smartlink = await SmartLinkHTML.findOneAndUpdate(
        { slug, isPublished: true },
        updateQuery,
        { new: true }
      );
      
      if (!smartlink) {
        return res.status(404).json({
          success: false,
          message: 'SmartLink non trouvé'
        });
      }
      
      res.json({
        success: true,
        message: 'Clic enregistré',
        data: {
          clickCount: smartlink.clickCount,
          platformClicks: smartlink.platformClicks
        }
      });
      
    } catch (error) {
      console.error('❌ Erreur enregistrement clic:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
        error: error.message
      });
    }
  }
);

module.exports = router;