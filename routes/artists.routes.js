// routes/artists.routes.js (Chemin contrôleur CORRIGÉ, Statut Middleware à vérifier)

const express = require("express");

// *** LA CORRECTION ESSENTIELLE EST ICI ***
const {
  createArtist,
  getAllArtists,
  getArtistBySlug,
  updateArtist,
  deleteArtist
} = require("../controllers/artistController.js"); // <-- Chemin Corrigé (a minuscule, .js ajouté)

// --- VÉRIFICATION REQUISE : Middleware ---
// La ligne ci-dessous nécessite une confirmation :
// 1. Le fichier 'middleware/auth.js' existe-t-il bien (chemin relatif à ce fichier) ?
// 2. Exporte-t-il correctement les fonctions 'protect' et 'authorize' ?
// Si non, cette ligne causera un crash plus tard. Commentez-la si vous n'êtes pas sûr pour le moment.
const { protect, authorize } = require("../middleware/auth");
// --- FIN VÉRIFICATION REQUISE ---

const { body, param, validationResult } = require("express-validator");

const router = express.Router();

// Middleware pour gérer les erreurs de validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Renvoie le premier message d'erreur pour simplifier
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
};

// Règles de validation pour la création d'un artiste
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
  body("socialLinks").optional().isArray().withMessage("socialLinks doit être un tableau"),
  body("socialLinks.*.platform", "La plateforme sociale est requise pour chaque lien")
    .if(body("socialLinks").exists({ checkFalsy: true }))
    .notEmpty()
    .trim(),
  body("socialLinks.*.url", "URL de lien social invalide")
    .if(body("socialLinks").exists({ checkFalsy: true }))
    .isURL()
];

// Règles de validation pour la mise à jour d'un artiste
const updateArtistValidationRules = [
  param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(),
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
  body("socialLinks").optional().isArray().withMessage("socialLinks doit être un tableau"),
  body("socialLinks.*.platform", "La plateforme sociale est requise pour chaque lien")
    .if(body("socialLinks").exists({ checkFalsy: true }))
    .notEmpty()
    .trim(),
  body("socialLinks.*.url", "URL de lien social invalide")
    .if(body("socialLinks").exists({ checkFalsy: true }))
    .isURL()
];

// Route pour la racine ('/') de cette ressource (mappée à /api/artists)
router.route("/")
  .post(
    protect,                  // Échouera si le middleware n'est pas correctement importé
    authorize("admin"),       // Échouera si le middleware n'est pas correctement importé
    createArtistValidationRules,
    handleValidationErrors,
    createArtist
  )
  .get(getAllArtists); // GET peut rester public ou être protégé si besoin

// Route pour les opérations sur un artiste spécifique via son slug ('/:artistSlug')
router.route("/:artistSlug")
  .get(
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(),
    handleValidationErrors,
    getArtistBySlug
  )
  .put(
    protect,                  // Échouera si le middleware n'est pas correctement importé
    authorize("admin"),       // Échouera si le middleware n'est pas correctement importé
    updateArtistValidationRules,
    handleValidationErrors,
    updateArtist
  )
  .delete(
    protect,                  // Échouera si le middleware n'est pas correctement importé
    authorize("admin"),       // Échouera si le middleware n'est pas correctement importé
    param("artistSlug", "Slug d'artiste invalide dans l'URL").isSlug(),
    handleValidationErrors,
    deleteArtist
  );

module.exports = router;
