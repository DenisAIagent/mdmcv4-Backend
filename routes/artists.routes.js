// routes/artists.js (Updated with Security & Validation)

const express = require("express");
const {
  createArtist,
  getAllArtists,
  getArtistBySlug,
  updateArtist,
  deleteArtist
} = require("../controllers/ArtistController"); // Path seems correct

// Assuming middleware/auth.js exists and exports protect, authorize
// If the path is different, adjust it accordingly.
// It's crucial that this file exists and works as expected.
const { protect, authorize } = require("../middleware/auth");

const { body, param, validationResult } = require("express-validator");

const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first error message for simplicity
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

// Validation rules for creating an artist
const createArtistValidationRules = [
  body("name", "Le nom de l'artiste est requis et ne doit pas dépasser 100 caractères")
    .not().isEmpty()
    .trim()
    .isLength({ max: 100 }),
  body("bio", "La biographie ne peut pas dépasser 1000 caractères")
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body("artistImageUrl", "URL d'image artiste invalide")
    .optional({ checkFalsy: true })
    .isURL(),
  body("websiteUrl", "URL de site web invalide")
    .optional({ checkFalsy: true })
    .isURL(),
  // Validate structure of socialLinks array if present
  body("socialLinks").optional().isArray().withMessage("socialLinks doit être un tableau"),
  body("socialLinks.*.platform", "La plateforme sociale est requise pour chaque lien")
    .if(body("socialLinks").exists({ checkFalsy: true })) // Only validate if socialLinks array exists and is not empty
    .notEmpty()
    .trim(),
  body("socialLinks.*.url", "URL de lien social invalide")
    .if(body("socialLinks").exists({ checkFalsy: true }))
    .isURL()
];

// Validation rules for updating an artist
const updateArtistValidationRules = [
  param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(), // Validate the slug in the URL parameter
  body("name", "Le nom de l'artiste ne doit pas dépasser 100 caractères")
    .optional()
    .trim()
    .isLength({ max: 100 }),
  body("bio", "La biographie ne peut pas dépasser 1000 caractères")
    .optional()
    .trim()
    .isLength({ max: 1000 }),
  body("artistImageUrl", "URL d'image artiste invalide")
    .optional({ checkFalsy: true })
    .isURL(),
  body("websiteUrl", "URL de site web invalide")
    .optional({ checkFalsy: true })
    .isURL(),
  // Validate structure of socialLinks array if present
  body("socialLinks").optional().isArray().withMessage("socialLinks doit être un tableau"),
  body("socialLinks.*.platform", "La plateforme sociale est requise pour chaque lien")
    .if(body("socialLinks").exists({ checkFalsy: true }))
    .notEmpty()
    .trim(),
  body("socialLinks.*.url", "URL de lien social invalide")
    .if(body("socialLinks").exists({ checkFalsy: true }))
    .isURL()
];

// Route for the root ('/') of this resource (maps to /api/artists)
router.route("/")
  .post(
    protect,                // 1. Check JWT
    authorize("admin"),     // 2. Check role
    createArtistValidationRules, // 3. Define validation rules
    handleValidationErrors, // 4. Handle validation errors
    createArtist            // 5. Proceed to controller if valid & authorized
  )
  .get(getAllArtists); // GET all artists can remain public or be protected as needed

// Route for operations on a specific artist via their slug ('/:artistSlug')
router.route("/:artistSlug")
  .get(
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(), // Validate slug format in URL
    handleValidationErrors,
    getArtistBySlug
  )
  .put(
    protect,
    authorize("admin"),
    updateArtistValidationRules,
    handleValidationErrors,
    updateArtist
  )
  .delete(
    protect,
    authorize("admin"),
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(), // Validate slug format in URL
    handleValidationErrors,
    deleteArtist
  );

module.exports = router;

