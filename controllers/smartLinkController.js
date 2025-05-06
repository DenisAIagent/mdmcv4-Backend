// backend/controllers/smartLinkController.js
const SmartLink = require('../models/SmartLink'); // Adaptez le chemin si nécessaire
const Artist = require('../models/Artist'); // Adaptez le chemin si nécessaire
const asyncHandler = require('../middleware/asyncHandler'); // Adaptez le chemin si nécessaire
const ErrorResponse = require('../utils/errorResponse'); // Adaptez le chemin si nécessaire
const slugify = require('slugify'); // Nécessaire pour la vérification/mise à jour du slug

/**
 * @desc    Créer un nouveau SmartLink
 * @route   POST /api/smartlinks (ou /api/v1/smartlinks)
 * @access  Privé (Admin)
 */
exports.createSmartLink = asyncHandler(async (req, res, next) => {
    // La validation du body (trackTitle, artistId, etc.) est gérée par express-validator dans les routes
    const { artistId, trackTitle, releaseDate, coverImageUrl, description, platformLinks, trackingIds, isPublished } = req.body;

    // 1. Vérifier que l'artiste référencé existe réellement
    const artist = await Artist.findById(artistId);
    if (!artist) {
        return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}. Impossible de créer le SmartLink.`, 404));
    }

    // 2. Créer le SmartLink. Le hook pre('save') dans le modèle SmartLink.js
    //    générera automatiquement le trackSlug à partir de trackTitle.
    //    L'index unique { artistId: 1, trackSlug: 1 } dans le modèle gérera
    //    les conflits si un slug identique existe déjà pour cet artiste.
    //    Mongoose lèvera une erreur E11000 dans ce cas, qui sera gérée par asyncHandler/global error handler.
    const smartLink = await SmartLink.create({
        artistId,
        trackTitle,
        releaseDate,
        coverImageUrl,
        description,
        platformLinks,
        trackingIds,
        isPublished: isPublished || false // Assurer une valeur par défaut si non fourni
    });

    res.status(201).json({
        success: true,
        data: smartLink
    });
});

/**
 * @desc    Obtenir tous les SmartLinks (avec filtres/pagination pour admin)
 * @route   GET /api/smartlinks (ou /api/v1/smartlinks)
 * @access  Privé (Admin)
 */
exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
    // La validation des query params (page, limit, sort, etc.) est gérée dans les routes
    let query;
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit', 'populate'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex|options)\b/g, match => `$${match}`);

    // Recherche initiale avec filtres (ex: ?artistId=...&isPublished=true)
    query = SmartLink.find(JSON.parse(queryStr));

    // Populate artist info si demandé (ex: ?populate=artist)
    if (req.query.populate === 'artist') {
         query = query.populate({
             path: 'artistId',
             select: 'name slug artistImageUrl' // Champs artiste utiles pour l'admin
         });
    }

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
        query = query.sort('-createdAt'); // Tri par date de création (plus récent) par défaut
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await SmartLink.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Exécution
    const smartLinks = await query;

    const pagination = {};
    if (endIndex < total) { pagination.next = { page: page + 1, limit }; }
    if (startIndex > 0) { pagination.prev = { page: page - 1, limit }; }

    res.status(200).json({
        success: true,
        count: smartLinks.length,
        total,
        pagination,
        data: smartLinks
    });
});

/**
 * @desc    Obtenir un SmartLink par son ID (pour admin)
 * @route   GET /api/smartlinks/:id (ou /api/v1/smartlinks/:id)
 * @access  Privé (Admin)
 */
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
    // La validation de l'ID (isMongoId) est faite dans les routes
    const smartLink = await SmartLink.findById(req.params.id).populate({
         path: 'artistId', select: 'name slug' // Peuple avec nom et slug de l'artiste
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
 * @desc    Mettre à jour un SmartLink par son ID
 * @route   PUT /api/smartlinks/:id (ou /api/v1/smartlinks/:id)
 * @access  Privé (Admin)
 */
exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
    // La validation de l'ID et du body est gérée dans les routes
    let smartLink = await SmartLink.findById(req.params.id);

    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
    }

    // La validation dans les routes empêche déjà la modification de artistId
    const updateData = { ...req.body };

    // Gérer la mise à jour du trackSlug si le trackTitle change
    if (req.body.trackTitle && req.body.trackTitle !== smartLink.trackTitle) {
        const newSlug = slugify(req.body.trackTitle, { lower: true, strict: true });
        // Vérifier l'unicité du nouveau slug POUR CET ARTISTE
        const existingSlug = await SmartLink.findOne({
            artistId: smartLink.artistId, // Important: vérifier pour le même artiste
            trackSlug: newSlug,
            _id: { $ne: smartLink._id } // Exclure le document actuel de la vérification
        });
        if (existingSlug) {
             return next(new ErrorResponse(`Un autre SmartLink de cet artiste utilise déjà le slug généré pour le titre "${req.body.trackTitle}". Changez légèrement le titre.`, 400));
        }
        updateData.trackSlug = newSlug; // Mettre à jour le slug dans les données
    }

    // Appliquer la mise à jour en utilisant findByIdAndUpdate
    // runValidators: true assure que les validations du schéma sont exécutées
    // new: true retourne le document mis à jour
    smartLink = await SmartLink.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: smartLink
    });
});

/**
 * @desc    Supprimer un SmartLink par son ID
 * @route   DELETE /api/smartlinks/:id (ou /api/v1/smartlinks/:id)
 * @access  Privé (Admin)
 */
exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
    // La validation de l'ID est faite dans les routes
    const smartLink = await SmartLink.findById(req.params.id);

    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
    }

    // Utiliser deleteOne sur l'instance trouvée
    await smartLink.deleteOne();

    res.status(200).json({
        success: true,
        data: {} // Pas de contenu à retourner
    });
});

// --- Contrôleurs pour les Routes Publiques ---

/**
 * @desc    Obtenir les SmartLinks publiés pour un artiste (par slug artiste)
 * @route   GET /api/smartlinks/by-artist/:artistSlug (ou /api/v1/...)
 * @access  Public
 */
exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
    // La validation du slug est faite dans les routes
    // 1. Trouver l'artiste par son slug pour obtenir son ID
    const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('_id');
    if (!artist) {
        // Retourner 404 si l'artiste n'existe pas
        return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
    }

    // 2. Trouver les SmartLinks publiés pour cet artistId
    const smartLinks = await SmartLink.find({
        artistId: artist._id,
        isPublished: true // Important: seulement les liens publiés
    })
    .sort({ releaseDate: -1, createdAt: -1 }) // Tri par date de sortie puis création
    .select('trackTitle trackSlug coverImageUrl releaseDate'); // Champs pour la liste publique

    // Il est normal de retourner un tableau vide si l'artiste existe mais n'a pas de smartlinks publiés
    res.status(200).json({
        success: true,
        count: smartLinks.length,
        data: smartLinks
    });
});

/**
 * @desc    Obtenir les détails d'un SmartLink spécifique publié (par slugs)
 * @route   GET /api/smartlinks/details/:artistSlug/:trackSlug (ou /api/v1/...)
 * @access  Public
 */
exports.getSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
    // La validation des slugs est faite dans les routes
    // 1. Trouver l'artiste par son slug
    const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('_id name artistImageUrl websiteUrl socialLinks'); // Récupère plus d'infos artiste pour la page
    if (!artist) {
        return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
    }

    // 2. Trouver le SmartLink spécifique publié
    const smartLink = await SmartLink.findOne({
        artistId: artist._id,
        trackSlug: req.params.trackSlug,
        isPublished: true // Important: seulement le lien publié
    })
    .select('-artistId -isPublished -__v'); // Exclure les champs non nécessaires pour le public

    if (!smartLink) {
        // Retourner 404 si le smartlink spécifique n'est pas trouvé ou publié
        return next(new ErrorResponse(`SmartLink non trouvé ou non publié pour ${req.params.artistSlug}/${req.params.trackSlug}`, 404));
    }

    // 3. Combiner les infos artiste et smartlink pour la réponse finale
    // On peut choisir les infos artiste spécifiques à inclure
    const responseData = {
        smartLink: smartLink.toObject(), // Les détails du smartlink
        artist: { // Les détails pertinents de l'artiste
            name: artist.name,
            slug: req.params.artistSlug, // On le connait déjà
            artistImageUrl: artist.artistImageUrl,
            websiteUrl: artist.websiteUrl,
            socialLinks: artist.socialLinks
        }
    };

    res.status(200).json({
        success: true,
        data: responseData
    });
});
```javascr
