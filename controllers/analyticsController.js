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

  const smartLink = await SmartLink.findById(id).populate('artistId');
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${id}`, 404));
  }

  try {
    // Statistiques par plateforme depuis platformClickStats (MongoDB Map)
    const platformStats = [];
    
    console.log('🔍 Analytics - Type de platformClickStats:', typeof smartLink.platformClickStats);
    console.log('🔍 Analytics - platformClickStats:', smartLink.platformClickStats);
    
    if (smartLink.platformClickStats) {
      // Vérifier si c'est une Map MongoDB
      if (smartLink.platformClickStats instanceof Map) {
        console.log('📊 Traitement en tant que Map MongoDB');
        for (const [platform, clicks] of smartLink.platformClickStats.entries()) {
          if (clicks > 0) {
            const platformName = {
              spotify: 'Spotify',
              deezer: 'Deezer',
              appleMusic: 'Apple Music',
              youtubeMusic: 'YouTube Music',
              soundcloud: 'SoundCloud',
              tidal: 'Tidal',
              amazonMusic: 'Amazon Music',
              boomplay: 'Boomplay'
            }[platform.toLowerCase()] || platform;

            platformStats.push({
              platform,
              platformName,
              clicks: clicks || 0
            });
          }
        }
      } else if (typeof smartLink.platformClickStats === 'object') {
        console.log('📊 Traitement en tant que Object JavaScript');
        // Traitement en tant qu'objet classique
        for (const [platform, clicks] of Object.entries(smartLink.platformClickStats)) {
          if (clicks > 0) {
            const platformName = {
              spotify: 'Spotify',
              deezer: 'Deezer',
              appleMusic: 'Apple Music',
              youtubeMusic: 'YouTube Music',
              soundcloud: 'SoundCloud',
              tidal: 'Tidal',
              amazonMusic: 'Amazon Music',
              boomplay: 'Boomplay'
            }[platform.toLowerCase()] || platform;

            platformStats.push({
              platform,
              platformName,
              clicks: clicks || 0
            });
          }
        }
      }
    }
    
    console.log('📊 Analytics - platformStats générées:', platformStats);

    // Statistiques générales
    const totalViews = smartLink.viewCount || 0;
    const totalClicks = smartLink.platformClickCount || 0;

    res.status(200).json({
      success: true,
      data: {
        smartLink: {
          id: smartLink._id,
          title: smartLink.trackTitle,
          artist: smartLink.artistId
        },
        totalViews,
        totalClicks,
        platformStats: platformStats.sort((a, b) => b.clicks - a.clicks),
        conversionRate: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0
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

// @desc    Récupérer les statistiques pour le dashboard admin
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin)
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Statistiques totales SmartLinks
    const totalSmartLinks = await SmartLink.countDocuments();
    const smartLinksLastMonth = await SmartLink.countDocuments({
      createdAt: { $lt: currentMonth }
    });
    const smartLinksChange = smartLinksLastMonth > 0 
      ? (((totalSmartLinks - smartLinksLastMonth) / smartLinksLastMonth) * 100).toFixed(1)
      : 0;

    // Statistiques artistes actifs
    const totalArtists = await Artist.countDocuments();
    const artistsLastMonth = await Artist.countDocuments({
      createdAt: { $lt: currentMonth }
    });
    const artistsChange = artistsLastMonth > 0 
      ? (((totalArtists - artistsLastMonth) / artistsLastMonth) * 100).toFixed(1)
      : 0;

    // Statistiques de vues/clics ce mois
    const viewsThisMonth = await URLTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    const viewsLastMonth = await URLTracking.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: lastMonth,
            $lt: currentMonth
          }
        }
      },
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    const currentMonthViews = viewsThisMonth[0]?.totalClicks || 0;
    const lastMonthViews = viewsLastMonth[0]?.totalClicks || 0;
    const viewsChange = lastMonthViews > 0 
      ? (((currentMonthViews - lastMonthViews) / lastMonthViews) * 100).toFixed(1)
      : 0;

    // Statistiques clics totaux
    const totalClicks = await URLTracking.aggregate([
      {
        $group: {
          _id: null,
          totalClicks: { $sum: '$clickCount' }
        }
      }
    ]);

    const totalClicksCount = totalClicks[0]?.totalClicks || 0;
    
    // Activités récentes (vrais SmartLinks récents)
    const recentActivities = await SmartLink.find()
      .populate('artistId', 'name')
      .sort({ createdAt: -1 })
      .limit(4)
      .select('trackTitle artistId createdAt');

    // Performance de la semaine
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyStats = await URLTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: null,
          newClicks: { $sum: '$clickCount' },
          uniqueClicks: { $sum: 1 }
        }
      }
    ]);

    const weeklyClicks = weeklyStats[0]?.newClicks || 0;
    const weeklyUniqueClicks = weeklyStats[0]?.uniqueClicks || 0;
    const conversionRate = weeklyUniqueClicks > 0 
      ? ((weeklyClicks / weeklyUniqueClicks) * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalSmartLinks: {
            value: totalSmartLinks,
            change: `${smartLinksChange >= 0 ? '+' : ''}${smartLinksChange}%`,
            changeType: smartLinksChange >= 0 ? 'positive' : 'negative'
          },
          activeArtists: {
            value: totalArtists,
            change: `${artistsChange >= 0 ? '+' : ''}${artistsChange}%`,
            changeType: artistsChange >= 0 ? 'positive' : 'negative'
          },
          monthlyViews: {
            value: currentMonthViews,
            change: `${viewsChange >= 0 ? '+' : ''}${viewsChange}%`,
            changeType: viewsChange >= 0 ? 'positive' : 'negative'
          },
          totalClicks: {
            value: totalClicksCount,
            change: viewsChange >= 0 ? '+2%' : '-2%', // Approximation basée sur les vues
            changeType: viewsChange >= 0 ? 'positive' : 'negative'
          }
        },
        weeklyPerformance: {
          newClicks: weeklyClicks,
          conversionRate: `${conversionRate}%`
        },
        recentActivities: recentActivities.map(activity => ({
          type: 'smartlink_created',
          title: 'Nouveau SmartLink créé',
          subtitle: `"${activity.trackTitle}" par ${activity.artistId?.name || 'Artiste'}`,
          time: activity.createdAt,
          id: activity._id
        }))
      }
    });
  } catch (error) {
    console.error('Erreur statistiques dashboard:', error);
    return next(new ErrorResponse('Erreur lors de la récupération des statistiques dashboard', 500));
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