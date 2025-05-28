// routes/landingPage.routes.js (Middleware Réactivé)

const express = require("express");

const {
  getTemplates,
  getTemplate,
  getLandingPages,
  getLandingPage,
  createLandingPage,
  updateLandingPage,
  publishLandingPage,
  unpublishLandingPage,
  deleteLandingPage,
  previewLandingPage
  // Assurez-vous que toutes les fonctions utilisées dans les routes sont bien importées ici
} = require("../controllers/landingPageController.js"); // <-- Chemin Contrôleur OK

const router = express.Router();

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

// Application de la protection et autorisation DÉCOMMENTÉE
// Protège TOUTES les routes définies ci-dessous dans ce fichier
router.use(protect);        // 1. Vérifie si connecté
router.use(authorize("admin")); // 2. Vérifie si admin

// --- Routes Landing Pages (MAINTENANT PROTÉGÉES) ---

// Routes pour les Templates
router.route('/templates')
  .get(getTemplates);       // GET /api/landing-pages/templates
router.route('/templates/:id')
  .get(getTemplate);        // GET /api/landing-pages/templates/:id

// Routes principales pour les Landing Pages
router.route('/')
  .get(getLandingPages)     // GET /api/landing-pages
  .post(createLandingPage);   // POST /api/landing-pages

router.route('/:id')
  .get(getLandingPage)      // GET /api/landing-pages/:id
  .put(updateLandingPage)   // PUT /api/landing-pages/:id
  .delete(deleteLandingPage); // DELETE /api/landing-pages/:id

// Routes pour actions spécifiques
router.route('/:id/publish')
  .post(publishLandingPage); // POST /api/landing-pages/:id/publish

router.route('/:id/unpublish')
  .post(unpublishLandingPage); // POST /api/landing-pages/:id/unpublish

router.route('/:id/preview')
  .get(previewLandingPage);   // GET /api/landing-pages/:id/preview


module.exports = router;
