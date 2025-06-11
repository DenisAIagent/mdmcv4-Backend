// backend/controllers/smartLinkController.js
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse'); // Assurez-vous que ce fichier existe ou adaptez
const slugify = require('slugify');

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
  // eslint-disable-next-line no-constant-condition
  while (true) {
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
  return slug;
};

// @desc    Créer un nouveau SmartLink
// @route   POST /api/smartlinks
// @access  Private (Admin)
exports.createSmartLink = asyncHandler(async (req, res, next) => {
  const { artistId, trackTitle, slug: proposedSlugByUser, ...otherData } = req.body;

  const artist = await Artist.findById(artistId);
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));
  }

  const finalSlug = await generateUniqueTrackSlug(trackTitle, artistId, proposedSlugByUser);

  const smartLinkData = {
    ...otherData,
    artistId,
    trackTitle,
    slug: finalSlug,
    // userId: req.user?.id, // Si gestion des utilisateurs activée et protect middleware utilisé
  };

  const smartLink = await SmartLink.create(smartLinkData);
  res.status(201).json({ success: true, data: smartLink });
});

// @desc    Récupérer tous les SmartLinks (pour l'admin)
// @route   GET /api/smartlinks
// @access  Private (Admin)
exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit', 'populate'];
  removeFields.forEach(param => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex|options)\b/g, match => `$${match}`);

  let query = SmartLink.find(JSON.parse(queryStr));

  if (req.query.populate === 'artist' || true) {
    query = query.populate({
      path: 'artistId',
      select: 'name slug artistImageUrl'
    });
  }

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await SmartLink.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);
  const smartLinks = await query;

  const pagination = {};
  if (endIndex < total) pagination.next = { page: page + 1, limit };
  if (startIndex > 0) pagination.prev = { page: page - 1, limit };

  res.status(200).json({
    success: true,
    count: smartLinks.length,
    total,
    pagination,
    data: smartLinks
  });
});

// @desc    Récupérer un SmartLink par son ID (pour l'édition admin)
// @route   GET /api/smartlinks/:id
// @access  Private (Admin)
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id).populate({
    path: 'artistId',
    select: 'name slug _id'
  });

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: smartLink });
});

// @desc    Mettre à jour un SmartLink par son ID
// @route   PUT /api/smartlinks/:id
// @access  Private (Admin)
exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
  let smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }
  // TODO: Ajouter vérification des droits (req.user.id vs smartLink.userId)

  const updateData = { ...req.body };
  const newTrackTitle = req.body.trackTitle;
  const proposedSlugByUser = req.body.slug;
  const currentArtistId = smartLink.artistId;

  if (
    (newTrackTitle && newTrackTitle !== smartLink.trackTitle) ||
    (proposedSlugByUser && proposedSlugByUser !== smartLink.slug)
  ) {
    const titleForSlug = newTrackTitle || smartLink.trackTitle;
    const slugToGenerateFrom = (proposedSlugByUser && proposedSlugByUser !== smartLink.slug)
                               ? proposedSlugByUser
                               : titleForSlug;
    updateData.slug = await generateUniqueTrackSlug(titleForSlug, currentArtistId, slugToGenerateFrom, smartLink._id);
  } else if (req.body.hasOwnProperty('slug') && req.body.slug === smartLink.slug) {
    updateData.slug = smartLink.slug;
  }

  if (updateData.platformLinks && Array.isArray(updateData.platformLinks)) {
    updateData.platformLinks = updateData.platformLinks.filter(link => link.platform && link.url);
  }

  const updatedSmartLink = await SmartLink.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });
  res.status(200).json({ success: true, data: updatedSmartLink });
});

// @desc    Supprimer un SmartLink par son ID
// @route   DELETE /api/smartlinks/:id
// @access  Private (Admin)
exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }
  // TODO: Vérification des droits + Supprimer image Cloudinary
  await smartLink.deleteOne();
  res.status(200).json({ success: true, message: "SmartLink supprimé avec succès." });
});

// @desc    Récupérer les SmartLinks publiés d'un artiste par son slug
// @route   GET /api/smartlinks/artist/:artistSlug
// @access  Public
exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('_id name');
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }
  const smartLinks = await SmartLink.find({
    artistId: artist._id,
    isPublished: true
  })
  .sort({ releaseDate: -1, createdAt: -1 })
  .select('trackTitle slug coverImageUrl releaseDate artistId'); // 'slug' est le trackSlug
  res.status(200).json({
    success: true,
    count: smartLinks.length,
    artistName: artist.name,
    data: smartLinks
  });
});

// @desc    Récupérer un SmartLink public par ses slugs (artistSlug et trackSlug/slug du SmartLink)
// @route   GET /api/smartlinks/public/:artistSlug/:trackSlug
// @access  Public
exports.getPublicSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
  const { artistSlug, trackSlug } = req.params;
  const artist = await Artist.findOne({ slug: artistSlug })
                             .select('name slug artistImageUrl websiteUrl socialLinks _id');
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${artistSlug}`, 404));
  }
  const smartLink = await SmartLink.findOne({
    artistId: artist._id,
    slug: trackSlug,
    isPublished: true
  });
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé ou non publié pour ${artistSlug}/${trackSlug}`, 404));
  }
  // L'incrémentation de viewCount est maintenant gérée par le middleware logClick sur la route.
  // On ne la fait plus ici pour éviter de compter double.
  // smartLink.viewCount = (smartLink.viewCount || 0) + 1;
  // await smartLink.save({ validateBeforeSave: false });

  const responseData = {
    smartLink: smartLink.toObject(),
    artist: {
      _id: artist._id.toString(),
      name: artist.name,
      slug: artist.slug,
      artistImageUrl: artist.artistImageUrl,
      websiteUrl: artist.websiteUrl,
      socialLinks: artist.socialLinks
    }
  };
  delete responseData.smartLink.artistId;
  res.status(200).json({ success: true, data: responseData });
});

// @desc    Logguer un clic sur un lien de plateforme d'un SmartLink (pour le compteur platformClickCount)
// @route   POST /api/smartlinks/:id/log-platform-click
// @access  Public
exports.logPlatformClick = asyncHandler(async (req, res, next) => {
    const smartLink = await SmartLink.findById(req.params.id);
    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
    }
    smartLink.platformClickCount = (smartLink.platformClickCount || 0) + 1;
    // Optionnel: log détaillé par plateforme
    // const { platformName } = req.body;
    // if (platformName && smartLink.platformClicksDetailed) {
    //   const currentPlatformClicks = smartLink.platformClicksDetailed.get(platformName) || 0;
    //   smartLink.platformClicksDetailed.set(platformName, currentPlatformClicks + 1);
    // }
    await smartLink.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: "Clic sur plateforme enregistré." });
});

// @desc    Récupérer les liens de plateformes depuis une URL/ISRC source
// @route   POST /api/v1/smartlinks/fetch-platform-links
// @access  Private (Admin)
exports.fetchPlatformLinks = asyncHandler(async (req, res, next) => {
  const { sourceUrl } = req.body;
  
  if (!sourceUrl || typeof sourceUrl !== 'string' || sourceUrl.trim() === '') {
    return next(new ErrorResponse('URL source ou ISRC requis', 400));
  }

  const cleanSourceUrl = sourceUrl.trim();
  console.log('Backend: Récupération liens pour:', cleanSourceUrl);

  try {
    // TODO: Ici vous intégrerez votre logique de récupération réelle
    // Pour l'instant, réponse de test basée sur l'URL source
    
    let mockData = {
      title: "Titre extrait",
      artistName: "Artiste extrait",
      thumbnailUrl: "https://via.placeholder.com/300",
      links: {}
    };

    // Simulation basée sur le type d'URL
    if (cleanSourceUrl.includes('spotify.com')) {
      mockData = {
        title: "Track depuis Spotify",
        artistName: "Artiste Spotify",
        thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b273...",
        links: {
          spotify: cleanSourceUrl,
          appleMusic: "https://music.apple.com/album/track-id/123456789",
          deezer: "https://www.deezer.com/track/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    } else if (cleanSourceUrl.includes('music.apple.com')) {
      mockData = {
        title: "Track depuis Apple Music",
        artistName: "Artiste Apple",
        thumbnailUrl: "https://is1-ssl.mzstatic.com/image/thumb/...",
        links: {
          appleMusic: cleanSourceUrl,
          spotify: "https://open.spotify.com/track/123456789",
          deezer: "https://www.deezer.com/track/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    } else if (cleanSourceUrl.includes('deezer.com')) {
      mockData = {
        title: "Track depuis Deezer",
        artistName: "Artiste Deezer",
        thumbnailUrl: "https://e-cdns-images.dzcdn.net/images/cover/...",
        links: {
          deezer: cleanSourceUrl,
          spotify: "https://open.spotify.com/track/123456789",
          appleMusic: "https://music.apple.com/album/track-id/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    } else if (cleanSourceUrl.startsWith('ISRC') || /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/.test(cleanSourceUrl)) {
      // ISRC détecté
      mockData = {
        title: "Track depuis ISRC",
        artistName: "Artiste ISRC",
        thumbnailUrl: "https://via.placeholder.com/300",
        links: {
          spotify: "https://open.spotify.com/track/123456789",
          appleMusic: "https://music.apple.com/album/track-id/123456789",
          deezer: "https://www.deezer.com/track/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    }

    res.status(200).json({
      success: true,
      data: mockData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des liens:', error);
    return next(new ErrorResponse('Erreur lors de la récupération des liens de plateformes', 500));
  }
});
