<<<<<<< HEAD
// backend/routes/smartlinkRoutes.js
const express = require("express");
const router = express.Router();

=======
// routes/smartLinkRoutes.js

const express = require('express');
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
const {
  createSmartLink,
  getAllSmartLinks,
  getSmartLinkById,
  updateSmartLinkById,
  deleteSmartLinkById,
  getSmartLinksByArtistSlug,
<<<<<<< HEAD
  getPublicSmartLinkBySlugs,
  logPlatformClick
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
  body("artistId", "L'ID de l'artiste est requis et doit être un ID MongoDB valide")
    .notEmpty().withMessage("L'ID de l'artiste ne peut pas être vide.")
    .isMongoId(),
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
=======
  getSmartLinkBySlugs
} = require('../controllers/smartLinkController'); // Importer les fonctions du contrôleur
const Click = require('../models/Click');

// Importer les middlewares de protection (si/quand vous les aurez)
// const { protect, authorize } = require('../middleware/auth'); // Exemple

const router = express.Router();

// --- Routes Principales CRUD (généralement pour l'admin) ---

// Correspondra à /api/v1/smartlinks
router.route('/')
  .post(/* protect, authorize('admin'), */ createSmartLink)      // Créer un SmartLink
  .get(/* protect, authorize('admin'), */ getAllSmartLinks);       // Lister tous les SmartLinks (avec filtres/pagination)

// Correspondra à /api/v1/smartlinks/:id
router.route('/:id')
  .get(/* protect, authorize('admin'), */ getSmartLinkById)        // Lire un SmartLink par son ID
  .put(/* protect, authorize('admin'), */ updateSmartLinkById)     // Mettre à jour un SmartLink par son ID
  .delete(/* protect, authorize('admin'), */ deleteSmartLinkById); // Supprimer un SmartLink par son ID


// --- Routes spécifiques pour récupérer les données par Slugs (pour frontend/public) ---

// Correspondra à /api/v1/smartlinks/by-artist/:artistSlug
router.route('/by-artist/:artistSlug')
  .get(getSmartLinksByArtistSlug); // Récupérer tous les SmartLinks d'un artiste via son slug

// Correspondra à /api/v1/smartlinks/details/:artistSlug/:trackSlug
router.route('/details/:artistSlug/:trackSlug')
  .get(getSmartLinkBySlugs); // Récupérer les détails d'un SmartLink spécifique via les slugs

// Logger un clic sur un smartlink
router.post('/smartlinks/:id/click', async (req, res) => {
  try {
    const { platform } = req.body;
    const { id } = req.params;
    if (!platform) return res.status(400).json({ error: 'Plateforme requise' });

    await Click.create({ smartLinkId: id, platform });
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; // Exporter le routeur configuré
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
