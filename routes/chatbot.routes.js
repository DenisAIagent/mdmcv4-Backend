// routes/chatbot.routes.js (Middleware Réactivé)

const express = require("express");
const {
  getConfig,
  updateConfig,
  sendMessage,
  getDocumentation
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

module.exports = router;
