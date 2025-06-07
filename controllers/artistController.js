// controllers/artistController.js (Updated)

const Artist = require("../models/Artist"); // Importer le modèle Artist
const asyncHandler = require("../middleware/asyncHandler"); // Utilitaire pour gérer les erreurs dans les fonctions async
const ErrorResponse = require("../utils/errorResponse"); // Utilitaire pour standardiser les erreurs

/**
 * @desc    Créer un nouvel artiste
 * @route   POST /api/v1/artists
 * @access  Private (Admin)
 */
exports.createArtist = asyncHandler(async (req, res) => {
  // Extraire les champs pertinents du body, y compris les nouveaux
  const { name, bio, artistImageUrl, websiteUrl, socialLinks } = req.body;

  // Créer l'objet artiste avec les champs extraits
  // Mongoose ignorera les champs undefined si non fournis dans la requête
  const artistData = {
    name,
    bio,
    artistImageUrl,
    websiteUrl,
    socialLinks
  };

  const artist = await Artist.create(artistData);

  res.status(201).json({
    success: true,
    data: artist
  });
});

/**
 * @desc    Récupérer tous les artistes
 * @route   GET /api/v1/artists
 * @access  Public or Private (Admin)
 */
exports.getAllArtists = asyncHandler(async (req, res) => {
  // TODO: Implémenter la pagination et le filtrage/recherche comme dans smartLinkController si nécessaire pour l'admin
  const artists = await Artist.find().sort({ name: 1 }); // Tri par nom par défaut

  res.status(200).json({
    success: true,
    count: artists.length,
    data: artists
  });
});

/**
 * @desc    Récupérer un artiste par son slug
 * @route   GET /api/v1/artists/:artistSlug
 * @access  Public or Private (Admin)
 */
exports.getArtistBySlug = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findOne({ slug: req.params.artistSlug });

  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }

  res.status(200).json({
    success: true,
    data: artist
  });
});

/**
 * @desc    Mettre à jour un artiste par son slug
 * @route   PUT /api/v1/artists/:artistSlug
 * @access  Private (Admin)
 */
exports.updateArtist = asyncHandler(async (req, res, next) => {
  let artist = await Artist.findOne({ slug: req.params.artistSlug });

  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }

  // Mettre à jour les champs fournis dans req.body
  // Note: Cette approche (findOne puis save) assure que les hooks Mongoose (comme la génération de slug si le nom change) sont exécutés.
  const allowedUpdates = ["name", "bio", "artistImageUrl", "websiteUrl", "socialLinks"];

  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      // Pour socialLinks, on remplace entièrement le tableau
      artist[key] = req.body[key];
    }
  });

  // Sauvegarder les modifications (déclenchera le hook pre('save') si name change)
  const updatedArtist = await artist.save();

  res.status(200).json({
    success: true,
    data: updatedArtist
  });
});

/**
 * @desc    Supprimer un artiste par son slug
 * @route   DELETE /api/v1/artists/:artistSlug
 * @access  Private (Admin)
 */
exports.deleteArtist = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findOne({ slug: req.params.artistSlug });

  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }

  // Optionnel: Suppression en cascade des SmartLinks associés
  // await SmartLink.deleteMany({ artistId: artist._id });

  // Suppression de l'artiste
  await artist.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

