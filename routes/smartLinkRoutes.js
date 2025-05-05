// routes/smartLinkRoutes.js (Version Avancée avec Sécurité & Validation)

const express = require("express");
const {
  createSmartLink,
  getAllSmartLinks,
  getSmartLinkById,
  updateSmartLinkById,
  deleteSmartLinkById,
  getSmartLinksByArtistSlug,
  getSmartLinkBySlugs
} = require("../controllers/smartLinkController");

// Assurez-vous que ce chemin est correct et que le fichier exporte bien protect et authorize
const { protect, authorize } = require("../middleware/auth");

const { body, param, query, validationResult } = require("express-validator");

const router = express.Router();

// Middleware pour gérer les erreurs de validation de manière centralisée
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Renvoie la première erreur pour simplifier la gestion côté client
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next(); // Passe au prochain middleware ou au contrôleur si tout est valide
};

// Règles de validation pour la création d'un SmartLink
const createSmartLinkValidationRules = [
  body("trackTitle", "Le titre de la musique est requis (max 150 caractères)")
    .not().isEmpty()
    .trim()
    .isLength({ max: 150 }),
  body("artistId", "L'ID de l'artiste est requis et doit être un ID MongoDB valide")
    .not().isEmpty()
    .isMongoId(), // Vérifie que c'est un ID MongoDB valide
  body("coverImageUrl", "Une URL pour l'image de couverture est requise et doit être une URL valide")
    .not().isEmpty()
    .isURL(), // Vérifie que c'est une URL valide
  body("releaseDate", "Date de sortie invalide")
    .optional() // Le champ est optionnel
    .isISO8601() // Vérifie si c'est une date au format ISO8601 (YYYY-MM-DD)
    .toDate(), // Convertit la chaîne en objet Date
  body("description", "La description ne peut pas dépasser 500 caractères")
    .optional()
    .trim()
    .isLength({ max: 500 }),
  body("platformLinks").optional().isArray().withMessage("platformLinks doit être un tableau"),
  body("platformLinks.*.platform", "La plateforme est requise pour chaque lien")
    .if(body("platformLinks").exists({ checkFalsy: true })) // S'applique seulement si platformLinks existe et n'est pas vide
    .notEmpty()
    .trim(),
  body("platformLinks.*.url", "URL de plateforme invalide")
    .if(body("platformLinks").exists({ checkFalsy: true }))
    .isURL(),
  body("trackingIds.ga4Id").optional().trim(),
  body("trackingIds.gtmId").optional().trim(),
  body("trackingIds.metaPixelId").optional().trim(),
  body("trackingIds.tiktokPixelId").optional().trim(),
  body("trackingIds.googleAdsId").optional().trim(),
  body("isPublished").optional().isBoolean().withMessage("isPublished doit être un booléen")
];

// Règles de validation pour la mise à jour d'un SmartLink
const updateSmartLinkValidationRules = [
  param("id", "ID SmartLink invalide dans l'URL").isMongoId(), // Valide l'ID dans les paramètres de l'URL
  body("trackTitle", "Le titre de la musique ne doit pas dépasser 150 caractères")
    .optional() // Tous les champs sont optionnels lors d'une mise à jour
    .trim()
    .isLength({ max: 150 }),
  // L'artistId ne devrait généralement pas être modifiable via cette route pour éviter les incohérences
  body("artistId").not().exists().withMessage("L'artistId ne peut pas être modifié via cette route"),
  body("coverImageUrl", "URL d'image de couverture invalide")
    .optional({ checkFalsy: true }) // Permet une chaîne vide ou null
    .isURL(),
  body("releaseDate", "Date de sortie invalide")
    .optional()
    .isISO8601()
    .toDate(),
  body("description", "La description ne peut pas dépasser 500 caractères")
    .optional()
    .trim()
    .isLength({ max: 500 }),
  body("platformLinks").optional().isArray().withMessage("platformLinks doit être un tableau"),
  body("platformLinks.*.platform", "La plateforme est requise pour chaque lien")
    .if(body("platformLinks").exists({ checkFalsy: true }))
    .notEmpty()
    .trim(),
  body("platformLinks.*.url", "URL de plateforme invalide")
    .if(body("platformLinks").exists({ checkFalsy: true }))
    .isURL(),
  body("trackingIds.ga4Id").optional().trim(),
  body("trackingIds.gtmId").optional().trim(),
  body("trackingIds.metaPixelId").optional().trim(),
  body("trackingIds.tiktokPixelId").optional().trim(),
  body("trackingIds.googleAdsId").optional().trim(),
  body("isPublished").optional().isBoolean().withMessage("isPublished doit être un booléen")
];

// Règles de validation pour les paramètres de requête de getAllSmartLinks (optionnel mais utile)
const getAllSmartLinksValidationRules = [
    query('artistId').optional().isMongoId().withMessage("Le paramètre artistId doit être un ID MongoDB valide"),
    query('isPublished').optional().isBoolean().withMessage("Le paramètre isPublished doit être un booléen"),
    query('select').optional().isString(), // Pourrait être plus strict sur les champs autorisés
    query('sort').optional().isString(), // Pourrait être plus strict sur les champs autorisés
    query('page').optional().isInt({ min: 1 }).withMessage("Le paramètre page doit être un entier positif"),
    query('limit').optional().isInt({ min: 1 }).withMessage("Le paramètre limit doit être un entier positif")
];

// --- Routes Principales CRUD (Protégées pour l'Admin) ---

router.route("/")
  .post(
    protect,                      // 1. Vérifie si l'utilisateur est connecté (JWT valide)
    authorize("admin"),           // 2. Vérifie si l'utilisateur a le rôle 'admin'
    createSmartLinkValidationRules, // 3. Applique les règles de validation
    handleValidationErrors,       // 4. Gère les erreurs de validation
    createSmartLink               // 5. Appelle le contrôleur si tout est OK
  )
  .get(
    protect,                      // Protéger aussi la liste ? Ou laisser public/autre rôle ?
    authorize("admin"),           // Accès admin pour voir tout
    getAllSmartLinksValidationRules, // Valider les paramètres de requête
    handleValidationErrors,
    getAllSmartLinks
  );

router.route("/:id")
  .get(
    protect,
    authorize("admin"),
    param("id", "ID SmartLink invalide dans l'URL").isMongoId(), // Valide l'ID dans l'URL
    handleValidationErrors,
    getSmartLinkById
  )
  .put(
    protect,
    authorize("admin"),
    updateSmartLinkValidationRules, // Applique les règles de validation pour la mise à jour
    handleValidationErrors,
    updateSmartLinkById
  )
  .delete(
    protect,
    authorize("admin"),
    param("id", "ID SmartLink invalide dans l'URL").isMongoId(), // Valide l'ID dans l'URL
    handleValidationErrors,
    deleteSmartLinkById
  );

// --- Routes spécifiques pour récupérer les données par Slugs (Publiques) ---
// Ces routes n'ont pas 'protect' ou 'authorize' car elles sont destinées à être publiques.

router.route("/by-artist/:artistSlug")
  .get(
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(), // Valide que c'est un slug
    handleValidationErrors,
    getSmartLinksByArtistSlug
  );

router.route("/details/:artistSlug/:trackSlug")
  .get(
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(),
    param("trackSlug", "Slug de morceau invalide dans l'URL").isSlug(), // Valide les deux slugs
    handleValidationErrors,
    getSmartLinkBySlugs
  );

module.exports = router;
