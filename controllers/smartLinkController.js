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
  const { artistId, artistName, trackTitle, slug: proposedSlugByUser, ...otherData } = req.body;

  let artist;
  let finalArtistId;

  // Si artistId est fourni, l'utiliser (compatibilité rétroactive)
  if (artistId) {
    artist = await Artist.findById(artistId);
    if (!artist) {
      return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));
    }
    finalArtistId = artistId;
  } 
  // Sinon, utiliser artistName (nouveau comportement avec Odesli)
  else if (artistName) {
    // Chercher si l'artiste existe déjà par nom
    artist = await Artist.findOne({ name: artistName.trim() });
    
    // Si l'artiste n'existe pas, le créer
    if (!artist) {
      console.log(`🎵 Création automatique de l'artiste: ${artistName}`);
      artist = await Artist.create({
        name: artistName.trim(),
        slug: slugify(artistName.trim(), { lower: true, strict: true }),
        description: `Artiste créé automatiquement depuis SmartLink`
      });
    }
    finalArtistId = artist._id;
  } else {
    return next(new ErrorResponse('artistId ou artistName requis', 400));
  }

  const finalSlug = await generateUniqueTrackSlug(trackTitle, finalArtistId, proposedSlugByUser);

  const smartLinkData = {
    ...otherData,
    artistId: finalArtistId,
    trackTitle,
    slug: finalSlug,
    // userId: req.user?.id, // Si gestion des utilisateurs activée et protect middleware utilisé
  };

  const smartLink = await SmartLink.create(smartLinkData);
  
  // Récupérer le SmartLink avec les informations de l'artiste pour la redirection
  const smartLinkWithArtist = await SmartLink.findById(smartLink._id).populate({
    path: 'artistId',
    select: 'name slug'
  });
  
  res.status(201).json({ success: true, data: smartLinkWithArtist });
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
    
    // Incrémenter le total
    smartLink.platformClickCount = (smartLink.platformClickCount || 0) + 1;
    
    // Incrémenter le détail par plateforme
    const { platformName } = req.body;
    if (platformName) {
        if (!smartLink.platformClickStats) {
            smartLink.platformClickStats = {};
        }
        const currentPlatformClicks = smartLink.platformClickStats[platformName] || 0;
        smartLink.platformClickStats[platformName] = currentPlatformClicks + 1;
        console.log(`📊 Clic enregistré: ${platformName} = ${currentPlatformClicks + 1} pour SmartLink ${smartLink.trackTitle}`);
    }
    
    await smartLink.save({ validateBeforeSave: false });
    
    // Récupération des clics de plateforme depuis l'Object
    const platformClicks = platformName ? smartLink.platformClickStats[platformName] : null;
    
    console.log(`✅ Clic ${platformName} enregistré: Total=${smartLink.platformClickCount}, Platform=${platformClicks}`);
    
    res.status(200).json({ 
        success: true, 
        message: "Clic sur plateforme enregistré.",
        data: {
            platform: platformName,
            totalClicks: smartLink.platformClickCount,
            platformClicks: platformClicks
        }
    });
});

// @desc    Récupérer les liens de plateformes depuis une URL/ISRC source via Odesli
// @route   POST /api/smartlinks/fetch-platform-links
// @access  Private (Admin)
exports.fetchPlatformLinks = asyncHandler(async (req, res, next) => {
  const { sourceUrl, userCountry = 'FR' } = req.body;
  
  if (!sourceUrl || typeof sourceUrl !== 'string' || sourceUrl.trim() === '') {
    return next(new ErrorResponse('URL source ou ISRC requis', 400));
  }

  const cleanSourceUrl = sourceUrl.trim();
  console.log(`Backend: Récupération liens Odesli pour: ${cleanSourceUrl} (${userCountry})`);

  try {
    // Import du service Odesli
    const odesliService = require('../services/odesliService');
    
    // Validation du format d'entrée
    const inputValidation = odesliService.validateInput(cleanSourceUrl);
    console.log(`📋 Type détecté: ${inputValidation.type}`);
    
    // Appel API Odesli
    const result = await odesliService.fetchPlatformLinks(cleanSourceUrl, userCountry);
    
    if (!result.success) {
      return next(new ErrorResponse(result.error || 'Échec de récupération des liens', 400));
    }

    console.log(`✅ Backend: ${Object.keys(result.data.linksByPlatform).length} plateformes récupérées`);
    
    res.status(200).json({
      success: true,
      data: {
        title: result.data.title,
        artistName: result.data.artist,
        album: result.data.album,
        thumbnailUrl: result.data.artwork,
        isrc: result.data.isrc,
        type: result.data.type,
        duration: result.data.duration,
        releaseDate: result.data.releaseDate,
        
        // Liens formatés pour l'interface frontend
        links: result.data.linksByPlatform,
        
        // Données supplémentaires
        alternativeArtworks: result.data.alternativeArtworks,
        pageUrl: result.data.pageUrl,
        entityId: result.data.entityId,
        apiProvider: result.data.apiProvider,
        
        // Métadonnées de la requête
        inputType: inputValidation.type,
        userCountry: userCountry,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Backend: Erreur Odesli:', error.message);
    
    // Gestion d'erreurs spécifiques
    if (error.message.includes('non trouvé')) {
      return next(new ErrorResponse(`Contenu non trouvé pour: ${cleanSourceUrl}`, 404));
    }
    
    if (error.message.includes('Format invalide')) {
      return next(new ErrorResponse(error.message, 400));
    }
    
    if (error.message.includes('Limite de taux')) {
      return next(new ErrorResponse('Trop de requêtes. Réessayez dans quelques minutes.', 429));
    }
    
    return next(new ErrorResponse(`Erreur lors de la récupération: ${error.message}`, 500));
  }
});
