// src/app.js (Revu: attention portée à la route /health et aux imports)

require("dotenv").config(); // Charger les variables d'environnement en premier
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// === Importation des Routes ===
// Vérification des chemins basée sur nos corrections précédentes et la structure

const authRoutes = require("../routes/auth.routes.js");
const userRoutes = require("../routes/user.routes.js");
const marketingRoutes = require("../routes/marketing.routes.js");
const wordpressRoutes = require("../routes/wordpress.routes.js"); // Non vérifié, suppose correct
const landingPageRoutes = require("../routes/landingPage.routes.js");
const reviewRoutes = require("../routes/reviews.routes.js");
const chatbotRoutes = require("../routes/chatbot.routes.js"); // Non vérifié, suppose correct
const artistRoutes = require("../routes/artists.routes.js");
const smartLinkRoutes = require("../routes/smartLinkRoutes.js"); // Chemin corrigé

// === Initialisation de l'application express ===
const app = express();

// === Middlewares de Sécurité ===
app.use(helmet()); // Définit divers en-têtes HTTP pour la sécurité

// === Configuration CORS ===
const allowedOrigins = [
  'https://www.mdmcmusicads.com',            // URL frontend Production
  'https://mdmcv4-frontend-production.up.railway.app', // URL frontend Railway
  'http://localhost:5173',                   // Serveur dev local Vite (exemple)
  'http://localhost:3000'                    // Serveur dev local CRA (exemple)
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Erreur CORS: Origine ${origin} non autorisée.`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// === Middleware de Logging ===
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// === Middleware de Parsing du Corps de Requête ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Point Important: Route /health ===
// Cette route est définie ICI, AVANT les routes /api/*
// et AVANT le gestionnaire 404 final.
// Elle doit être appelée via VOTRE_URL_BACKEND/health (SANS /api/)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "MDMC Backend API is running" });
});
// === Fin Point Important /health ===

// === Montage des Routes API (/api/...) ===
// Toutes les routes définies dans les fichiers .routes.js seront préfixées par /api
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

// === Gestionnaire 404 Not Found ===
// Ce gestionnaire attrape toutes les requêtes qui n'ont correspondu
// à AUCUNE des routes définies ci-dessus (y compris /health ou les routes /api/*).
// Il DOIT être défini APRÈS toutes les autres routes.
app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: `Not Found - ${req.originalUrl}`
    });
});


// === Middleware Global de Gestion des Erreurs ===
// Ce middleware attrape les erreurs survenues dans les routes précédentes.
// Il DOIT être défini en DERNIER.
app.use((err, req, res, next) => {
  console.error("Capture Middleware Erreur:", err.name, err.message);
  if (process.env.NODE_ENV === "development") {
      console.error(err.stack);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Gestion spécifique des erreurs Mongoose / CORS
  if (err.name === "CastError") {
      message = `Ressource non trouvée avec l'ID ${err.value}`;
      statusCode = 404;
  }
  if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      message = `Valeur dupliquée pour le champ: ${field}`;
      statusCode = 400;
  }
  if (err.name === "ValidationError") {
      message = Object.values(err.errors).map(val => val.message).join(', ');
      statusCode = 400;
  }
  if (message === 'Non autorisé par CORS') {
    statusCode = 403;
  }

  res.status(statusCode).json({
      success: false,
      error: message
  });
});


// === Connexion à la Base de Données & Démarrage du Serveur ===
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("ERREUR FATALE: La variable d'environnement MONGODB_URI n'est pas définie.");
    process.exit(1);
}

let server;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`Connecté avec succès à MongoDB.`);
    server = app.listen(PORT, () => {
      console.log(`Serveur démarré en mode ${process.env.NODE_ENV || "development"} sur le port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion MongoDB:", err);
    process.exit(1);
  });

// Gestionnaires pour 'unhandledRejection' et 'uncaughtException' (restent inchangés)
process.on("unhandledRejection", (err, promise) => {
  console.error(`Rejet non traité: ${err.name} - ${err.message}`);
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
  console.error(`Exception non traitée: ${err.name} - ${err.message}`);
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

module.exports = app; // Export app for potential testing
