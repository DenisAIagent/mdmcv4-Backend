// controllers/smartLinkController.js
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const slugify = require('slugify');
const { validationResult } = require('express-validator');
const NodeCache = require('node-cache');
const mongoose = require('mongoose');

// Cache pour les requêtes fréquentes (TTL: 5 minutes)
const cache = new NodeCache({ stdTTL: 300 });

// --- Fonction utilitaire interne pour générer un slug unique ---
const generateUniqueTrackSlug = async (baseTitle, artistId, proposedSlug = null, excludeId = null) => {
  let baseSlugAttempt = proposedSlug
    ? slugify(proposedSlug, { lower: true, strict: true, remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g })
    : slugify(baseTitle, { lower: true, strict: true, remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g });

  if (!baseSlugAttempt) {
    baseSlugAttempt = 'smartlink';
  }

  let slug = baseSlugAttempt;
  let count = 0;
  const maxAttempts = 100; // Prévenir les boucles infinies

  while (count < maxAttempts) {
    const query = { artistId, slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existingSmartLink = await SmartLink.findOne(query);
    if (!existingSmartLink) {
      break;
    }
    count++;
    slug = `${baseSlugAttempt}-${count}`;
  }

  if (count >= maxAttempts) {
    throw new Error('Impossible de générer un slug unique après plusieurs tentatives');
  }

  return slug;
};

/**
 * @desc    Créer un nouveau SmartLink
 * @route   POST /api/v1/smartlinks
 * @access  Private (Admin)
 */
exports.createSmartLink = asyncHandler(async (req, res, next) => {
  // Validation des entrées
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }

  const { artistId, trackTitle, slug: proposedSlugByUser, platformLinks, ...otherData } = req.body;

  // Vérification de l'artiste
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));
  }

  // Validation des liens de plateformes
  if (platformLinks && Array.isArray(platformLinks)) {
    for (const link of platformLinks) {
      if (!link.platform || !link.url) {
        return next(new ErrorResponse('Chaque lien de plateforme doit avoir un nom de plateforme et une URL', 400));
      }
      try {
        new URL(link.url);
      } catch (e) {
        return next(new ErrorResponse(`URL invalide pour la plateforme ${link.platform}`, 400));
      }
    }
  }

  // Génération du slug
  const finalSlug = await generateUniqueTrackSlug(trackTitle, artistId, proposedSlugByUser);

  const smartLinkData = {
    ...otherData,
    artistId,
    trackTitle,
    slug: finalSlug,
    platformLinks: platformLinks || [],
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  const smartLink = await SmartLink.create(smartLinkData);
  
  // Invalider le cache
  cache.del(`artist_${artistId}_smartlinks`);
  
  res.status(201).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Récupérer tous les SmartLinks
 * @route   GET /api/v1/smartlinks
 * @access  Private (Admin)
 */
exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
  const cacheKey = `smartlinks_${JSON.stringify(req.query)}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit', 'populate'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Validation des paramètres de requête
  if (reqQuery.artistId && !mongoose.Types.ObjectId.isValid(reqQuery.artistId)) {
    return next(new ErrorResponse('ID d\'artiste invalide', 400));
  }

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex|options)\b/g, match => `$${match}`);

  let query = SmartLink.find(JSON.parse(queryStr));

  // Population de l'artiste
  query = query.populate({
    path: 'artistId',
    select: 'name slug artistImageUrl'
  });

  // Sélection des champs
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Tri
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const maxLimit = 100; // Limite maximale pour prévenir les abus
  const finalLimit = Math.min(limit, maxLimit);
  
  const startIndex = (page - 1) * finalLimit;
  const endIndex = page * finalLimit;
  const total = await SmartLink.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(finalLimit);

  const smartLinks = await query;

  const pagination = {
    page,
    limit: finalLimit,
    totalPages: Math.ceil(total / finalLimit),
    totalItems: total
  };

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit: finalLimit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit: finalLimit };
  }

  const response = {
    success: true,
    count: smartLinks.length,
    pagination,
    data: smartLinks
  };

  // Mise en cache
  cache.set(cacheKey, response);

  res.status(200).json(response);
});

/**
 * @desc    Récupérer les SmartLinks d'un artiste spécifique par son slug
 * @route   GET /api/v1/artists/:artistSlug/smartlinks
 * @access  Public or Private (Admin)
 */
exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
    const artist = await Artist.findOne({ slug: req.params.artistSlug });

    if (!artist) {
        return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
    }

    // Trouver les SmartLinks associés à cet artiste
    const smartLinks = await SmartLink.find({ artistId: artist._id }).sort({ releaseDate: -1, createdAt: -1 }); // Tri par date de sortie puis création

    res.status(200).json({
        success: true,
        count: smartLinks.length,
        artist: { // Renvoyer aussi quelques infos de l'artiste peut être utile
            _id: artist._id,
            name: artist.name,
            slug: artist.slug,
            artistImageUrl: artist.artistImageUrl,
            bio: artist.bio
        },
        data: smartLinks
    });
});

/**
 * @desc    Récupérer un SmartLink spécifique par les slugs artiste et track
 * @route   GET /api/v1/smartlinks/details/:artistSlug/:trackSlug
 * @access  Public or Private (Admin)
 */
exports.getSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
    const { artistSlug, trackSlug } = req.params;

    // 1. Trouver l'artiste par son slug
    const artist = await Artist.findOne({ slug: artistSlug });
    if (!artist) {
        return next(new ErrorResponse(`Artiste non trouvé avec le slug ${artistSlug}`, 404));
    }

    // 2. Trouver le SmartLink par artistId et trackSlug
    const smartLink = await SmartLink.findOne({
        artistId: artist._id,
        trackSlug: trackSlug
    }).populate({ // Peuple l'artiste associé pour avoir ses infos
        path: 'artistId',
        select: 'name slug artistImageUrl bio'
    });

    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé avec le slug ${trackSlug} pour l'artiste ${artistSlug}`, 404));
    }

    // Optionnel: Vérifier si le lien est publié si l'accès n'est pas admin
    // if (!smartLink.isPublished /* && !req.user.isAdmin */ ) {
    //   return next(new ErrorResponse(`Ce SmartLink n'est pas publié`, 404));
    // }

    res.status(200).json({
        success: true,
        data: smartLink
    });
});

/**
 * @desc    Récupérer un SmartLink par son ID
 * @route   GET /api/v1/smartlinks/:id
 * @access  Private (Admin)
 */
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id)
    .populate({
      path: 'artistId',
      select: 'name slug artistImageUrl'
    });

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Mettre à jour un SmartLink
 * @route   PUT /api/v1/smartlinks/:id
 * @access  Private (Admin)
 */
exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
  const { trackTitle, slug: proposedSlugByUser, platformLinks, ...otherData } = req.body;

  let smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Validation des liens de plateformes
  if (platformLinks && Array.isArray(platformLinks)) {
    for (const link of platformLinks) {
      if (!link.platform || !link.url) {
        return next(new ErrorResponse('Chaque lien de plateforme doit avoir un nom de plateforme et une URL', 400));
      }
      try {
        new URL(link.url);
      } catch (e) {
        return next(new ErrorResponse(`URL invalide pour la plateforme ${link.platform}`, 400));
      }
    }
  }

  // Génération du slug si le titre a changé
  if (trackTitle && trackTitle !== smartLink.trackTitle) {
    otherData.slug = await generateUniqueTrackSlug(trackTitle, smartLink.artistId, proposedSlugByUser, req.params.id);
  }

  smartLink = await SmartLink.findByIdAndUpdate(
    req.params.id,
    {
      ...otherData,
      trackTitle: trackTitle || smartLink.trackTitle,
      platformLinks: platformLinks || smartLink.platformLinks,
      updatedBy: req.user.id
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'artistId',
    select: 'name slug artistImageUrl'
  });

  // Invalider le cache
  cache.del(`artist_${smartLink.artistId}_smartlinks`);
  cache.del(`smartlinks_${JSON.stringify(req.query)}`);

  res.status(200).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Supprimer un SmartLink
 * @route   DELETE /api/v1/smartlinks/:id
 * @access  Private (Admin)
 */
exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  await smartLink.deleteOne();

  // Invalider le cache
  cache.del(`artist_${smartLink.artistId}_smartlinks`);
  cache.del(`smartlinks_${JSON.stringify(req.query)}`);

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Récupérer un SmartLink public par les slugs d'artiste et de morceau
 * @route   GET /api/v1/smartlinks/public/:artistSlug/:trackSlug
 * @access  Public
 */
exports.getPublicSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
  const { artistSlug, trackSlug } = req.params;

  const artist = await Artist.findOne({ slug: artistSlug });
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${artistSlug}`, 404));
  }

  const smartLink = await SmartLink.findOne({
    artistId: artist._id,
    slug: trackSlug,
    isPublished: true
  }).populate({
    path: 'artistId',
    select: 'name slug artistImageUrl'
  });

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé pour l'artiste ${artistSlug} et le morceau ${trackSlug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Logger un clic sur une plateforme
 * @route   POST /api/v1/smartlinks/:id/log-platform-click
 * @access  Public
 */
exports.logPlatformClick = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  smartLink.platformClickCount += 1;
  await smartLink.save();

  res.status(200).json({
    success: true,
    data: {
      platformClickCount: smartLink.platformClickCount
    }
  });
});
