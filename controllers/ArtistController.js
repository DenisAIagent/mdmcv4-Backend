// controllers/artistController.js

const Artist = require('../models/Artist'); // Importer le modèle Artist
const SmartLink = require('../models/SmartLink'); // Importer SmartLink pour la suppression en cascade (optionnel)
const asyncHandler = require('../middleware/asyncHandler'); // Utilitaire pour gérer les erreurs dans les fonctions async (voir note)
const ErrorResponse = require('../utils/errorResponse'); // Utilitaire pour standardiser les erreurs (voir note)

/**
 * @desc    Créer un nouvel artiste
 * @route   POST /api/v1/artists
 * @access  Private (Admin) - Logique d'accès à ajouter via middleware plus tard
 */
exports.createArtist = asyncHandler(async (req, res, next) => {
  // Le body de la requête contient les données (name, bio, artistImageUrl)
  const artist = await Artist.create(req.body);

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
exports.getAllArtists = asyncHandler(async (req, res, next) => {
  // Optionnel: Ajoutez .sort() ou .select() selon vos besoins
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
    // Si aucun artiste n'est trouvé avec ce slug
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
  Object.keys(req.body).forEach(key => {
      // S'assurer que seuls les champs modifiables sont mis à jour
      if (key === 'name' || key === 'bio' || key === 'artistImageUrl') {
         artist[key] = req.body[key];
      }
  });

  // Sauvegarder les modifications (déclenchera le hook pre('save'))
  const updatedArtist = await artist.save();


  /* // Alternative: findOneAndUpdate (plus direct mais ne lance pas les hooks 'save' par défaut)
  const artist = await Artist.findOneAndUpdate(
    { slug: req.params.artistSlug },
    req.body,
    {
      new: true, // Retourne le document mis à jour
      runValidators: true // Exécute les validateurs du schéma Mongoose
    }
  );
  */

  res.status(200).json({
    success: true,
    data: updatedArtist // Ou 'artist' si vous utilisez findOneAndUpdate
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

  // --- Considération Importante : Que faire des SmartLinks associés ? ---
  // Option 1: Supprimer l'artiste uniquement (laisser les SmartLinks orphelins ou les gérer ailleurs)
  // Option 2: Supprimer aussi tous les SmartLinks liés à cet artiste (suppression en cascade)

  // // Pour l'Option 2 (Suppression en cascade - Décommentez si nécessaire) :
  // await SmartLink.deleteMany({ artistId: artist._id });
  // console.log(`SmartLinks de l'artiste ${artist.name} supprimés.`);

  // Suppression de l'artiste
  await artist.deleteOne(); // Utiliser deleteOne() sur l'instance trouvée

  res.status(200).json({ // ou 204 sans contenu: res.status(204).send();
    success: true,
    data: {} // ou pas de data si 204
  });
});