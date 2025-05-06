// backend/controllers/smartLinkController.js
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist'); // Nécessaire pour valider l'existence de l'artiste
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Créer un nouveau SmartLink
 * @route   POST /api/smartlinks
 * @access  Privé (Admin)
 */
exports.createSmartLink = asyncHandler(async (req, res, next) => {
    // La validation express-validator est gérée dans les routes
    const { artistId, trackTitle, releaseDate, coverImageUrl, description, platformLinks, trackingIds, isPublished } = req.body;

    // 1. Vérifier que l'artiste référencé existe
    const artist = await Artist.findById(artistId);
    if (!artist) {
        return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));
    }

    // 2. Vérifier l'unicité du slug (le hook pre-save va générer le slug)
    // Le schéma a déjà un index unique { artistId: 1, trackSlug: 1 },
    // donc la base de données lèvera une erreur si la combinaison existe déjà.
    // On pourrait ajouter une vérification préalable ici si on veut un message plus précis.

    // 3. Créer le SmartLink
    const smartLink = await SmartLink.create({
        artistId, // ID de l'artiste existant
        trackTitle,
        releaseDate,
        coverImageUrl, // URL Cloudinary
        description,
        platformLinks,
        trackingIds,
        isPublished
        // trackSlug sera généré par le hook pre-save
    });

    res.status(201).json({
        success: true,
        data: smartLink
    });
});

/**
 * @desc    Obtenir tous les SmartLinks (avec filtres/pagination pour admin)
 * @route   GET /api/smartlinks
 * @access  Privé (Admin)
 */
exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
    // La validation des query params est gérée dans les routes
    let query;
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex|options)\b/g, match => `$${match}`);

    // Recherche initiale avec filtres (ex: ?artistId=...&isPublished=true)
    query = SmartLink.find(JSON.parse(queryStr));

    // Populate artist info (optionnel mais utile pour l'admin)
    // Si vous voulez les infos de l'artiste dans la liste
    if (req.query.populate === 'artist') { // Exemple: ?populate=artist
         query = query.populate({ path: 'artistId', select: 'name slug artistImageUrl' }); // Sélectionne les champs artiste utiles
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
        query = query.sort('-createdAt'); // Tri par date de création par défaut
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
 * @desc    Obtenir un SmartLink par son ID
 * @route   GET /api/smartlinks/:id
 * @access  Privé (Admin)
 */
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
    // La validation de l'ID est faite dans les routes
    const smartLink = await SmartLink.findById(req.params.id).populate({
         path: 'artistId', select: 'name slug' // Récupère nom et slug de l'artiste associé
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
 * @route   PUT /api/smartlinks/:id
 * @access  Privé (Admin)
 */
exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
    // La validation de l'ID et du body est faite dans les routes
    let smartLink = await SmartLink.findById(req.params.id);

    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
    }

    // Empêcher la modification de l'artistId (comme défini dans les règles de validation)
    if (req.body.artistId && req.body.artistId !== smartLink.artistId.toString()) {
         return next(new ErrorResponse("La modification de l'artiste associé n'est pas autorisée via cette route.", 400));
    }

    const updateData = { ...req.body };

    // Gérer la mise à jour du trackSlug si le trackTitle change
    if (req.body.trackTitle && req.body.trackTitle !== smartLink.trackTitle) {
        const newSlug = slugify(req.body.trackTitle, { lower: true, strict: true });
        // Vérifier l'unicité du nouveau slug POUR CET ARTISTE
        const existingSlug = await SmartLink.findOne({
            artistId: smartLink.artistId,
            trackSlug: newSlug,
            _id: { $ne: smartLink._id } // Exclure le document actuel
        });
        if (existingSlug) {
             return next(new ErrorResponse(`Un autre SmartLink de cet artiste utilise déjà le slug généré pour le titre "${req.body.trackTitle}".`, 400));
        }
        updateData.trackSlug = newSlug;
    }

    // Appliquer la mise à jour
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
 * @route   DELETE /api/smartlinks/:id
 * @access  Privé (Admin)
 */
exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
    // La validation de l'ID est faite dans les routes
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


// --- Contrôleurs pour les Routes Publiques ---

/**
 * @desc    Obtenir les SmartLinks publiés pour un artiste (par slug artiste)
 * @route   GET /api/smartlinks/by-artist/:artistSlug
 * @access  Public
 */
exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
    // 1. Trouver l'artiste par son slug pour obtenir son ID
    const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('_id'); // Sélectionne seulement l'ID
    if (!artist) {
        return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
    }

    // 2. Trouver les SmartLinks publiés pour cet artiste ID
    const smartLinks = await SmartLink.find({
        artistId: artist._id,
        isPublished: true // Ne retourne que les liens publiés
    })
    .sort({ releaseDate: -1, createdAt: -1 }) // Trie par date de sortie (plus récent d'abord) puis par création
    .select('trackTitle trackSlug coverImageUrl releaseDate'); // Sélectionne les champs utiles pour la liste

    res.status(200).json({
        success: true,
        count: smartLinks.length,
        data: smartLinks
    });
});

/**
 * @desc    Obtenir les détails d'un SmartLink spécifique publié (par slugs)
 * @route   GET /api/smartlinks/details/:artistSlug/:trackSlug
 * @access  Public
 */
exports.getSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
    // 1. Trouver l'artiste par son slug pour obtenir son ID
    const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('_id name artistImageUrl'); // Récupère aussi le nom/image pour la page
    if (!artist) {
        return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
    }

    // 2. Trouver le SmartLink spécifique par artistId et trackSlug
    const smartLink = await SmartLink.findOne({
        artistId: artist._id,
        trackSlug: req.params.trackSlug,
        isPublished: true // Ne retourne que s'il est publié
    })
    // Exclure l'ID de l'artiste car on l'a déjà, et l'état de publication
    .select('-artistId -isPublished');

    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé pour ${req.params.artistSlug}/${req.params.trackSlug}`, 404));
    }

    // 3. Combiner les infos artiste et smartlink pour la réponse
    const responseData = {
        ...smartLink.toObject(), // Convertit le document Mongoose en objet simple
        artistName: artist.name,
        artistImageUrl: artist.artistImageUrl // Ajoute l'image de l'artiste si besoin sur la page smartlink
    };

    res.status(200).json({
        success: true,
        data: responseData
    });
});
```javascr
