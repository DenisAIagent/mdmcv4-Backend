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
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));
  }

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
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // Sort (si l'API permet de trier)
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
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


  res.status(200).json({
    success: true,
    count: smartLinks.length,
    totalCount: total, // Nombre total de documents correspondants
    pagination,
    data: smartLinks
  });
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
 * @desc    Récupérer un SmartLink par son ID (pour l'admin)
 * @route   GET /api/v1/smartlinks/:id
 * @access  Private (Admin)
 */
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id).populate({
      path: 'artistId',
      select: 'name slug'
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