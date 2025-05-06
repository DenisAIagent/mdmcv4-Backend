// src/app.js

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const cookieParser = require("cookie-parser");
const ErrorResponse = require("../utils/errorResponse");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// Import routes
const authRoutes = require("../routes/auth.routes.js");
const userRoutes = require("../routes/user.routes.js");
const marketingRoutes = require("../routes/marketing.routes.js");
const wordpressRoutes = require("../routes/wordpress.routes.js");
const landingPageRoutes = require("../routes/landingPage.routes.js");
const reviewRoutes = require("../routes/reviews.routes.js");
const chatbotRoutes = require("../routes/chatbot.routes.js");
const artistRoutes = require("../routes/artists.routes.js");
const smartLinkRoutes = require("../routes/smartLinkRoutes.js");

const app = express();

// --- Sécurité ---
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// --- CORS ---
const allowedOrigins = [
  "https://www.mdmcmusicads.com",
  "https://mdmcv4-frontend-production.up.railway.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🌐 CORS request from origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error("Non autorisé par la politique CORS"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// --- Logging (dev uniquement) ---
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// --- Body parsers & cookies ---
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: "Trop de requêtes. Réessayez plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// --- Route de santé ---
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "error",
    message: "MDMC Backend API Status",
    database: isDbConnected ? "connected" : `disconnected (state: ${dbState})`,
  });
});

// --- Routes API ---
const apiBasePath = "/api";

app.use(`${apiBasePath}/auth`, authRoutes);
app.use(`${apiBasePath}/users`, userRoutes);
app.use(`${apiBasePath}/marketing`, marketingRoutes);
app.use(`${apiBasePath}/wordpress`, wordpressRoutes);
app.use(`${apiBasePath}/landing-pages`, landingPageRoutes);
app.use(`${apiBasePath}/reviews`, reviewRoutes);
app.use(`${apiBasePath}/chatbot`, chatbotRoutes);
app.use(`${apiBasePath}/artists`, artistRoutes);
app.use(`${apiBasePath}/smartlinks`, smartLinkRoutes);

// --- 404 ---
app.use((req, res, next) => {
  next(new ErrorResponse(`Route non trouvée - ${req.originalUrl}`, 404));
});

// --- Gestion globale des erreurs ---
app.use((err, req, res, next) => {
  console.error("--- Erreur Capturée ---");
  console.error("Nom:", err.name);
  console.error("Message:", err.message);
  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }

  let error = { ...err };
  error.message = err.message;

  if (err.name === "CastError" && err.kind === "ObjectId") {
    error = new ErrorResponse(
      `ID invalide: ${err.value}`,
      404
    );
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new ErrorResponse(`Valeur '${value}' déjà utilisée pour '${field}'`, 400);
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ErrorResponse(messages[0] || "Erreur de validation", 400);
  }

  if (err.name === "JsonWebTokenError") {
    error = new ErrorResponse("Token invalide.", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new ErrorResponse("Session expirée.", 401);
  }

  if (err.message === "Non autorisé par la politique CORS") {
    error = new ErrorResponse(err.message, 403);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Erreur serveur",
  });
});

// --- Connexion DB & Démarrage ---
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERREUR: MONGODB_URI manquant dans .env");
  process.exit(1);
}

let server;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connecté à MongoDB");
    server = app.listen(PORT, () =>
      console.log(`🚀 Serveur lancé sur le port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Connexion MongoDB échouée:", err.message);
    process.exit(1);
  });

// --- Gestion erreurs globales ---
process.on("unhandledRejection", (err) => {
  console.error("❌ PROMESSE NON TRAITÉE:", err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", (err) => {
  console.error("❌ EXCEPTION NON TRAITÉE:", err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

module.exports = app;
