// controllers/smartLinkController.js

const SmartLink = require('../models/SmartLink'); // Importer le modèle SmartLink
const Artist = require('../models/Artist'); // Importer le modèle Artist (pour les recherches par slug)
const asyncHandler = require("../middleware/asyncHandler"); // Utilitaire pour gérer les erreurs async
const ErrorResponse = require('../utils/errorResponse'); // Utilitaire pour les erreurs HTTP

/**
 * @desc    Créer un nouveau SmartLink
 * @route   POST /api/smartlinks
 * @access  Private (Admin)
 */
exports.createSmartLink = asyncHandler(async (req, res, next) => {
  // L'artistId est requis et validé par express-validator dans les routes
  // Vérifier si l'artiste existe (sécurité supplémentaire)
  const artistExists = await Artist.findById(req.body.artistId);
  if (!artistExists) {
    return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${req.body.artistId}`, 404));
  }

  // Le hook pre('save') dans SmartLink.js devrait gérer le slug du morceau
  const smartLink = await SmartLink.create(req.body);

  res.status(201).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Récupérer tous les SmartLinks (avec options de filtrage/pagination)
 * @route   GET /api/smartlinks
 * @access  Private (Admin)
 */
exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
  // Implémentation basique - Peut être étendue avec req.query pour filtrage, tri, pagination
  // Voir l'exemple dans un Advanced Query Middleware si besoin plus tard
  const smartLinks = await SmartLink.find()
                                  .populate('artistId', 'name slug') // Populer nom et slug de l'artiste
                                  .sort({ createdAt: -1 }); // Trier par défaut

  res.status(200).json({
    success: true,
    count: smartLinks.length,
    // Ajouter la pagination ici si implémentée
    data: smartLinks
  });
});

/**
 * @desc    Récupérer un SmartLink par son ID
 * @route   GET /api/smartlinks/:id
 * @access  Private (Admin)
 */
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id)
                                   .populate('artistId', 'name slug'); // Populer artiste

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
 * @access  Private (Admin)
 */
exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
  // Assurez-vous que artistId n'est pas dans req.body (déjà géré par la validation)
  if (req.body.artistId) {
     delete req.body.artistId;
  }
  // Le hook pre('save') gérera la mise à jour du slug si trackTitle change (si findByIdAndUpdate déclenche les hooks, sinon il faut faire findById + save)

  const smartLink = await SmartLink.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Retourne le document modifié
    runValidators: true // Exécute les validateurs Mongoose
  });

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Re-populer l'artiste après mise à jour si nécessaire pour la réponse
  await smartLink.populate('artistId', 'name slug');

  res.status(200).json({
    success: true,
    data: smartLink
  });
});

/**
 * @desc    Supprimer un SmartLink par son ID
 * @route   DELETE /api/smartlinks/:id
 * @access  Private (Admin)
 */
exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id); // Utiliser findById pour vérifier l'existence d'abord

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  await smartLink.deleteOne(); // Utiliser deleteOne sur l'instance

  res.status(200).json({
    success: true,
    data: {}
  });
});

/**
 * @desc    Récupérer les SmartLinks pour un artiste spécifique via son slug
 * @route   GET /api/smartlinks/by-artist/:artistSlug
 * @access  Public
 */
exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
  // 1. Trouver l'artiste par slug pour obtenir son ID
  const artist = await Artist.findOne({ slug: req.params.artistSlug });
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }

  // 2. Trouver les SmartLinks associés à cet artistId
  const smartLinks = await SmartLink.find({ artistId: artist._id, isPublished: true }) // Ne retourne que les publiés
                                  .populate('artistId', 'name slug') // Populer artiste (même si on l'a déjà)
                                  .sort({ releaseDate: -1, createdAt: -1 }); // Trier par date de sortie puis création

  res.status(200).json({
    success: true,
    count: smartLinks.length,
    data: smartLinks
  });
});

/**
 * @desc    Récupérer un SmartLink spécifique par slug d'artiste et slug de morceau
 * @route   GET /api/smartlinks/details/:artistSlug/:trackSlug
 * @access  Public
 */
exports.getSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
  // 1. Trouver l'artiste par slug pour obtenir son ID
  const artist = await Artist.findOne({ slug: req.params.artistSlug });
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }

  // 2. Trouver le SmartLink correspondant à l'artiste ET au slug du morceau
  const smartLink = await SmartLink.findOne({
    artistId: artist._id,
    trackSlug: req.params.trackSlug,
    isPublished: true // Assurer qu'il est publié pour l'accès public
  }).populate('artistId', 'name slug websiteUrl socialLinks artistImageUrl'); // Populer toutes les infos artiste nécessaires

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé pour ${req.params.artistSlug}/${req.params.trackSlug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: smartLink
  });
});
