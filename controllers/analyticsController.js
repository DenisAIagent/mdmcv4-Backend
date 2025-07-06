// backend/controllers/analyticsController.js
const URLTracking = require('../models/URLTracking');
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Enregistrer un clic sur une URL/plateforme
// @route   POST /api/v1/analytics/click
// @access  Public
exports.trackClick = asyncHandler(async (req, res, next) => {
  const {
    url,
    utm_params = {},
    click_data = {},
    platform = null,
    smartlink_id = null,
    artist_id = null,
    position = null,
    orderSource = 'default',
    abTestVariant = null,
    destinationUrl = null
  } = req.body;

  // Validation des données requises
  if (!url) {
    return next(new ErrorResponse('URL requise pour le tracking', 400));
  }

  try {
    // Récupérer l'IP et les données de géolocalisation
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || req.headers.referrer;

    // Chercher un enregistrement existant avec les mêmes critères
    const existingTracking = await URLTracking.findOne({
      smartLinkId: smartlink_id,
      url: url,
      platform: platform,
      'utmParams.utm_source': utm_params.utm_source,
      'utmParams.utm_medium': utm_params.utm_medium,
      'clickData.userAgent': userAgent,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
      }
    });

    if (existingTracking) {
      // Incrémenter le compteur de clics
      existingTracking.clickCount += 1;
      existingTracking.lastClickAt = new Date();
      await existingTracking.save();
      
      res.status(200).json({
        success: true,
        message: 'Clic incrémenté',
        data: existingTracking
      });
    } else {
      // Créer un nouvel enregistrement
      const trackingData = {
        smartLinkId: smartlink_id,
        artistId: artist_id,
        url,
        platform,
        utmParams: {
          utm_source: utm_params.utm_source || 'direct',
          utm_medium: utm_params.utm_medium || 'link',
          utm_campaign: utm_params.utm_campaign,
          utm_term: utm_params.utm_term,
          utm_content: utm_params.utm_content
        },
        mdmcParams: {
          mdmc_id: utm_params.mdmc_id,
          mdmc_timestamp: utm_params.mdmc_timestamp,
          mdmc_version: utm_params.mdmc_version || '2.0'
        },
        clickData: {
          userAgent,
          referrer,
          screenResolution: click_data.screen_resolution,
          language: click_data.language,
          timezone: click_data.timezone,
          ipAddress,
          country: click_data.country,
          city: click_data.city
        },
        platformPosition: position,
        orderSource,
        abTestVariant,
        destinationUrl
      };

      const urlTracking = await URLTracking.create(trackingData);

      res.status(201).json({
        success: true,
        message: 'Clic enregistré',
        data: urlTracking
      });
    }
  } catch (error) {
    console.error('Erreur tracking analytics:', error);
    return next(new ErrorResponse('Erreur lors de l\'enregistrement du clic', 500));
  }
});

// @desc    Récupérer les statistiques d'un SmartLink
// @route   GET /api/v1/analytics/smartlink/:id
// @access  Private (Admin)
exports.getSmartLinkAnalytics = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const smartLink = await SmartLink.findById(id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${id}`, 404));
  }

  try {
    // Statistiques générales
    const generalStats = await URLTracking.getClickStatsBySmartLink(id, { startDate, endDate });
    
    // Plateformes les plus performantes
    const topPlatforms = await URLTracking.getTopPerformingPlatforms(id);
    
    // Évolution temporelle
    const timelineStats = await URLTracking.aggregate([
      {
        $match: {
          smartLinkId: smartLink._id,
          ...(startDate || endDate ? {
            createdAt: {
              ...(startDate && { $gte: new Date(startDate) }),
              ...(endDate && { $lte: new Date(endDate) })
            }
          } : {})
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupBy === 'hour' ? '%Y-%m-%d-%H' : '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          clicks: { $sum: '$clickCount' },
          uniqueClicks: { $sum: 1 },
          platforms: { $addToSet: '$platform' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        smartLink: {
          id: smartLink._id,
          title: smartLink.trackTitle,
          artist: smartLink.artistId
        },
        general: generalStats[0] || { totalClicks: 0, uniqueClicks: 0, topSources: [] },
        topPlatforms,
        timeline: timelineStats,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Erreur récupération analytics:', error);
    return next(new ErrorResponse('Erreur lors de la récupération des analytics', 500));
  }
});

// @desc    Récupérer les statistiques d'un artiste
// @route   GET /api/v1/analytics/artist/:id
// @access  Private (Admin)
exports.getArtistAnalytics = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  const artist = await Artist.findById(id);
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${id}`, 404));
  }

  try {
    // Conversions par source
    const conversionsBySource = await URLTracking.getConversionsBySource(id, { startDate, endDate });
    
    // SmartLinks les plus performants
    const topSmartLinks = await URLTracking.aggregate([
      { $match: { artistId: artist._id } },
      {
        $group: {
          _id: '$smartLinkId',
          totalClicks: { $sum: '$clickCount' },
          uniqueClicks: { $sum: 1 },
          platforms: { $addToSet: '$platform' }
        }
      },
      {
        $lookup: {
          from: 'smartlinks',
          localField: '_id',
          foreignField: '_id',
          as: 'smartLink'
        }
      },
      { $unwind: '$smartLink' },
      {
        $project: {
          trackTitle: '$smartLink.trackTitle',
          slug: '$smartLink.slug',
          totalClicks: 1,
          uniqueClicks: 1,
          platformCount: { $size: '$platforms' }
        }
      },
      { $sort: { totalClicks: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        artist: {
          id: artist._id,
          name: artist.name,
          slug: artist.slug
        },
        conversionsBySource,
        topSmartLinks,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Erreur analytics artiste:', error);
    return next(new ErrorResponse('Erreur lors de la récupération des analytics artiste', 500));
  }
});

// @desc    Récupérer les statistiques globales
// @route   GET /api/v1/analytics/global
// @access  Private (Admin)
exports.getGlobalAnalytics = asyncHandler(async (req, res, next) => {
  const { startDate, endDate } = req.query;

  try {
    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Statistiques globales
    const globalStats = await URLTracking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clickCount' },
          uniqueClicks: { $sum: 1 },
          uniqueSmartLinks: { $addToSet: '$smartLinkId' },
          uniqueArtists: { $addToSet: '$artistId' },
          uniquePlatforms: { $addToSet: '$platform' }
        }
      },
      {
        $project: {
          totalClicks: 1,
          uniqueClicks: 1,
          uniqueSmartLinks: { $size: '$uniqueSmartLinks' },
          uniqueArtists: { $size: '$uniqueArtists' },
          uniquePlatforms: { $size: '$uniquePlatforms' }
        }
      }
    ]);

    // Top sources UTM
    const topUTMSources = await URLTracking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$utmParams.utm_source',
          clicks: { $sum: '$clickCount' },
          uniqueClicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);

    // Performance A/B testing
    const abTestPerformance = await URLTracking.aggregate([
      { 
        $match: { 
          ...matchQuery,
          abTestVariant: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$abTestVariant',
          clicks: { $sum: '$clickCount' },
          uniqueClicks: { $sum: 1 },
          avgPosition: { $avg: '$platformPosition' }
        }
      },
      { $sort: { clicks: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        global: globalStats[0] || { 
          totalClicks: 0, 
          uniqueClicks: 0, 
          uniqueSmartLinks: 0, 
          uniqueArtists: 0, 
          uniquePlatforms: 0 
        },
        topUTMSources,
        abTestPerformance,
        dateRange: { startDate, endDate }
      }
    });
  } catch (error) {
    console.error('Erreur analytics globales:', error);
    return next(new ErrorResponse('Erreur lors de la récupération des analytics globales', 500));
  }
});

// @desc    Générer un pixel de tracking (image 1x1)
// @route   GET /api/v1/analytics/pixel.gif
// @access  Public
exports.trackingPixel = asyncHandler(async (req, res, next) => {
  // Extraire les paramètres de tracking de l'URL
  const trackingData = {
    smartlink_id: req.query.id,
    artist_id: req.query.artist,
    utm_params: {
      utm_source: req.query.utm_source,
      utm_medium: req.query.utm_medium,
      utm_campaign: req.query.utm_campaign
    },
    click_data: {
      user_agent: req.headers['user-agent'],
      referrer: req.headers.referer,
      ip_address: req.ip
    }
  };

  // Enregistrer le tracking de manière asynchrone
  URLTracking.create({
    smartLinkId: trackingData.smartlink_id,
    artistId: trackingData.artist_id,
    url: req.originalUrl,
    platform: 'pixel_tracking',
    utmParams: trackingData.utm_params,
    clickData: trackingData.click_data
  }).catch(error => {
    console.error('Erreur enregistrement pixel tracking:', error);
  });

  // Retourner une image GIF transparente 1x1
  const pixelBuffer = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.set({
    'Content-Type': 'image/gif',
    'Content-Length': pixelBuffer.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.send(pixelBuffer);
});