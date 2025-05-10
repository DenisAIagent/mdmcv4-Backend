// controllers/artistController.js (Updated)

const Artist = require("../models/Artist"); // Importer le modèle Artist
const asyncHandler = require("../middleware/asyncHandler"); // Utilitaire pour gérer les erreurs dans les fonctions async
const ErrorResponse = require("../utils/errorResponse"); // Utilitaire pour standardiser les erreurs

/**
 * @desc    Obtenir tous les artistes
 * @route   GET /api/v1/artists
 * @access  Public
 */
exports.getArtists = asyncHandler(async (req, res, next) => {
  const artists = await Artist.find();
  
  res.status(200).json({
    success: true,
    count: artists.length,
    data: artists
  });
});

/**
 * @desc    Obtenir un artiste par son slug
 * @route   GET /api/v1/artists/:artistSlug
 * @access  Public
 */
exports.getArtistBySlug = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findOne({ slug: req.params.artistSlug });

  if (!artist) {
    return next(
      new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: artist
  });
});

/**
 * @desc    Créer un artiste
 * @route   POST /api/v1/artists
 * @access  Private/Admin
 */
exports.createArtist = asyncHandler(async (req, res, next) => {
  const artist = await Artist.create(req.body);

  res.status(201).json({
    success: true,
    data: artist
  });
});

/**
 * @desc    Mettre à jour un artiste
 * @route   PUT /api/v1/artists/:id
 * @access  Private/Admin
 */
exports.updateArtist = asyncHandler(async (req, res, next) => {
  let artist = await Artist.findById(req.params.id);

  if (!artist) {
    return next(
      new ErrorResponse(`Artiste non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  artist = await Artist.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: artist
  });
});

/**
 * @desc    Supprimer un artiste
 * @route   DELETE /api/v1/artists/:id
 * @access  Private/Admin
 */
exports.deleteArtist = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findById(req.params.id);

  if (!artist) {
    return next(
      new ErrorResponse(`Artiste non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  await artist.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

