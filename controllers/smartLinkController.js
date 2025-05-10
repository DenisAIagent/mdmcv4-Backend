<<<<<<< HEAD
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

=======
// controllers/smartLinkController.js

const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Créer un nouveau SmartLink pour un artiste
 * @route   POST /api/v1/smartlinks
 * @access  Private (Admin)
 * @body    { trackTitle, coverImageUrl, artistId, [releaseDate], [description], [platformLinks], [trackingIds], [isPublished] }
 */
exports.createSmartLink = asyncHandler(async (req, res, next) => {
  // L'ID de l'artiste doit être fourni dans le corps de la requête
  const { artistId } = req.body;

  if (!artistId) {
    return next(new ErrorResponse("L'ID de l'artiste (artistId) est requis dans le body", 400));
  }

  // Vérifier si l'artiste existe
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));
  }

<<<<<<< HEAD
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

=======
  // Assigner l'artistId et créer le SmartLink
  // Le trackSlug sera généré par le hook pre-save
  const smartLink = await SmartLink.create({ ...req.body, artistId: artist._id });

  res.status(201).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Récupérer tous les SmartLinks (avec filtre optionnel par artiste)
 * @route   GET /api/v1/smartlinks
 * @route   GET /api/v1/smartlinks?artistId=...
 * @access  Private (Admin) or Public ?
 */
exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
  let query;
  const reqQuery = { ...req.query };

  // Champs à exclure de la recherche de filtre
  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  // Créer la chaîne de requête
  let queryStr = JSON.stringify(reqQuery);
  // Créer des opérateurs ($gt, $gte, etc) - si nécessaire pour d'autres filtres futurs
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Construire la requête de base
  query = SmartLink.find(JSON.parse(queryStr));

  // Select Fields (si l'API permet de choisir les champs à retourner)
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

<<<<<<< HEAD
=======
  // Sort (si l'API permet de trier)
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
<<<<<<< HEAD
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
=======
    query = query.sort('-createdAt'); // Tri par défaut: les plus récents d'abord
  }

  // Pagination (exemple basique)
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25; // 25 par défaut
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await SmartLink.countDocuments(JSON.parse(queryStr)); // Compter les documents correspondants

  query = query.skip(startIndex).limit(limit);

  // --- Ajout pour peupler l'artiste ---
  query = query.populate({
      path: 'artistId',
      select: 'name slug artistImageUrl' // Sélectionner seulement certains champs de l'artiste
  });
  // --- Fin ajout populate ---


  // Exécuter la requête
  const smartLinks = await query;

  // Résultat de la pagination
  const pagination = {};
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)

  res.status(200).json({
    success: true,
    count: smartLinks.length,
<<<<<<< HEAD
    total,
=======
    totalCount: total, // Nombre total de documents correspondants
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
    pagination,
    data: smartLinks
  });
});

<<<<<<< HEAD
// @desc    Récupérer un SmartLink par son ID (pour l'édition admin)
// @route   GET /api/smartlinks/:id
// @access  Private (Admin)
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id).populate({
    path: 'artistId',
    select: 'name slug _id'
=======

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
 * @desc    Récupérer un SmartLink par son ID (pour l'admin)
 * @route   GET /api/v1/smartlinks/:id
 * @access  Private (Admin)
 */
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id).populate({
      path: 'artistId',
      select: 'name slug'
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
  });

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }
<<<<<<< HEAD
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
=======

  res.status(200).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Mettre à jour un SmartLink par son ID (pour l'admin)
 * @route   PUT /api/v1/smartlinks/:id
 * @access  Private (Admin)
 */
exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
  let smartLink = await SmartLink.findById(req.params.id);

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Assurez-vous que l'artistId ne soit pas modifié accidentellement ici
  // Si le changement d'artiste est une fonctionnalité voulue, il faut une logique spécifique
  delete req.body.artistId;
  // Le trackSlug ne devrait idéalement pas changer non plus après création via cette route
  // Si le trackTitle change, le hook pre-save re-générera le slug.
  delete req.body.trackSlug;

  // Mettre à jour les champs modifiables
  // Utiliser Object.assign ou une boucle pour mettre à jour proprement
   Object.assign(smartLink, req.body);


  // Sauvegarder les modifications (déclenchera le hook pre('save') si trackTitle change)
  const updatedSmartLink = await smartLink.save();

  // // Alternative : findByIdAndUpdate (Attention aux hooks 'save')
  // const updatedSmartLink = await SmartLink.findByIdAndUpdate(req.params.id, req.body, {
  //   new: true,
  //   runValidators: true
  // });


  res.status(200).json({
    success: true,
    data: updatedSmartLink
  });
});

/**
 * @desc    Supprimer un SmartLink par son ID (pour l'admin)
 * @route   DELETE /api/v1/smartlinks/:id
 * @access  Private (Admin)
 */
exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id);

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  await smartLink.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
