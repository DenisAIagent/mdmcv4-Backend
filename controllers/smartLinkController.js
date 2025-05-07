// backend/controllers/smartLinkController.js
const SmartLink = require('../models/SmartLink'); // Adaptez le chemin vers votre modèle SmartLink.js
const Artist = require('../models/Artist');     // Adaptez le chemin vers votre modèle Artist.js
const asyncHandler = require('../middleware/asyncHandler'); // Votre wrapper pour les erreurs asynchrones
const ErrorResponse = require('../utils/errorResponse');  // Votre classe utilitaire pour les erreurs HTTP
const slugify = require('slugify'); // Assurez-vous qu'il est installé et requis

// --- Fonction utilitaire interne pour générer un slug unique ---
/**
 * Génère un slug unique pour un SmartLink pour un artiste donné.
 * Si le slug initial existe déjà pour cet artiste, ajoute un suffixe numérique.
 * @param {string} baseTitle - Le titre du morceau pour générer le slug.
 * @param {mongoose.Types.ObjectId} artistId - L'ID de l'artiste.
 * @param {string} [proposedSlug] - Un slug proposé (optionnel, peut venir du formulaire).
 * @param {mongoose.Types.ObjectId} [excludeId] - ID d'un SmartLink à exclure de la vérification (utile en cas de mise à jour).
 * @returns {Promise<string>} Le slug unique généré.
 */
const generateUniqueTrackSlug = async (baseTitle, artistId, proposedSlug = null, excludeId = null) => {
  // Utiliser le slug proposé s'il existe et est valide, sinon générer à partir du titre
  let baseSlugAttempt = proposedSlug
    ? slugify(proposedSlug, { lower: true, strict: true, remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g })
    : slugify(baseTitle, { lower: true, strict: true, remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g });

  if (!baseSlugAttempt) { // Si après slugify c'est vide (ex: titre avec que des caractères spéciaux)
    baseSlugAttempt = 'smartlink'; // Un fallback
  }

  let slug = baseSlugAttempt;
  let count = 0;
  let existingSmartLink = null;

  // Boucle pour trouver un slug unique
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { artistId, slug };
    if (excludeId) {
      query._id = { $ne: excludeId }; // Exclure le document actuel lors d'une mise à jour
    }
    existingSmartLink = await SmartLink.findOne(query);
    if (!existingSmartLink) {
      break; // Slug unique trouvé
    }
    count++;
    slug = `${baseSlugAttempt}-${count}`;
  }
  return slug;
};


// --- Fonctions du Contrôleur ---

// @desc    Créer un nouveau SmartLink
// @route   POST /api/v1/smartlinks
// @access  Private (Admin)
exports.createSmartLink = asyncHandler(async (req, res, next) => {
  const { artistId, trackTitle, slug: proposedSlugByUser, ...otherData } = req.body;

  // Vérifier si l'artiste existe
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec l'ID ${artistId}`, 404));
  }

  // Générer un slug unique pour ce titre de morceau et cet artiste
  // Le modèle SmartLink.js a un hook pre-save qui peut générer un slug de base
  // s'il n'est pas fourni, mais ici on s'assure de son unicité *par artiste*.
  const finalSlug = await generateUniqueTrackSlug(trackTitle, artistId, proposedSlugByUser);

  const smartLinkData = {
    ...otherData, // Inclut releaseDate, coverImageUrl, description, etc.
    artistId,
    trackTitle,
    slug: finalSlug, // Utiliser le slug finalisé unique
    // isPublished: req.body.isPublished || false, // Déjà dans otherData ou géré par défaut du modèle
    // userId: req.user.id, // Si vous gérez l'authentification et la liaison à l'utilisateur
  };

  const smartLink = await SmartLink.create(smartLinkData);

  res.status(201).json({ success: true, data: smartLink });
});


// @desc    Récupérer tous les SmartLinks (pour l'admin)
// @route   GET /api/v1/smartlinks
// @access  Private (Admin)
// Votre fonction existante est déjà très bien avec la pagination, le tri, etc.
// Je la conserve avec une petite adaptation pour la sélection des champs de l'artiste.
exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
  const reqQuery = { ...req.query };
  const removeFields = ['select', 'sort', 'page', 'limit', 'populate'];
  removeFields.forEach(param => delete reqQuery[param]);

  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex|options)\b/g, match => `$${match}`);

  let query = SmartLink.find(JSON.parse(queryStr));

  // Modification pour s'assurer que le populate fonctionne bien et sélectionne les bons champs
  if (req.query.populate === 'artist' || true) { // On peuple toujours l'artiste pour la liste admin
    query = query.populate({
      path: 'artistId',
      select: 'name slug artistImageUrl' // Champs nécessaires pour la liste admin
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
    query = query.sort('-createdAt'); // Tri par défaut
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await SmartLink.countDocuments(JSON.parse(queryStr)); // S'assurer que le filtre est le même

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
// @route   GET /api/v1/smartlinks/:id
// @access  Private (Admin)
exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id).populate({
    path: 'artistId',
    select: 'name slug _id' // Assurez-vous de retourner l'_id pour la pré-sélection dans le formulaire
  });

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: smartLink });
});


// @desc    Mettre à jour un SmartLink par son ID
// @route   PUT /api/v1/smartlinks/:id
// @access  Private (Admin)
exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
  let smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Si vous avez un système d'utilisateurs et de droits, vérifiez ici si l'utilisateur a le droit de modifier.
  // if (smartLink.userId.toString() !== req.user.id && req.user.role !== 'admin') {
  //   return next(new ErrorResponse(`Utilisateur non autorisé à modifier ce SmartLink`, 403));
  // }

  const updateData = { ...req.body };

  // Gestion de la mise à jour du slug si trackTitle ou le slug proposé change
  // Ou si l'artistId change (ce cas est plus complexe, car un SmartLink ne change généralement pas d'artiste)
  // Pour simplifier, on assume que artistId ne change pas lors d'une mise à jour. Si c'est le cas, la logique serait plus profonde.
  const newTrackTitle = req.body.trackTitle;
  const proposedSlugByUser = req.body.slug;

  if (
    (newTrackTitle && newTrackTitle !== smartLink.trackTitle) ||
    (proposedSlugByUser && proposedSlugByUser !== smartLink.slug)
  ) {
    const titleForSlug = newTrackTitle || smartLink.trackTitle;
    // Si un nouveau slug est proposé, on l'utilise comme base, sinon on utilise le nouveau titre.
    const slugToGenerateFrom = (proposedSlugByUser && proposedSlugByUser !== smartLink.slug) 
                               ? proposedSlugByUser 
                               : titleForSlug;

    updateData.slug = await generateUniqueTrackSlug(titleForSlug, smartLink.artistId, slugToGenerateFrom, smartLink._id);
  } else if (req.body.hasOwnProperty('slug') && req.body.slug === smartLink.slug) {
    // Si le slug est explicitement fourni mais identique à l'existant, on le garde.
    // Si le slug n'est pas dans req.body, on ne touche pas au slug existant (sauf si trackTitle change).
    updateData.slug = smartLink.slug;
  }


  // Nettoyer les platformLinks vides avant de sauvegarder
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
// @route   DELETE /api/v1/smartlinks/:id
// @access  Private (Admin)
exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
  }

  // Si vous avez un système d'utilisateurs et de droits, vérifiez ici.
  // TODO: Gérer la suppression de l'image sur Cloudinary si elle est stockée là.

  await smartLink.deleteOne();
  res.status(200).json({ success: true, message: "SmartLink supprimé avec succès." });
});


// @desc    Récupérer les SmartLinks publiés d'un artiste par son slug (pour une page artiste publique par ex.)
// @route   GET /api/v1/smartlinks/artist/:artistSlug
// @access  Public
exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findOne({ slug: req.params.artistSlug }).select('_id name'); // Sélectionner aussi le nom pour affichage
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }

  const smartLinks = await SmartLink.find({
    artistId: artist._id,
    isPublished: true
  })
  .sort({ releaseDate: -1, createdAt: -1 })
  .select('trackTitle slug coverImageUrl releaseDate artistId'); // S'assurer que trackSlug est bien 'slug' dans le modèle

  res.status(200).json({
    success: true,
    count: smartLinks.length,
    artistName: artist.name, // Ajouter le nom de l'artiste à la réponse
    data: smartLinks
  });
});


// @desc    Récupérer un SmartLink public par ses slugs (artistSlug et trackSlug/slug du SmartLink)
// @route   GET /api/v1/smartlinks/public/:artistSlug/:trackSlug
// @access  Public
exports.getPublicSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
  const { artistSlug, trackSlug } = req.params;

  const artist = await Artist.findOne({ slug: artistSlug })
                             .select('name slug artistImageUrl websiteUrl socialLinks'); // Champs de l'artiste à retourner
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${artistSlug}`, 404));
  }

  const smartLink = await SmartLink.findOne({
    artistId: artist._id,
    slug: trackSlug, // Assurez-vous que ce champ s'appelle bien 'slug' dans votre modèle SmartLink
    isPublished: true
  });
  // Ne pas sélectionner '-artistId' ici car l'objet artiste est déjà récupéré séparément.
  // Plutôt, ne pas peupler artistId et le construire manuellement, ou le peupler.

  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé ou non publié pour ${artistSlug}/${trackSlug}`, 404));
  }

  // Incrémenter viewCount (anciennement votre clickCount)
  smartLink.viewCount = (smartLink.viewCount || 0) + 1;
  await smartLink.save({ validateBeforeSave: false }); // Sauvegarder sans revalider tout le document

  // Préparer la réponse avec la structure attendue par le frontend
  const responseData = {
    smartLink: smartLink.toObject(), // Convertir en objet simple pour éviter les problèmes avec les getters/setters Mongoose
    artist: { // Renvoyer l'objet artiste complet récupéré
      _id: artist._id, // Important si le frontend en a besoin
      name: artist.name,
      slug: artist.slug, // Le slug de l'artiste
      artistImageUrl: artist.artistImageUrl,
      websiteUrl: artist.websiteUrl,
      socialLinks: artist.socialLinks
    }
  };
  // Enlever artistId du smartLink dans la réponse si l'objet artist est déjà fourni
  delete responseData.smartLink.artistId;


  res.status(200).json({ success: true, data: responseData });
});


// @desc    Logguer un clic sur un lien de plateforme d'un SmartLink (pour le compteur platformClickCount)
// @route   POST /api/v1/smartlinks/:id/log-platform-click
// @access  Public (car le clic vient de la page publique)
exports.logPlatformClick = asyncHandler(async (req, res, next) => {
    const smartLink = await SmartLink.findById(req.params.id);

    if (!smartLink) {
        return next(new ErrorResponse(`SmartLink non trouvé avec l'ID ${req.params.id}`, 404));
    }

    smartLink.platformClickCount = (smartLink.platformClickCount || 0) + 1;

    // Optionnel: log détaillé par plateforme si le frontend envoie 'platformName' dans req.body
    // const { platformName } = req.body;
    // if (platformName && smartLink.platformClicksDetailed) {
    //   const currentPlatformClicks = smartLink.platformClicksDetailed.get(platformName) || 0;
    //   smartLink.platformClicksDetailed.set(platformName, currentPlatformClicks + 1);
    // }

    await smartLink.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: "Clic sur plateforme enregistré." });
});
