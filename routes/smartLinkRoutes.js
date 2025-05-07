// routes/smartLinkRoutes.js

const express = require("express");
const router = express.Router();

const {
  createSmartLink,
  getAllSmartLinks,
  getSmartLinkById,
  updateSmartLinkById,
  deleteSmartLinkById,
  getSmartLinksByArtistSlug,
  getPublicSmartLinkBySlugs, // Assurez-vous que ce nom correspond à votre contrôleur
  logPlatformClick         // Nouveau contrôleur
} = require("../controllers/smartLinkController"); // Adaptez le chemin

// Middlewares d'authentification et d'autorisation
const { protect, authorize } = require("../middleware/auth"); // Adaptez le chemin
// Middleware pour logguer les vues de la page publique
const { logClick } = require("../middleware/logClick"); // Adaptez le chemin, assurez-vous qu'il incrémente viewCount

const { body, param, query, validationResult } = require("express-validator");

// Middleware pour gérer les erreurs de validation d'express-validator
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Retourne seulement le premier message d'erreur pour la simplicité
    return res.status(400).json({ success: false, error: errors.array({ onlyFirstError: true })[0].msg });
  }
  next();
};

// --- Règles de Validation Communes ---
const platformLinksValidation = [
  body("platformLinks")
    .optional()
    .isArray({ min: 1 }).withMessage("Au moins un lien de plateforme est requis si platformLinks est fourni.")
    .custom((links) => { // S'assurer que chaque lien a une plateforme et une URL
        if (!links) return true; // Si le tableau est optionnel et non fourni
        return links.every(link => link && typeof link.platform === 'string' && link.platform.trim() !== '' && typeof link.url === 'string' && link.url.trim() !== '');
    }).withMessage("Chaque lien de plateforme doit avoir un nom de plateforme et une URL valides."),
  body("platformLinks.*.platform", "Le nom de la plateforme est requis pour chaque lien")
    .if(body("platformLinks").exists({ checkFalsy: false })) // checkFalsy: false pour que le tableau vide ne passe pas
    .notEmpty()
    .trim(),
  body("platformLinks.*.url", "URL de plateforme invalide pour chaque lien")
    .if(body("platformLinks").exists({ checkFalsy: false }))
    .isURL(),
];

const trackingIdsValidation = [
  body("trackingIds.ga4Id").optional().trim().isLength({ min: 0, max: 50 }), // Limiter la longueur pour la sécurité
  body("trackingIds.gtmId").optional().trim().isLength({ min: 0, max: 50 }),
  body("trackingIds.metaPixelId").optional().trim().isLength({ min: 0, max: 50 }),
  body("trackingIds.tiktokPixelId").optional().trim().isLength({ min: 0, max: 50 }),
  body("trackingIds.googleAdsId").optional().trim().isLength({ min: 0, max: 50 }),
];

// --- Règles de Validation Spécifiques ---
const createSmartLinkValidationRules = [
  body("trackTitle", "Le titre de la musique est requis (max 150 caractères)")
    .notEmpty().withMessage("Le titre de la musique ne peut pas être vide.")
    .trim()
    .isLength({ min: 1, max: 150 }),
  body("artistId", "L'ID de l'artiste est requis et doit être un ID MongoDB valide")
    .notEmpty().withMessage("L'ID de l'artiste ne peut pas être vide.")
    .isMongoId(),
  body("coverImageUrl", "URL d'image de couverture invalide") // Rendu optionnel
    .optional({ checkFalsy: true }) // Permet une chaîne vide ou null
    .isURL(),
  body("slug").optional().trim().isSlug().withMessage("Le slug fourni est invalide."), // Valider si fourni
  body("releaseDate", "Date de sortie invalide (format AAAA-MM-JJ)")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("description", "La description ne peut pas dépasser 500 caractères")
    .optional()
    .trim()
    .isLength({ max: 500 }),
  ...platformLinksValidation, // Inclure les règles communes
  ...trackingIdsValidation,  // Inclure les règles communes
  body("isPublished").optional().isBoolean().withMessage("isPublished doit être un booléen")
];

const updateSmartLinkValidationRules = [
  param("id", "ID SmartLink invalide dans l'URL").isMongoId(),
  body("trackTitle", "Le titre de la musique ne doit pas dépasser 150 caractères")
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 }), // S'il est fourni, il ne doit pas être vide
  body("artistId").not().exists().withMessage("L'artistId ne peut pas être modifié via cette route."), // Bonne pratique
  body("coverImageUrl", "URL d'image de couverture invalide")
    .optional({ checkFalsy: true })
    .isURL(),
  body("slug").optional().trim().isSlug().withMessage("Le slug fourni est invalide."),
  body("releaseDate", "Date de sortie invalide")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("description", "La description ne peut pas dépasser 500 caractères")
    .optional()
    .trim()
    .isLength({ max: 500 }),
  ...platformLinksValidation,
  ...trackingIdsValidation,
  body("isPublished").optional().isBoolean().withMessage("isPublished doit être un booléen")
];

const getAllSmartLinksValidationRules = [
  query('artistId').optional().isMongoId().withMessage("Le paramètre artistId doit être un ID MongoDB valide"),
  query('isPublished').optional().isBoolean().withMessage("Le paramètre isPublished doit être un booléen"),
  query('select').optional().isString().trim(),
  query('sort').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage("Le paramètre page doit être un entier positif"),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage("Le paramètre limit doit être un entier entre 1 et 100") // Limiter le max pour la perf
];


// --- Définition des Routes ---

// Routes CRUD Admin (protégées)
router.route("/")
  .post(
    protect,
    authorize("admin"),
    createSmartLinkValidationRules,
    handleValidationErrors,
    createSmartLink
  )
  .get(
    protect,
    authorize("admin"),
    getAllSmartLinksValidationRules,
    handleValidationErrors,
    getAllSmartLinks
  );

router.route("/:id")
  .get(
    protect,
    authorize("admin"),
    param("id", "ID SmartLink invalide").isMongoId(),
    handleValidationErrors,
    getSmartLinkById
  )
  .put(
    protect,
    authorize("admin"),
    updateSmartLinkValidationRules,
    handleValidationErrors,
    updateSmartLinkById
  )
  .delete(
    protect,
    authorize("admin"),
    param("id", "ID SmartLink invalide").isMongoId(),
    handleValidationErrors,
    deleteSmartLinkById
  );

// Routes Publiques
router.get( // Changé pour ne pas utiliser router.route() ici car pas d'autres méthodes sur ce path exact
  "/artist/:artistSlug", // URL: /api/smartlinks/artist/:artistSlug
  param("artistSlug", "Slug d'artiste invalide").isSlug(),
  handleValidationErrors,
  getSmartLinksByArtistSlug
);

// Renommé pour clarté, correspond à ma proposition de nom de contrôleur et d'URL pour la page publique
router.get( // Changé pour ne pas utiliser router.route()
  "/public/:artistSlug/:trackSlug", // URL: /api/smartlinks/public/:artistSlug/:trackSlug
  param("artistSlug", "Slug d'artiste invalide").isSlug(),
  param("trackSlug", "Slug de morceau invalide").isSlug(),
  handleValidationErrors,
  logClick, // Ce middleware incrémente viewCount (s'assurer qu'il le fait)
  getPublicSmartLinkBySlugs // Cette fonction ne devrait plus incrémenter viewCount elle-même
);

// Nouvelle route pour logguer les clics sur plateforme (pour platformClickCount)
router.post(
  "/:id/log-platform-click", // URL: /api/smartlinks/:id/log-platform-click
  param("id", "ID SmartLink invalide").isMongoId(),
  // Optionnel: valider req.body.platformName si vous le rendez obligatoire
  // body("platformName").optional().isString().trim().withMessage("Nom de plateforme invalide"),
  handleValidationErrors,
  logPlatformClick
);

module.exports = router;
