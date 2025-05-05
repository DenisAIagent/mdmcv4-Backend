// routes/landingPage.routes.js (Chemin contrôleur CORRIGÉ, Middleware toujours commenté)

const express = require("express");

// *** LA CORRECTION ESSENTIELLE EST ICI ***
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
} = require("../controllers/landingPageController.js"); // <-- Chemin Corrigé

const router = express.Router();

// Importation du Middleware commentée (comme dans votre version précédente)
// const { protect, authorize } = require("../middleware/auth");

// --- ALERTE SÉCURITÉ ---
// Le Middleware reste commenté. Le contrôle d'accès doit être réimplémenté.
// Les routes Landing Page sont actuellement NON PROTÉGÉES.
// --- FIN ALERTE SÉCURITÉ ---

// Application de la protection et autorisation (Middleware commenté)
// router.use(protect);
// router.use(authorize("admin")); // Adaptez le rôle si nécessaire

// --- Routes Landing Pages ---

// Routes pour les Templates
router.route('/templates')
  .get(getTemplates);
router.route('/templates/:id')
  .get(getTemplate);

// Routes principales pour les Landing Pages (ATTENTION : Non protégées)
router.route('/')
  .get(getLandingPages)
  .post(createLandingPage);

router.route('/:id')
  .get(getLandingPage)
  .put(updateLandingPage)
  .delete(deleteLandingPage);

// Routes pour actions spécifiques (utilisation de POST car elles modifient l'état)
router.route('/:id/publish')
  .post(publishLandingPage);

router.route('/:id/unpublish')
  .post(unpublishLandingPage);

router.route('/:id/preview')
  .get(previewLandingPage);


module.exports = router;
