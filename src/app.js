// src/app.js (Backend)

// Charger les variables d'environnement en premier
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require('cookie-parser'); // NÉCESSAIRE pour req.cookies.token

// === Importation des Routes ===
// Assurez-vous que ces chemins sont corrects par rapport à l'emplacement de app.js
const authRoutes = require("../routes/auth.routes.js");
const userRoutes = require("../routes/user.routes.js");
const marketingRoutes = require("../routes/marketing.routes.js");
const wordpressRoutes = require("../routes/wordpress.routes.js");
const landingPageRoutes = require("../routes/landingPage.routes.js");
const reviewRoutes = require("../routes/reviews.routes.js");
const chatbotRoutes = require("../routes/chatbot.routes.js");
const artistRoutes = require("../routes/artists.routes.js");
const smartLinkRoutes = require("../routes/smartLinkRoutes.js");
// const uploadRoutes = require('../routes/upload.routes.js'); // Décommentez si vous avez ce fichier

// === Initialisation de l'application express ===
const app = express();

// === Middlewares de Sécurité ===
app.use(helmet()); // Définit divers en-têtes HTTP pour la sécurité

// === Configuration CORS ===
// Liste des origines autorisées à accéder à l'API
const allowedOrigins = [
  'https://www.mdmcmusicads.com',                   // URL frontend Production
  'https://mdmcv4-frontend-production.up.railway.app', // URL frontend Railway (si différente)
  'http://localhost:5173',                          // Serveur dev local Vite (exemple)
  // Ajoutez d'autres origines si nécessaire (ex: localhost avec un autre port)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (ex: Postman, requêtes serveur-à-serveur) OU celles venant des origines autorisées
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Erreur CORS: Origine ${origin} non autorisée.`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true, // ESSENTIEL pour autoriser l'envoi de cookies (pour JWT HttpOnly)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Méthodes HTTP autorisées
  optionsSuccessStatus: 204 // Pour les requêtes preflight OPTIONS
};

app.use(cors(corsOptions));

// === Middleware de Logging ===
// Utilise morgan pour logger les requêtes HTTP en mode développement
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// === Middleware de Parsing du Corps de Requête ===
app.use(express.json()); // Pour parser les corps de requête JSON
app.use(express.urlencoded({ extended: true })); // Pour parser les corps de requête URL-encoded

// === Middleware pour parser les Cookies ===
// INDISPENSABLE pour que req.cookies fonctionne dans le middleware 'protect'
app.use(cookieParser());

// === Route de Vérification de Santé (/health) ===
// Utile pour les services de monitoring (ex: Railway healthcheck)
// Appelée SANS le préfixe /api/
app.get("/health", (req, res) => {
  // Vérifie l'état de la connexion DB (optionnel mais recommandé)
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1; // 1 = connected
  const healthStatus = isDbConnected ? "ok" : "error";
  const statusCode = isDbConnected ? 200 : 503; // 503 Service Unavailable si DB KO

  res.status(statusCode).json({
      status: healthStatus,
      message: "MDMC Backend API Status",
      database: isDbConnected ? "connected" : `disconnected (state: ${dbState})`
  });
});
// === Fin Route /health ===


// === Montage des Routes API (/api/) ===
// Toutes les routes définies dans les fichiers .routes.js seront préfixées par /api
const apiBasePath = "/api"; // Simplifié sans le / final

app.use(`${apiBasePath}/auth`, authRoutes);
app.use(`${apiBasePath}/users`, userRoutes);
app.use(`${apiBasePath}/marketing`, marketingRoutes);
app.use(`${apiBasePath}/wordpress`, wordpressRoutes);
app.use(`${apiBasePath}/landing-pages`, landingPageRoutes);
app.use(`${apiBasePath}/reviews`, reviewRoutes);
app.use(`${apiBasePath}/chatbot`, chatbotRoutes);
app.use(`${apiBasePath}/artists`, artistRoutes);
app.use(`${apiBasePath}/smartlinks`, smartLinkRoutes);
// app.use(`${apiBasePath}/upload`, uploadRoutes); // Décommentez si vous avez ce fichier

// === Gestionnaire 404 Not Found ===
// Attrape toutes les requêtes qui n'ont pas matché une route précédente
// DOIT être défini APRÈS toutes les autres routes.
app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: `Route non trouvée - ${req.originalUrl}`
    });
});


// === Middleware Global de Gestion des Erreurs ===
// Attrape les erreurs passées via next(err) depuis les contrôleurs ou middlewares
// DOIT être défini en DERNIER middleware.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("--- Erreur Capturée ---");
  console.error("Nom:", err.name);
  console.error("Message:", err.message);
  if (process.env.NODE_ENV === "development") {
       console.error("Stack:", err.stack);
       console.error("Erreur Complète:", err); // Log l'erreur complète en dev
  }

  // Utilise le statusCode de l'erreur si défini (par ErrorResponse), sinon 500 par défaut
  let statusCode = err.statusCode || 500;
  let message = err.message || "Erreur Interne du Serveur";

  // Gestion spécifique des erreurs Mongoose / JWT / CORS etc.
  if (err.name === "CastError" && err.kind === 'ObjectId') {
      message = `Ressource non trouvée avec l'ID invalide ${err.value}`;
      statusCode = 404;
  }
  if (err.code === 11000) { // Erreur de duplication MongoDB
      const field = Object.keys(err.keyValue)[0];
      message = `La valeur '${err.keyValue[field]}' existe déjà pour le champ '${field}'.`;
      statusCode = 400;
  }
  if (err.name === "ValidationError") { // Erreur de validation Mongoose
      message = Object.values(err.errors).map(val => val.message).join('. ');
      statusCode = 400;
  }
   if (err.name === 'JsonWebTokenError') {
       message = 'Token invalide ou malformé.';
       statusCode = 401; // Non autorisé
   }
   if (err.name === 'TokenExpiredError') {
       message = 'Votre session a expiré, veuillez vous reconnecter.';
       statusCode = 401; // Non autorisé
   }
   if (message === 'Non autorisé par CORS') {
       // L'erreur CORS est déjà logguée par le middleware CORS
       // On renvoie juste le statut approprié
       statusCode = 403; // Interdit
   }
   // Ajoutez d'autres gestions d'erreurs spécifiques si nécessaire

  res.status(statusCode).json({
      success: false,
      error: message
  });
});


// === Connexion à la Base de Données & Démarrage du Serveur ===
const PORT = process.env.PORT || 5000; // Utilise le port défini par Railway ou 5000 en local
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("ERREUR FATALE: La variable d'environnement MONGODB_URI n'est pas définie.");
    process.exit(1); // Arrête l'application si la DB n'est pas configurée
}

let server; // Pour pouvoir fermer le serveur proprement

mongoose
  .connect(MONGODB_URI) // Options dépréciées enlevées
  .then(() => {
    console.log(`Connecté avec succès à MongoDB.`);
    // Démarrer le serveur SEULEMENT si la connexion DB est réussie
    server = app.listen(PORT, () => {
      console.log(`Serveur démarré en mode ${process.env.NODE_ENV || "development"} sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion MongoDB:", err);
    process.exit(1); // Arrête l'application si la connexion échoue
  });

// Gestion propre des arrêts serveur
process.on("unhandledRejection", (err, promise) => {
  console.error(`ERREUR: Rejet de promesse non traité: ${err.message}`);
  if (server) {
    server.close(() => {
        console.log("Serveur arrêté suite à un rejet non traité.");
        process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error(`ERREUR: Exception non traitée: ${err.message}`);
  console.error(err.stack);
  if (server) {
    server.close(() => {
      console.log('Serveur arrêté suite à une exception non traitée.');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Exporter l'application (utile pour les tests)
module.exports = app;
