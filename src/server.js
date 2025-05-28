const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Routes
const authRoutes = require('./routes/auth.routes');
const smartLinkRoutes = require('./routes/smartlink.routes');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

const app = express();

// Middleware de sécurité
app.use(helmet());

// Middleware CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Middleware de limitation de débit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Middleware de compression
app.use(compression());

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware pour parser le JSON
app.use(express.json());

// Middleware pour parser les cookies
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/smartlinks', smartLinkRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'API MDMC Music Ads opérationnelle' });
});

// Middleware de gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  logger.error(`Erreur: ${err.message}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Erreur serveur'
  });
});

// Définir le port
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  logger.info(`Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${PORT}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Erreur: ${err.message}`);
  // Fermer le serveur et quitter le processus
  server.close(() => process.exit(1));
});

module.exports = app;
