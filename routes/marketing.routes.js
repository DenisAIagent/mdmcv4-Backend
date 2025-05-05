// routes/marketing.routes.js (Chemin contrôleur CORRIGÉ, Middleware toujours commenté)

const express = require("express");

// *** LA CORRECTION ESSENTIELLE EST ICI ***
const {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
} = require("../controllers/marketingController.js"); // <-- Chemin Corrigé

const router = express.Router();

// Importation du Middleware commentée (comme dans votre version précédente)
// const { protect, authorize } = require("../middleware/auth");

// --- ALERTE SÉCURITÉ ---
// Le Middleware reste commenté. Le contrôle d'accès doit être réimplémenté.
// Les routes Marketing sont actuellement NON PROTÉGÉES.
// --- FIN ALERTE SÉCURITÉ ---

// Application de la protection et autorisation (Middleware commenté)
// router.use(protect);
// router.use(authorize("admin"));

// Routes pour les intégrations marketing (ATTENTION : Non protégées)
router.route("/")
  .get(getIntegrations)
  .post(createIntegration);

router.route("/:id")
  .get(getIntegration)
  .put(updateIntegration)
  .delete(deleteIntegration);

router.route("/:id/test")
  .post(testIntegration);

module.exports = router;
