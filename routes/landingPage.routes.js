<<<<<<< HEAD
// routes/landingPage.routes.js (Middleware Réactivé)

const express = require("express");

=======
const express = require('express');
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
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
<<<<<<< HEAD
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

=======
} = require('../controllers/landingPage');

const router = express.Router();

// Importer les middleware de protection et d'autorisation
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// Routes pour les templates de landing page
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplate);

// Routes pour les landing pages
router.route('/')
  .get(getLandingPages)
  .post(createLandingPage);

router.route('/:id')
  .get(getLandingPage)
  .put(updateLandingPage)
  .delete(deleteLandingPage);

router.post('/:id/publish', publishLandingPage);
router.post('/:id/unpublish', unpublishLandingPage);
router.get('/:id/preview', previewLandingPage);
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)

module.exports = router;
