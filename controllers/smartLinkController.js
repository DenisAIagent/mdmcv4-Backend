// routes/smartLinkRoutes.js (Updated with Security & Validation)

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

// Assuming middleware/auth.js exists and exports protect, authorize
const { protect, authorize } = require("../middleware/auth");

const { body, param, query, validationResult } = require("express-validator");

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

// Validation rules for creating a SmartLink
const createSmartLinkValidationRules = [
  body("trackTitle", "Le titre de la musique est requis (max 150 caractères)")
    .not().isEmpty()
    .trim()
    .isLength({ max: 150 }),
  body("artistId", "L'ID de l'artiste est requis et doit être un ID MongoDB valide")
    .not().isEmpty()
    .isMongoId(),
  body("coverImageUrl", "Une URL pour l'image de couverture est requise et doit être une URL valide")
    .not().isEmpty()
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

// Validation rules for updating a SmartLink
const updateSmartLinkValidationRules = [
  param("id", "ID SmartLink invalide dans l'URL").isMongoId(),
  body("trackTitle", "Le titre de la musique ne doit pas dépasser 150 caractères")
    .optional()
    .trim()
    .isLength({ max: 150 }),
  // artistId should generally not be updatable via this route
  body("artistId").not().exists().withMessage("L'artistId ne peut pas être modifié via cette route"),
  body("coverImageUrl", "URL d'image de couverture invalide")
    .optional({ checkFalsy: true })
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

// Validation rules for query parameters in getAllSmartLinks
const getAllSmartLinksValidationRules = [
    query('artistId').optional().isMongoId().withMessage("Le paramètre artistId doit être un ID MongoDB valide"),
    query('isPublished').optional().isBoolean().withMessage("Le paramètre isPublished doit être un booléen"),
    query('select').optional().isString(),
    query('sort').optional().isString(),
    query('page').optional().isInt({ min: 1 }).withMessage("Le paramètre page doit être un entier positif"),
    query('limit').optional().isInt({ min: 1 }).withMessage("Le paramètre limit doit être un entier positif")
];

// --- Routes Principales CRUD (Admin) ---

router.route("/")
  .post(
    protect,
    authorize("admin"),
    createSmartLinkValidationRules,
    handleValidationErrors,
    createSmartLink
  )
  .get(
    protect, // Assuming listing all might need protection
    authorize("admin"),
    getAllSmartLinksValidationRules,
    handleValidationErrors,
    getAllSmartLinks
  );

router.route("/:id")
  .get(
    protect,
    authorize("admin"),
    param("id", "ID SmartLink invalide dans l'URL").isMongoId(),
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
    param("id", "ID SmartLink invalide dans l'URL").isMongoId(),
    handleValidationErrors,
    deleteSmartLinkById
  );

// --- Routes spécifiques pour récupérer les données par Slugs (Public) ---

router.route("/by-artist/:artistSlug")
  .get(
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(),
    handleValidationErrors,
    getSmartLinksByArtistSlug
  );

router.route("/details/:artistSlug/:trackSlug")
  .get(
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(),
    param("trackSlug", "Slug de morceau invalide dans l'URL").isSlug(),
    handleValidationErrors,
    getSmartLinkBySlugs
  );

module.exports = router;
