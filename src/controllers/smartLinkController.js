// controllers/smartLinkController.js
const SmartLink = require("../models/SmartLink");
const Artist = require("../models/Artist");
const asyncHandler = require("../middleware/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");
const slugify = require("slugify");
const { validationResult } = require("express-validator");
const NodeCache = require("node-cache");
const mongoose = require("mongoose");
const axios = require("axios");

// Cache pour les requêtes fréquentes (TTL: 5 minutes)
const cache = new NodeCache({ stdTTL: 300 });

// --- Fonction utilitaire interne pour générer un slug unique ---
const generateUniqueTrackSlug = async (
  baseTitle,
  artistId,
  proposedSlug = null,
  excludeId = null
) => {
  let baseSlugAttempt =
    proposedSlug
      ? slugify(proposedSlug, { lower: true, strict: true, remove: /[*+~.()\"!:@#%$^&={}|[\]\\;\/?]/g })
      : slugify(baseTitle, { lower: true, strict: true, remove: /[*+~.()\"!:@#%$^&={}|[\]\\;\/?]/g });

  if (!baseSlugAttempt) {
    baseSlugAttempt = "smartlink";
  }

  let slug = baseSlugAttempt;
  let count = 0;
  const maxAttempts = 100; // Prévenir les boucles infinies

  while (count < maxAttempts) {
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

  if (count >= maxAttempts) {
    throw new Error("Impossible de générer un slug unique après plusieurs tentatives");
  }

  return slug;
};

exports.createSmartLink = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }
  const { artistId, trackTitle, slug: proposedSlugByUser, platformLinks, ...otherData } = req.body;
  const artist = await Artist.findById(artistId);
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec l_ID ${artistId}`, 404));
  }
  if (platformLinks && Array.isArray(platformLinks)) {
    for (const link of platformLinks) {
      if (!link.platform || !link.url) {
        return next(new ErrorResponse("Chaque lien de plateforme doit avoir un nom de plateforme et une URL", 400));
      }
      try {
        new URL(link.url);
      } catch (e) {
        return next(new ErrorResponse(`URL invalide pour la plateforme ${link.platform}`, 400));
      }
    }
  }
  const finalSlug = await generateUniqueTrackSlug(trackTitle, artistId, proposedSlugByUser);
  const smartLinkData = {
    ...otherData,
    artistId,
    trackTitle,
    slug: finalSlug,
    platformLinks: platformLinks || [],
    createdBy: req.user.id,
    updatedBy: req.user.id,
  };
  const smartLink = await SmartLink.create(smartLinkData);
  cache.del(`artist_${artistId}_smartlinks`);
  res.status(201).json({
    success: true,
    data: smartLink,
  });
});

exports.getAllSmartLinks = asyncHandler(async (req, res, next) => {
  const cacheKey = `smartlinks_${JSON.stringify(req.query)}`;
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }
  const reqQuery = { ...req.query };
  const removeFields = ["select", "sort", "page", "limit", "populate"];
  removeFields.forEach((param) => delete reqQuery[param]);
  if (reqQuery.artistId && !mongoose.Types.ObjectId.isValid(reqQuery.artistId)) {
    return next(new ErrorResponse("ID d_artiste invalide", 400));
  }
  let queryStr = JSON.stringify(reqQuery);
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in|regex|options)\b/g, (match) => `$${match}`);
  let query = SmartLink.find(JSON.parse(queryStr));
  query = query.populate({
    path: "artistId",
    select: "name slug artistImageUrl",
  });
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const maxLimit = 100;
  const finalLimit = Math.min(limit, maxLimit);
  const startIndex = (page - 1) * finalLimit;
  const endIndex = page * finalLimit;
  const total = await SmartLink.countDocuments(JSON.parse(queryStr));
  query = query.skip(startIndex).limit(finalLimit);
  const smartLinks = await query;
  const pagination = {
    page,
    limit: finalLimit,
    totalPages: Math.ceil(total / finalLimit),
    totalItems: total,
  };
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit: finalLimit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit: finalLimit };
  }
  const response = {
    success: true,
    count: smartLinks.length,
    pagination,
    data: smartLinks,
  };
  cache.set(cacheKey, response);
  res.status(200).json(response);
});

exports.getSmartLinksByArtistSlug = asyncHandler(async (req, res, next) => {
  const artist = await Artist.findOne({ slug: req.params.artistSlug });
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${req.params.artistSlug}`, 404));
  }
  const smartLinks = await SmartLink.find({ artistId: artist._id }).sort({
    releaseDate: -1,
    createdAt: -1,
  });
  res.status(200).json({
    success: true,
    count: smartLinks.length,
    artist: {
      _id: artist._id,
      name: artist.name,
      slug: artist.slug,
      artistImageUrl: artist.artistImageUrl,
      bio: artist.bio,
    },
    data: smartLinks,
  });
});

exports.getSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
  const { artistSlug, trackSlug } = req.params;
  const artist = await Artist.findOne({ slug: artistSlug });
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${artistSlug}`, 404));
  }
  const smartLink = await SmartLink.findOne({
    artistId: artist._id,
    trackSlug: trackSlug, 
  }).populate({
    path: "artistId",
    select: "name slug artistImageUrl bio",
  });
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec le slug ${trackSlug} pour l_artiste ${artistSlug}`, 404));
  }
  res.status(200).json({
    success: true,
    data: smartLink,
  });
});

exports.getSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id).populate({
    path: "artistId",
    select: "name slug artistImageUrl",
  });
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l_ID ${req.params.id}`, 404));
  }
  res.status(200).json({
    success: true,
    data: smartLink,
  });
});

exports.updateSmartLinkById = asyncHandler(async (req, res, next) => {
  const { trackTitle, slug: proposedSlugByUser, platformLinks, ...otherData } = req.body;
  let smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l_ID ${req.params.id}`, 404));
  }
  if (platformLinks && Array.isArray(platformLinks)) {
    for (const link of platformLinks) {
      if (!link.platform || !link.url) {
        return next(new ErrorResponse("Chaque lien de plateforme doit avoir un nom de plateforme et une URL", 400));
      }
      try {
        new URL(link.url);
      } catch (e) {
        return next(new ErrorResponse(`URL invalide pour la plateforme ${link.platform}`, 400));
      }
    }
  }
  if (trackTitle && trackTitle !== smartLink.trackTitle) {
    otherData.slug = await generateUniqueTrackSlug(
      trackTitle,
      smartLink.artistId,
      proposedSlugByUser,
      req.params.id
    );
  }
  smartLink = await SmartLink.findByIdAndUpdate(
    req.params.id,
    {
      ...otherData,
      trackTitle: trackTitle || smartLink.trackTitle,
      platformLinks: platformLinks || smartLink.platformLinks,
      updatedBy: req.user.id,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate({
    path: "artistId",
    select: "name slug artistImageUrl",
  });
  cache.del(`artist_${smartLink.artistId}_smartlinks`);
  cache.del(`smartlinks_${JSON.stringify(req.query)}`);
  res.status(200).json({
    success: true,
    data: smartLink,
  });
});

exports.deleteSmartLinkById = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l_ID ${req.params.id}`, 404));
  }
  await smartLink.deleteOne();
  cache.del(`artist_${smartLink.artistId}_smartlinks`);
  cache.del(`smartlinks_${JSON.stringify(req.query)}`);
  res.status(200).json({
    success: true,
    data: {},
  });
});

exports.getPublicSmartLinkBySlugs = asyncHandler(async (req, res, next) => {
  const { artistSlug, trackSlug } = req.params;
  const artist = await Artist.findOne({ slug: artistSlug });
  if (!artist) {
    return next(new ErrorResponse(`Artiste non trouvé avec le slug ${artistSlug}`, 404));
  }
  const smartLink = await SmartLink.findOne({
    artistId: artist._id,
    slug: trackSlug,
    isPublished: true,
  }).populate({
    path: "artistId",
    select: "name slug artistImageUrl",
  });
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé pour l_artiste ${artistSlug} et le morceau ${trackSlug}`, 404));
  }
  res.status(200).json({
    success: true,
    data: smartLink,
  });
});

exports.logPlatformClick = asyncHandler(async (req, res, next) => {
  const smartLink = await SmartLink.findById(req.params.id);
  if (!smartLink) {
    return next(new ErrorResponse(`SmartLink non trouvé avec l_ID ${req.params.id}`, 404));
  }
  smartLink.platformClickCount = (smartLink.platformClickCount || 0) + 1;
  await smartLink.save();
  res.status(200).json({
    success: true,
    data: {
      platformClickCount: smartLink.platformClickCount,
    },
  });
});

exports.fetchPlatformLinks = asyncHandler(async (req, res, next) => {
  console.log("Backend: /fetch-platform-links a été appelé."); // Route pour récupérer les liens de plateformes à partir d'un ISRC, UPC ou URL source
router.post("/fetch-platform-links", protect, authorize("admin"), async (req, res, next) => {
  console.log("Backend: /fetch-platform-links a été appelé.");
  
  try {
    const { sourceUrl } = req.body;
    console.log("Backend: Contenu de req.body:", req.body);
    console.log("Backend: sourceUrl reçue:", JSON.stringify(sourceUrl));

    if (!sourceUrl || String(sourceUrl).trim() === "") {
      return next(new ErrorResponse("L_URL source, ISRC ou UPC est requis", 400));
    }

    // Nettoyage et préparation de l'URL pour l'API Odesli
    let cleanSourceUrl = sourceUrl.trim();
    
    // Vérifier si l'URL contient des paramètres de requête (comme ?si=...)
    if (cleanSourceUrl.includes('?') && cleanSourceUrl.includes('spotify.com')) {
      // Pour Spotify, on peut supprimer les paramètres de requête
      cleanSourceUrl = cleanSourceUrl.split('?')[0];
      console.log("Backend: URL Spotify nettoyée des paramètres:", cleanSourceUrl);
    }
    
    // Construction de l'URL pour l'API Odesli
    const odesliUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(cleanSourceUrl)}`;
    console.log("Backend: Appel à Odesli avec URL:", odesliUrl);

    // Appel à l'API Odesli
    const odesliResponse = await axios.get(odesliUrl);
    const odesliData = odesliResponse.data;

    // Extraction des données pertinentes
    let title = "";
    let artistName = "";
    let thumbnailUrl = "";
    const relevantPlatforms = {};

    // Récupération des métadonnées de la chanson
    if (odesliData.entitiesByUniqueId) {
      const entities = Object.values(odesliData.entitiesByUniqueId);
      if (entities.length > 0) {
        const firstEntity = entities[0];
        title = firstEntity.title || "";
        artistName = firstEntity.artistName || "";
        thumbnailUrl = firstEntity.thumbnailUrl || "";
      }
    }

    // Récupération des liens par plateforme
    const linksByPlatform = odesliData.linksByPlatform || {};
    console.log("Backend: Structure complète de linksByPlatform:", JSON.stringify(linksByPlatform, null, 2));
    
    // Mapping des clés de plateforme Odesli vers nos noms de plateformes
    const platformMapping = {
      spotify: "Spotify",
      appleMusic: "Apple Music",
      youtube: "YouTube",
      youtubeMusic: "YouTube Music",
      deezer: "Deezer",
    };

    for (const odesliPlatformKey in linksByPlatform) {
      console.log(`Backend: Traitement de la plateforme ${odesliPlatformKey}:`, linksByPlatform[odesliPlatformKey]);
      if (platformMapping[odesliPlatformKey]) {
        const platformUrl = linksByPlatform[odesliPlatformKey].url;
        console.log(`Backend: URL extraite pour ${platformMapping[odesliPlatformKey]}:`, platformUrl);
        relevantPlatforms[platformMapping[odesliPlatformKey]] = platformUrl;
      }
    }
    
    if (relevantPlatforms["YouTube"] && !relevantPlatforms["YouTube Music"]) {
        relevantPlatforms["YouTube Music"] = relevantPlatforms["YouTube"];
    }

    if (Object.keys(relevantPlatforms).length === 0) {
      console.log("Backend: Aucun lien pertinent trouvé via Odesli.");
      return res.status(200).json({
        success: true, // On retourne succès mais avec un message indiquant qu_aucun lien n_a été trouvé
        message: "Aucun lien trouvé pour les plateformes principales (Spotify, Apple Music, Deezer, YouTube/YouTube Music) via Odesli/Songlink.",
        data: { title, artistName, thumbnailUrl, links: {} }
      });
    }
    console.log("Backend: Liens trouvés et retournés au frontend:", relevantPlatforms);
    res.status(200).json({
      success: true,
      data: {
        title,
        artistName,
        thumbnailUrl,
        links: relevantPlatforms,
      },
    });

  } catch (error) {
    console.error("Backend: Erreur détaillée lors de l_appel à l_API Odesli/Songlink:", error);
    if (error.response) {
      // Erreur venant de l_API Odesli (ex: 400, 404, 5xx)
      console.error("Backend: Erreur Odesli - Statut:", error.response.status);
      console.error("Backend: Erreur Odesli - Données:", error.response.data);
      const message = error.response.data?.message || `Erreur Odesli (${error.response.status}): Impossible de traiter la source fournie.`
      return next(new ErrorResponse(message, error.response.status));
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n_a été reçue (ex: timeout)
      console.error("Backend: Aucune réponse reçue d_Odesli (timeout?)");
      return next(new ErrorResponse("Aucune réponse reçue du service de recherche de liens (Odesli). Veuillez réessayer.", 504)); // Gateway Timeout
    } else {
      // Erreur de configuration de la requête ou autre
      console.error("Backend: Erreur de configuration de la requête vers Odesli ou autre erreur interne.");
      return next(new ErrorResponse("Erreur interne lors de la communication avec Odesli/Songlink", 500));
    }
  }
});