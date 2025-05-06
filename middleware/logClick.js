// middleware/logClick.js
const asyncHandler = require("./asyncHandler");
const SmartLink = require("../models/SmartLink");
const Artist = require("../models/Artist"); // Importer le modèle Artist
const ErrorResponse = require("../utils/errorResponse");

/**
 * @desc Middleware pour enregistrer un clic sur un SmartLink lors de la récupération de ses détails
 */
exports.logClick = asyncHandler(async (req, res, next) => {
  const trackSlugParam = req.params.trackSlug; // Vient de la route /details/:artistSlug/:trackSlug
  const artistSlugParam = req.params.artistSlug; // Vient de la route

  if (!trackSlugParam || !artistSlugParam) {
    console.warn("logClick: trackSlug ou artistSlug manquant dans les paramètres de la requête pour le tracking.");
    // On continue pour que le contrôleur principal puisse gérer l'erreur de paramètres manquants si nécessaire.
    return next(); 
  }

  try {
    // 1. Trouver l'artiste par son slug pour obtenir son ID
    const artist = await Artist.findOne({ slug: artistSlugParam });

    if (!artist) {
      console.warn(`logClick: Artiste non trouvé avec le slug '${artistSlugParam}'. Le clic ne sera pas enregistré.`);
      // Si l'artiste n'est pas trouvé, le smartlink ne peut pas être identifié de manière unique.
      // Le contrôleur getSmartLinkBySlugs renverra probablement un 404.
      return next();
    }

    // 2. Utiliser l'ID de l'artiste et le trackSlug pour trouver et incrémenter le SmartLink
    // On ne retourne pas le document mis à jour pour optimiser (new: false)
    // On ne lance pas les validateurs car on ne fait qu'incrémenter un nombre (runValidators: false)
    const result = await SmartLink.updateOne(
      { slug: trackSlugParam, artistId: artist._id },
      { $inc: { clickCount: 1 } }
    );

    if (result.matchedCount === 0) {
      // Aucun document n'a été trouvé avec ces critères.
      console.warn(`logClick: SmartLink non trouvé pour trackSlug='${trackSlugParam}' et artistId='${artist._id}'. Le clic n'a pas été enregistré.`);
    } else if (result.modifiedCount === 0 && result.matchedCount === 1) {
      // Un document a été trouvé mais non modifié (cela ne devrait pas arriver avec $inc à moins d'un problème)
      console.warn(`logClick: SmartLink trouvé pour trackSlug='${trackSlugParam}' et artistId='${artist._id}', mais le compteur de clics n'a pas été incrémenté.`);
    } else {
      // Le clic a été enregistré (ou du moins, la commande d'update a été envoyée)
      console.log(`logClick: Tentative d'enregistrement de clic pour SmartLink slug='${trackSlugParam}', artistId='${artist._id}'.`);
    }

  } catch (error) {
    // En cas d'erreur durant la recherche ou la mise à jour, on logue l'erreur mais on continue
    // pour ne pas bloquer la requête principale de récupération des détails du SmartLink.
    console.error(`logClick: Erreur lors du tracking du clic pour trackSlug='${trackSlugParam}', artistSlug='${artistSlugParam}':`, error);
  }
  
  next();
});

