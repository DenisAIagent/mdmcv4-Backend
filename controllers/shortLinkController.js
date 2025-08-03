// backend/controllers/shortLinkController.js
const ShortLink = require('../models/ShortLink');
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Créer un ShortLink
// @route   POST /api/shortlinks
// @access  Private (Admin)
exports.createShortLink = asyncHandler(async (req, res, next) => {
  const { smartLinkId } = req.body;

  // Vérifier que le SmartLink existe
  const smartLink = await SmartLink.findById(smartLinkId);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${smartLinkId}`, 404));
  }

  // Vérifier si un ShortLink existe déjà pour ce SmartLink
  let existingShortLink = await ShortLink.findOne({ 
    smartLinkId, 
    isActive: true 
  });

  if (existingShortLink) {
    console.log(`♻️ ShortLink existant réutilisé: ${existingShortLink.shortCode}`);
    return res.status(200).json({
      success: true,
      message: "ShortLink existant réutilisé",
      data: existingShortLink
    });
  }

  // Générer un nouveau code court
  const shortCode = await ShortLink.generateShortCode();
  
  // Créer le ShortLink
  const shortLink = await ShortLink.create({
    shortCode,
    smartLinkId,
    createdBy: req.user?.id || null
  });

  console.log(`✅ Nouveau ShortLink créé: ${shortCode} → SmartLink ${smartLinkId}`);

  res.status(201).json({
    success: true,
    message: "ShortLink créé avec succès",
    data: shortLink
  });
});

// @desc    Résoudre un ShortLink (redirection)
// @route   GET /api/shortlinks/:shortCode
// @access  Public
exports.resolveShortLink = asyncHandler(async (req, res, next) => {
  const { shortCode } = req.params;

  console.log(`🔍 Résolution ShortLink: ${shortCode}`);

  // Chercher le ShortLink actif
  const shortLink = await ShortLink.findOne({ 
    shortCode, 
    isActive: true 
  }).populate({
    path: 'smartLinkId',
    select: 'trackTitle slug artistId',
    populate: {
      path: 'artistId',
      select: 'name slug'
    }
  });

  if (!shortLink) {
    console.log(`❌ ShortLink non trouvé: ${shortCode}`);
    return next(new ErrorResponse('ShortLink non trouvé ou expiré', 404));
  }

  // Vérifier expiration
  if (shortLink.expiresAt && shortLink.expiresAt < new Date()) {
    console.log(`⏰ ShortLink expiré: ${shortCode}`);
    return next(new ErrorResponse('ShortLink expiré', 410));
  }

  // Extraire les informations client pour les stats
  const clientInfo = {
    country: req.headers['cf-ipcountry'] || req.headers['x-country'] || 'Unknown',
    referrer: req.headers.referer || 'Direct',
    device: req.headers['user-agent']?.includes('Mobile') ? 'Mobile' : 'Desktop'
  };

  // Incrémenter le compteur (en arrière-plan)
  shortLink.incrementClick(clientInfo).catch(err => {
    console.error('Erreur incrémentation ShortLink:', err);
  });

  const smartLink = shortLink.smartLinkId;
  const artist = smartLink.artistId;

  console.log(`✅ ShortLink résolu: ${shortCode} → /${artist.slug}/${smartLink.slug}`);

  res.status(200).json({
    success: true,
    data: {
      smartLink: {
        _id: smartLink._id,
        trackTitle: smartLink.trackTitle,
        slug: smartLink.slug
      },
      artist: {
        _id: artist._id,
        name: artist.name,
        slug: artist.slug
      },
      shortCode,
      clickCount: shortLink.clickCount + 1 // +1 pour le clic actuel
    }
  });
});

// @desc    Obtenir les statistiques d'un ShortLink
// @route   GET /api/shortlinks/:shortCode/stats
// @access  Private (Admin)
exports.getShortLinkStats = asyncHandler(async (req, res, next) => {
  const { shortCode } = req.params;

  const shortLink = await ShortLink.findOne({ shortCode }).populate({
    path: 'smartLinkId',
    select: 'trackTitle artistId',
    populate: {
      path: 'artistId',
      select: 'name'
    }
  });

  if (!shortLink) {
    return next(new ErrorResponse('ShortLink non trouvé', 404));
  }

  const stats = {
    shortCode: shortLink.shortCode,
    smartLink: {
      title: shortLink.smartLinkId.trackTitle,
      artist: shortLink.smartLinkId.artistId.name
    },
    totalClicks: shortLink.clickCount,
    isActive: shortLink.isActive,
    createdAt: shortLink.createdAt,
    lastAccessedAt: shortLink.lastAccessedAt,
    accessStats: {
      totalClicks: shortLink.accessStats?.totalClicks || 0,
      uniqueVisitors: shortLink.accessStats?.uniqueVisitors || 0,
      topCountries: Object.fromEntries(shortLink.accessStats?.countries || new Map()),
      topReferrers: Object.fromEntries(shortLink.accessStats?.referrers || new Map()),
      deviceBreakdown: Object.fromEntries(shortLink.accessStats?.devices || new Map())
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Lister tous les ShortLinks
// @route   GET /api/shortlinks
// @access  Private (Admin)
exports.getAllShortLinks = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;

  const query = {};
  
  // Filtres optionnels
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const total = await ShortLink.countDocuments(query);
  
  const shortLinks = await ShortLink.find(query)
    .populate({
      path: 'smartLinkId',
      select: 'trackTitle slug artistId',
      populate: {
        path: 'artistId',
        select: 'name slug'
      }
    })
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit);

  const pagination = {};
  if (startIndex + limit < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.status(200).json({
    success: true,
    count: shortLinks.length,
    total,
    pagination,
    data: shortLinks
  });
});

// @desc    Désactiver un ShortLink
// @route   DELETE /api/shortlinks/:shortCode
// @access  Private (Admin)
exports.deactivateShortLink = asyncHandler(async (req, res, next) => {
  const { shortCode } = req.params;

  const shortLink = await ShortLink.findOne({ shortCode });
  if (!shortLink) {
    return next(new ErrorResponse('ShortLink non trouvé', 404));
  }

  shortLink.isActive = false;
  await shortLink.save();

  console.log(`🔒 ShortLink désactivé: ${shortCode}`);

  res.status(200).json({
    success: true,
    message: "ShortLink désactivé avec succès"
  });
});

// @desc    Réactiver un ShortLink
// @route   PATCH /api/shortlinks/:shortCode/activate
// @access  Private (Admin)
exports.activateShortLink = asyncHandler(async (req, res, next) => {
  const { shortCode } = req.params;

  const shortLink = await ShortLink.findOne({ shortCode });
  if (!shortLink) {
    return next(new ErrorResponse('ShortLink non trouvé', 404));
  }

  shortLink.isActive = true;
  await shortLink.save();

  console.log(`🔓 ShortLink réactivé: ${shortCode}`);

  res.status(200).json({
    success: true,
    message: "ShortLink réactivé avec succès"
  });
});