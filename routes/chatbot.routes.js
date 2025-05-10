<<<<<<< HEAD
// routes/chatbot.routes.js (Middleware Réactivé)

const express = require("express");
=======
const express = require('express');
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
const {
  getConfig,
  updateConfig,
  sendMessage,
  getDocumentation
<<<<<<< HEAD
} = require("../controllers/chatbot.js"); // Chemin correct vers chatbot.js

const router = express.Router();

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

// Application de la protection et autorisation DÉCOMMENTÉE
// Protège TOUTES les routes définies ci-dessous
// Adaptez si certaines routes doivent être publiques ou avoir d'autres rôles
router.use(protect);
router.use(authorize("admin"));

// Routes for the chatbot (MAINTENANT PROTÉGÉES)
router.route("/config")         // GET & PUT /api/chatbot/config
  .get(getConfig)
  .put(updateConfig);

router.post("/message", sendMessage); // POST /api/chatbot/message
router.get("/documentation", getDocumentation); // GET /api/chatbot/documentation
=======
} = require('../controllers/chatbot');

const router = express.Router();

// Importer les middleware de protection et d'autorisation
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// Routes pour le chatbot
router.route('/config')
  .get(getConfig)
  .put(updateConfig);

router.post('/message', sendMessage);
router.get('/documentation', getDocumentation);
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)

module.exports = router;
