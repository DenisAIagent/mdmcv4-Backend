const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
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

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware de sécurité
app.use(helmet({
  contentSecurityPolicy: false // Désactiver temporairement pour le développement
}));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes API
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

// Gestion des routes non trouvées pour l'API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route API non trouvée'
  });
});

// Pour toutes les autres routes, renvoyer l'application React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
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
