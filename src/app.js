const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données
connectDB();

// Initialiser l'application Express
const app = express();

// Configuration pour les proxies (nécessaire pour Railway)
app.set('trust proxy', 1);

// Middleware de sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Configuration du rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain paths if needed
    return false;
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if available, otherwise use IP
    return req.headers['x-forwarded-for'] || req.ip;
  }
});

// Appliquer le rate limiter à toutes les routes
app.use(limiter);

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware pour parser le body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/smartlinks', require('./routes/smartLinkRoutes'));
app.use('/api/v1/artists', require('./routes/artists.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/reviews', require('./routes/reviews.routes'));
app.use('/api/v1/wordpress', require('./routes/wordpress.routes'));
app.use('/api/v1/chatbot', require('./routes/chatbot.routes'));
app.use('/api/v1/landing-pages', require('./routes/landingPage.routes'));
app.use('/api/v1/marketing', require('./routes/marketing.routes'));
app.use('/api/v1/upload', require('./routes/uploadRoutes'));
app.use('/api/v1/admin/stats', require('./routes/adminStats'));

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Définir le port
const PORT = process.env.PORT || 5000;

// Démarrer le serveur
const server = app.listen(PORT, () => {
  console.log(`Serveur démarré en mode ${process.env.NODE_ENV} sur le port ${PORT}`);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err, promise) => {
  console.log(`Erreur: ${err.message}`);
  server.close(() => process.exit(1));
}); 