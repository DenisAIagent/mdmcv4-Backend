// src/app.js (Version finale confirmée par l'architecture fournie)

require("dotenv").config(); // Charger les variables d'environnement en premier
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// === Importation des Routes ===
// Le préfixe '../' est correct car 'routes/' est un dossier frère de 'src/'
// Les noms de fichiers .routes.js sont confirmés par la capture d'écran.

const authRoutes = require("../routes/auth.routes.js");
const userRoutes = require("../routes/user.routes.js");
const marketingRoutes = require("../routes/marketing.routes.js");
const wordpressRoutes = require("../routes/wordpress.routes.js");
const landingPageRoutes = require("../routes/landingPage.routes.js");
const reviewRoutes = require("../routes/reviews.routes.js");
const chatbotRoutes = require("../routes/chatbot.routes.js");
const artistRoutes = require("../routes/artists.routes.js"); // Confirmé: artists.routes.js
const smartLinkRoutes = require("../routes/smartLink.routes.js"); // Confirmé: smartLink.routes.js

// === Initialisation de l'application express ===
const app = express();

// === Middlewares de Sécurité ===
app.use(helmet()); // Définit divers en-têtes HTTP pour la sécurité

// === Configuration CORS ===
// Autorise les domaines de votre frontend et le développement local
const allowedOrigins = [
  'https://www.mdmcmusicads.com',            // URL frontend Production
  'https://mdmcv4-frontend-production.up.railway.app', // URL frontend Railway
  'http://localhost:5173',                   // Serveur dev local Vite (exemple)
  'http://localhost:3000'                    // Serveur dev local CRA (exemple)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Autorise les requêtes sans origine (ex: mobile, curl) ou depuis la liste
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Erreur CORS: Origine ${origin} non autorisée.`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true, // Autorise les cookies, en-têtes d'autorisation, etc.
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions)); // Utiliser la configuration CORS - Placé tôt

// === Middleware de Logging ===
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // Utiliser morgan pour les logs en développement
}

// === Middleware de Parsing du Corps de Requête ===
app.use(express.json()); // Pour parser les corps JSON
app.use(express.urlencoded({ extended: true })); // Pour parser les corps URL-encoded

// === Montage des Routes API ===
// Utilisation de /api/ comme chemin de base standard
const apiBasePath = "/api/";

app.use(`${apiBasePath}auth`, authRoutes);
app.use(`${apiBasePath}users`, userRoutes);
app.use(`${apiBasePath}marketing`, marketingRoutes);
app.use(`${apiBasePath}wordpress`, wordpressRoutes);
app.use(`${apiBasePath}landing-pages`, landingPageRoutes);
app.use(`${apiBasePath}reviews`, reviewRoutes);
app.use(`${apiBasePath}chatbot`, chatbotRoutes);
app.use(`${apiBasePath}artists`, artistRoutes);
app.use(`${apiBasePath}smartlinks`, smartLinkRoutes);

// === Endpoint de Vérification de Santé ===
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "MDMC Backend API is running" });
});

// === Gestionnaire 404 Not Found ===
// Doit venir APRÈS toutes les routes valides
app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: `Not Found - ${req.originalUrl}`
    });
});


// === Middleware Global de Gestion des Erreurs ===
// Doit venir en dernier, après le gestionnaire 404
app.use((err, req, res, next) => {
  console.error("Capture Middleware Erreur:", err.name, err.message);
  // Afficher la stack trace seulement en développement
  if (process.env.NODE_ENV === "development") {
      console.error(err.stack);
  }

  // Déterminer le code de statut et le message
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Gestion spécifique des erreurs Mongoose
  if (err.name === "CastError") { // ID mal formé
      message = `Ressource non trouvée avec l'ID ${err.value}`;
      statusCode = 404;
  }
  if (err.code === 11000) { // Clé unique dupliquée
      const field = Object.keys(err.keyValue)[0];
      message = `Valeur dupliquée pour le champ: ${field}`;
      statusCode = 400;
  }
  if (err.name === "ValidationError") { // Échec de validation du modèle
      message = Object.values(err.errors).map(val => val.message).join(', ');
      statusCode = 400;
  }
  // Gestion spécifique de l'erreur CORS personnalisée
  if (message === 'Non autorisé par CORS') {
    statusCode = 403; // Forbidden
  }

  // Envoyer la réponse d'erreur JSON
  res.status(statusCode).json({
      success: false,
      error: message
  });
});


// === Connexion à la Base de Données & Démarrage du Serveur ===
const PORT = process.env.PORT || 5000; // Utilise le port défini par Railway ou 5000 par défaut
const MONGODB_URI = process.env.MONGODB_URI; // Doit être défini dans les variables d'environnement Railway

if (!MONGODB_URI) {
    console.error("ERREUR FATALE: La variable d'environnement MONGODB_URI n'est pas définie.");
    process.exit(1); // Quitter si l'URI de la BDD manque
}

let server; // Pour pouvoir fermer le serveur proprement

mongoose
  .connect(MONGODB_URI) // Utilisation directe de l'URI
  .then(() => {
    console.log(`Connecté avec succès à MongoDB.`);
    // Démarrer le serveur seulement après la connexion réussie à la BDD
    server = app.listen(PORT, () => {
      console.log(`Serveur démarré en mode ${process.env.NODE_ENV || "development"} sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion MongoDB:", err);
    process.exit(1); // Quitter si la connexion BDD échoue
  });

// Gérer les rejets de promesses non interceptés
process.on("unhandledRejection", (err, promise) => {
  console.error(`Rejet non traité: ${err.name} - ${err.message}`);
  if (server) {
    server.close(() => { // Fermer le serveur proprement
        console.log("Serveur arrêté suite à un rejet non traité.");
        process.exit(1);
    });
  } else {
    process.exit(1); // Quitter si le serveur n'a pas démarré
  }
});

// Gérer les exceptions non interceptées
process.on('uncaughtException', (err) => {
  console.error(`Exception non traitée: ${err.name} - ${err.message}`);
  console.error(err.stack);
  if (server) {
    server.close(() => { // Fermer le serveur proprement
      console.log('Serveur arrêté suite à une exception non traitée.');
      process.exit(1);
    });
  } else {
    process.exit(1); // Quitter si le serveur n'a pas démarré
  }
});

// Exporter l'application (peut être utile pour les tests)
module.exports = app;
