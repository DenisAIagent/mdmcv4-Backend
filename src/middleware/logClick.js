// backend/middleware/logClick.js
const asyncHandler = require("./asyncHandler"); // Adaptez le chemin si nécessaire
const SmartLink = require("../models/SmartLink"); // Adaptez le chemin
const Artist = require("../models/Artist");     // Adaptez le chemin
// ErrorResponse n'est généralement pas nécessaire ici car on ne bloque pas la requête en cas d'échec du log.

/**
 * @desc Middleware pour enregistrer une vue sur un SmartLink.
 * Doit être placé sur la route qui récupère les détails d'un SmartLink public.
 */
exports.logClick = asyncHandler(async (req, res, next) => {
  const trackSlugParam = req.params.trackSlug;
  const artistSlugParam = req.params.artistSlug;

  if (!trackSlugParam || !artistSlugParam) {
    console.warn("logClick Middleware: trackSlug ou artistSlug manquant dans les paramètres de la requête.");
    return next(); // On continue, le contrôleur principal gérera l'erreur de paramètre manquant.
  }

  try {
    const artist = await Artist.findOne({ slug: artistSlugParam }).select('_id'); // On n'a besoin que de l'ID de l'artiste

    if (!artist) {
      console.warn(`logClick Middleware: Artiste non trouvé avec le slug '${artistSlugParam}'. La vue ne sera pas enregistrée.`);
      return next(); // Artiste non trouvé, le contrôleur renverra un 404.
    }

    // Utiliser updateOne pour incrémenter directement sans récupérer le document entier.
    // C'est plus performant si on n'a pas besoin du document SmartLink ici.
    const result = await SmartLink.updateOne(
      { slug: trackSlugParam, artistId: artist._id, isPublished: true }, // S'assurer qu'il est publié
      { $inc: { viewCount: 1 } } // MODIFIÉ : Incrémente viewCount
    );

    if (result.matchedCount === 0) {
      console.warn(`logClick Middleware: SmartLink non trouvé ou non publié pour trackSlug='${trackSlugParam}' et artistId='${artist._id}'. La vue n'a pas été enregistrée.`);
    } else if (result.modifiedCount === 0 && result.matchedCount === 1) {
      // Cela peut arriver si une autre requête l'a incrémenté presque en même temps, ou si $inc a un souci (rare).
      console.warn(`logClick Middleware: SmartLink trouvé, mais viewCount non modifié (matched: ${result.matchedCount}, modified: ${result.modifiedCount}).`);
    } else {
      console.log(`logClick Middleware: Vue enregistrée pour SmartLink trackSlug='${trackSlugParam}', artistId='${artist._id}'.`);
    }
  } catch (error) {
    // En cas d'erreur durant le logging du clic, on logue l'erreur mais on continue
    // pour ne pas bloquer la requête principale de récupération des détails du SmartLink.
    console.error(`logClick Middleware: Erreur lors du tracking de la vue pour trackSlug='${trackSlugParam}', artistSlug='${artistSlugParam}':`, error);
  }
  
  next(); // Toujours appeler next() pour passer au contrôleur suivant.
});
