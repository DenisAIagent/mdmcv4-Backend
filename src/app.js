// src/app.js (Backend Principal)

// 1. Charger les variables d'environnement (.env) en tout premier
require("dotenv").config();

// 2. Importer les modules nécessaires
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet"); // Pour la sécurité des en-têtes HTTP
const morgan = require("morgan"); // Pour le logging des requêtes HTTP
const path = require("path");
const cookieParser = require('cookie-parser'); // Pour parser les cookies (essentiel pour JWT HttpOnly)
const ErrorResponse = require('../utils/errorResponse'); // Adaptez le chemin si nécessaire
const rateLimit = require('express-rate-limit'); // Pour limiter le taux de requêtes (sécurité)
const mongoSanitize = require('express-mongo-sanitize'); // Pour prévenir les injections NoSQL
const xss = require('xss-clean'); // Pour prévenir les attaques XSS (Cross-Site Scripting)
const hpp = require('hpp'); // Pour protéger contre la pollution des paramètres HTTP

// 3. Importation des fichiers de Routes
// Vérifiez attentivement que ces chemins sont corrects par rapport à l'emplacement de app.js
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

// 4. Initialisation de l'application Express
const app = express();

// 5. Middlewares de Sécurité (à appliquer tôt)
app.set('trust proxy', 1); // Nécessaire pour express-rate-limit derrière un proxy (comme Railway)
app.use(helmet()); // Définit des en-têtes HTTP sécurisés
app.use(mongoSanitize()); // Nettoie les données pour prévenir l'injection NoSQL
app.use(xss()); // Nettoie les entrées pour prévenir les attaques XSS
app.use(hpp()); // Protège contre la pollution des paramètres HTTP

// 6. Configuration CORS (Cross-Origin Resource Sharing)
const allowedOrigins = [
  'https://www.mdmcmusicads.com',                   // URL frontend Production
  'https://mdmcv4-frontend-production.up.railway.app', // URL frontend Railway (si différente)
  'http://localhost:5173',                          // Serveur dev local Vite (exemple)
  // Ajoutez d'autres origines si nécessaire (ex: localhost:3000 pour CRA)
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🌐 CORS request check for origin:", origin); // Log pour voir l'origine reçue
    // Autoriser les requêtes sans origine OU celles venant des origines autorisées
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked for origin: ${origin}`); // Log si bloqué
      callback(new Error('Non autorisé par la politique CORS')); // Rejeter si l'origine n'est pas dans la liste
    }
  },
  credentials: true, // INDISPENSABLE pour autoriser l'envoi/réception de cookies (JWT HttpOnly)
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Méthodes HTTP autorisées
  optionsSuccessStatus: 204 // Répond OK aux requêtes preflight OPTIONS
};

app.use(cors(corsOptions)); // Appliquer le middleware CORS

// 7. Middleware de Logging (Morgan)
// N'active le logging détaillé qu'en mode développement
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 8. Middleware de Parsing du Corps de Requête
app.use(express.json({ limit: '10kb' })); // Parser les corps JSON (avec limite de taille)
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parser les corps URL-encoded

// 9. Middleware pour parser les Cookies
// Doit être avant tout middleware ou route qui a besoin d'accéder à req.cookies (ex: 'protect')
app.use(cookieParser());

// 10. Rate Limiting (Limitation du Taux de Requêtes)
// Appliquer à toutes les routes API pour prévenir les abus
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // Fenêtre de 10 minutes
	max: 100, // Limite chaque IP à 100 requêtes par fenêtre (ajustez selon vos besoins)
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer après 10 minutes',
  standardHeaders: true, // Retourne les informations de limite dans les en-têtes `RateLimit-*`
 	legacyHeaders: false, // Désactive les anciens en-têtes `X-RateLimit-*`
  // keyGenerator est géré automatiquement si 'trust proxy' est défini
});
app.use('/api', limiter); // Appliquer seulement aux routes API

// 11. Route de Vérification de Santé (/health)
// Définie avant les routes API pour un accès facile
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1; // 1 = connected
  const healthStatus = isDbConnected ? "ok" : "error";
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
      status: healthStatus,
      message: "MDMC Backend API Status",
      database: isDbConnected ? "connected" : `disconnected (state: ${dbState})`
  });
});

// 12. Montage des Routes API (/api/)
const apiBasePath = "/api"; // Préfixe pour toutes les routes API

app.use(`${apiBasePath}/auth`, authRoutes);

// ***** AJOUT POUR DEBUG *****
// Inspecter les routes enregistrées pour /api/auth juste après le montage
try {
    if (authRoutes && authRoutes.stack) {
        console.log('--- Routes enregistrées pour /api/auth ---');
        authRoutes.stack.forEach(function(layer){
            if (layer.route && layer.route.path && layer.route.methods){
                // Affiche la méthode et le chemin relatif à /api/auth
                console.log(`[${Object.keys(layer.route.methods).join(', ').toUpperCase()}] ${layer.route.path}`);
            }
        });
        console.log('-----------------------------------------');
    } else {
         console.log('AuthRoutes n\'est pas un routeur Express standard ou est vide.');
    }
} catch (e) {
    console.error("Erreur lors de l'inspection des routes auth:", e);
}
// ***** FIN AJOUT POUR DEBUG *****

app.use(`${apiBasePath}/users`, userRoutes);
app.use(`${apiBasePath}/marketing`, marketingRoutes);
app.use(`${apiBasePath}/wordpress`, wordpressRoutes);
app.use(`${apiBasePath}/landing-pages`, landingPageRoutes);
app.use(`${apiBasePath}/reviews`, reviewRoutes);
app.use(`${apiBasePath}/chatbot`, chatbotRoutes);
app.use(`${apiBasePath}/artists`, artistRoutes);
app.use(`${apiBasePath}/smartlinks`, smartLinkRoutes);
// app.use(`${apiBasePath}/upload`, uploadRoutes); // Décommentez si vous avez un fichier upload.routes.js

// 13. Gestionnaire 404 Not Found
// Attrape toutes les requêtes qui n'ont pas matché une route valide
// DOIT être défini APRÈS toutes les autres routes.
app.use((req, res, next) => {
    // Utilise l'objet ErrorResponse pour standardiser
    next(new ErrorResponse(`Route non trouvée - ${req.originalUrl}`, 404));
});

// 14. Middleware Global de Gestion des Erreurs
// Attrape les erreurs passées via next(err)
// DOIT être défini en DERNIER middleware.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("--- Erreur Capturée par le Gestionnaire Global ---");
  console.error("Nom:", err.name);
  console.error("Message:", err.message);
  // Log la stack trace seulement en développement pour le debug
  if (process.env.NODE_ENV === "development") {
       console.error("Stack:", err.stack);
  }

  // Copie de l'erreur pour ne pas modifier l'original
  let error = { ...err };
  error.message = err.message; // Assurer que le message est copié

  // Gestion spécifique des erreurs communes
  if (err.name === "CastError" && err.kind === 'ObjectId') {
      const message = `Ressource non trouvée. Format d'ID invalide: ${err.value}`;
      error = new ErrorResponse(message, 404);
  }
  if (err.code === 11000) { // Erreur de duplication MongoDB
      const field = Object.keys(err.keyValue)[0];
      const value = err.keyValue[field];
      const message = `La valeur '${value}' existe déjà pour le champ unique '${field}'.`;
      error = new ErrorResponse(message, 400);
  }
  if (err.name === "ValidationError") { // Erreur de validation Mongoose
      const messages = Object.values(err.errors).map(val => val.message);
      const message = messages[0] || 'Erreur de validation des données.';
      error = new ErrorResponse(message, 400);
  }
   if (err.name === 'JsonWebTokenError') {
       error = new ErrorResponse('Token invalide.', 401);
   }
   if (err.name === 'TokenExpiredError') {
       error = new ErrorResponse('Session expirée.', 401);
   }
   if (err.message === 'Non autorisé par la politique CORS') {
       error = new ErrorResponse(err.message, 403); // Forbidden
   }
   // Ajoutez d'autres gestions d'erreurs spécifiques si nécessaire

  // Réponse d'erreur standardisée
  res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Erreur Interne du Serveur"
  });
});


// 15. Connexion à la Base de Données & Démarrage du Serveur
const PORT = process.env.PORT || 5000; // Utilise le port défini par Railway ou 5000 en local
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("\x1b[31m%s\x1b[0m", "ERREUR FATALE: La variable d'environnement MONGODB_URI n'est pas définie."); // En rouge
    process.exit(1); // Arrête l'application si la DB n'est pas configurée
}

let server; // Référence au serveur pour fermeture propre

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("\x1b[32m%s\x1b[0m", "✅ Connecté à MongoDB"); // En vert
    // Démarrer le serveur Express SEULEMENT après connexion DB réussie
    server = app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur le port ${PORT} en mode ${process.env.NODE_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("\x1b[31m%s\x1b[0m", "❌ Connexion MongoDB échouée:", err.message);
    process.exit(1); // Arrête l'application si la connexion échoue
  });

// 16. Gestion Propre des Erreurs Non Capturées et Arrêts Serveur
process.on("unhandledRejection", (err, promise) => {
  console.error("\x1b[31m%s\x1b[0m", `❌ ERREUR: Rejet de promesse non traité: ${err.message}`);
  if (server) {
    server.close(() => {
        console.log("Serveur arrêté proprement suite à un rejet non traité.");
        process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error("\x1b[31m%s\x1b[0m", `❌ ERREUR: Exception non traitée: ${err.message}`);
  console.error(err.stack); // Log la stack trace pour le debug
  if (server) {
    server.close(() => {
      console.log('Serveur arrêté proprement suite à une exception non traitée.');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// 17. Exporter l'application (utile pour les tests unitaires/intégration)
module.exports = app;
