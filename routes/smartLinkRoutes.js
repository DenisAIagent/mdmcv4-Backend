// backend/routes/smartlinkRoutes.js
const express = require("express");
const router = express.Router();

const {
  createSmartLink,
  getAllSmartLinks,
  getSmartLinkById,
  updateSmartLinkById,
  deleteSmartLinkById,
  getSmartLinksByArtistSlug,
  getPublicSmartLinkBySlugs,
  logPlatformClick,
  fetchPlatformLinks
} = require("../controllers/smartLinkController"); // Adaptez le chemin

// Middlewares d'authentification et d'autorisation
const { protect, authorize } = require("../middleware/auth"); // Adaptez le chemin
// Middleware pour logguer les vues de la page publique
const { logClick } = require("../middleware/logClick"); // Adaptez le chemin

const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array({ onlyFirstError: true })[0].msg });
  }
  next();
};

// --- Règles de Validation Communes ---
const platformLinksValidation = [
  body("platformLinks")
    .optional()
    .isArray({ min: 1 }).withMessage("Au moins un lien de plateforme est requis si platformLinks est fourni.")
    .custom((links) => {
        if (!links) return true;
        return links.every(link => link && typeof link.platform === 'string' && link.platform.trim() !== '' && typeof link.url === 'string' && link.url.trim() !== '');
    }).withMessage("Chaque lien de plateforme doit avoir un nom de plateforme et une URL valides."),
  body("platformLinks.*.platform", "Le nom de la plateforme est requis pour chaque lien")
    .if(body("platformLinks").exists({ checkFalsy: false }))
    .notEmpty()
    .trim(),
  body("platformLinks.*.url", "URL de plateforme invalide pour chaque lien")
    .if(body("platformLinks").exists({ checkFalsy: false }))
    .isURL(),
];

const trackingIdsValidation = [
  body("trackingIds.ga4Id").optional().trim().isLength({ min: 0, max: 50 }),
  body("trackingIds.gtmId").optional().trim().isLength({ min: 0, max: 50 }),
  body("trackingIds.metaPixelId").optional().trim().isLength({ min: 0, max: 50 }),
  body("trackingIds.tiktokPixelId").optional().trim().isLength({ min: 0, max: 50 }),
  body("trackingIds.googleAdsId").optional().trim().isLength({ min: 0, max: 50 }),
];

const createSmartLinkValidationRules = [
  body("trackTitle", "Le titre de la musique est requis (max 150 caractères)")
    .notEmpty().withMessage("Le titre de la musique ne peut pas être vide.")
    .trim()
    .isLength({ min: 1, max: 150 }),
  // Validation customisée pour artistId OU artistName
  body()
    .custom((value, { req }) => {
      const { artistId, artistName } = req.body;
      if (!artistId && !artistName) {
        throw new Error("artistId ou artistName est requis");
      }
      if (artistId && artistName) {
        throw new Error("Fournissez soit artistId soit artistName, pas les deux");
      }
      return true;
    }),
  body("artistId")
    .optional()
    .isMongoId()
    .withMessage("L'artistId doit être un ID MongoDB valide"),
  body("artistName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le nom d'artiste doit contenir entre 1 et 100 caractères"),
  body("coverImageUrl", "URL d'image de couverture invalide")
    .optional({ checkFalsy: true })
    .isURL(),
  body("slug").optional().trim().isSlug().withMessage("Le slug fourni est invalide."),
  body("releaseDate", "Date de sortie invalide (format AAAA-MM-JJ)")
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

const updateSmartLinkValidationRules = [
  param("id", "ID SmartLink invalide dans l'URL").isMongoId(),
  body("trackTitle", "Le titre de la musique ne doit pas dépasser 150 caractères")
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 }),
  body("artistId").not().exists().withMessage("L'artistId ne peut pas être modifié via cette route."),
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
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage("Le paramètre limit doit être un entier entre 1 et 100")
];

// --- Définition des Routes ---
// Le préfixe /api/smartlinks sera ajouté dans votre fichier serveur principal (app.js ou server.js)

// Routes CRUD Admin (protégées)
router.route("/")
  .post(
    protect, // Authentification
    authorize("admin"), // Autorisation rôle admin
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

// Route pour l'auto-remplissage des liens de plateformes
router.post(
  "/fetch-platform-links", // Sera monté comme /api/v1/smartlinks/fetch-platform-links
  protect,
  authorize("admin"),
  body("sourceUrl", "URL source ou ISRC requis")
    .notEmpty()
    .withMessage("L'URL source ou ISRC ne peut pas être vide.")
    .trim(),
  handleValidationErrors,
  fetchPlatformLinks
);

// Routes Publiques
router.get(
  "/artist/:artistSlug", // Sera monté comme /api/smartlinks/artist/:artistSlug
  param("artistSlug", "Slug d'artiste invalide").isSlug(),
  handleValidationErrors,
  getSmartLinksByArtistSlug
);

router.get(
  "/public/:artistSlug/:trackSlug", // Sera monté comme /api/smartlinks/public/:artistSlug/:trackSlug
  param("artistSlug", "Slug d'artiste invalide").isSlug(),
  param("trackSlug", "Slug de morceau invalide").isSlug(),
  handleValidationErrors,
  logClick, // Middleware pour incrémenter viewCount
  getPublicSmartLinkBySlugs // Ne doit PLUS incrémenter viewCount
);

router.post(
  "/:id/log-platform-click", // Sera monté comme /api/smartlinks/:id/log-platform-click
  param("id", "ID SmartLink invalide").isMongoId(),
  // Optionnel: body("platformName").optional().isString().trim(),
  handleValidationErrors,
  logPlatformClick
);

module.exports = router;
