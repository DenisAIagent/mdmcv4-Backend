// routes/chatbot.routes.js (Middleware Réactivé)

const express = require('express');
const {
  getConfig,
  updateConfig,
  sendMessage,
  getDocumentation
} = require('../controllers/chatbotController');

const router = express.Router();

// Importer les middleware de protection et d'autorisation
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// Routes for the chatbot (MAINTENANT PROTÉGÉES)
router.route("/config")         // GET & PUT /api/chatbot/config
  .get(getConfig)
  .put(updateConfig);

router.post("/message", sendMessage); // POST /api/chatbot/message
router.get("/documentation", getDocumentation); // GET /api/chatbot/documentation

module.exports = router;
