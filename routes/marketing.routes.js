// routes/marketing.routes.js (Middleware Réactivé)

const express = require("express");

const {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
} = require("../controllers/marketingController.js"); // Chemin contrôleur OK

const router = express.Router();

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

// Application de la protection et autorisation DÉCOMMENTÉE
// Protège TOUTES les routes définies ci-dessous dans ce fichier
router.use(protect);        // 1. Vérifie si l'utilisateur est connecté
router.use(authorize("admin")); // 2. Vérifie si l'utilisateur connecté est admin

// Routes pour les intégrations marketing (MAINTENANT PROTÉGÉES)
router.route("/")
  .get(getIntegrations)     // GET /api/marketing
  .post(createIntegration);  // POST /api/marketing

router.route("/:id")
  .get(getIntegration)      // GET /api/marketing/:id
  .put(updateIntegration)   // PUT /api/marketing/:id
  .delete(deleteIntegration); // DELETE /api/marketing/:id

router.route("/:id/test")
  .post(testIntegration);   // POST /api/marketing/:id/test

module.exports = router;
