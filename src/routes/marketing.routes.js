<<<<<<< HEAD
// routes/marketing.routes.js (Middleware Réactivé)

const express = require("express");

=======
const express = require('express');
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
const {
  getIntegrations,
  getIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration
<<<<<<< HEAD
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
=======
} = require('../controllers/marketing');

const router = express.Router();

// Importer les middleware de protection et d'autorisation
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// Routes pour les intégrations marketing
router.route('/')
  .get(getIntegrations)
  .post(createIntegration);

router.route('/:id')
  .get(getIntegration)
  .put(updateIntegration)
  .delete(deleteIntegration);

router.route('/:id/test')
  .post(testIntegration);
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)

module.exports = router;
