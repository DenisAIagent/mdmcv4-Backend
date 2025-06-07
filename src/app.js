// backend/src/app.js

// Charger les variables d'environnement
if (process.env.NODE_ENV !== 'production') {
  // Si .env est à la racine du projet (un niveau au-dessus de src)
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
  // Si .env est dans le même dossier que package.json (racine du backend)
  // require('dotenv').config(); // Cela suppose que le CWD est la racine du backend
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path'); // Utile pour construire des chemins

// Importer la classe ErrorResponse et le gestionnaire d'erreurs global
// CORRIGÉ: Chemin pour remonter du dossier 'src' vers 'utils'
const ErrorResponse = require('../utils/errorResponse');
// CORRIGÉ: Chemin pour remonter du dossier 'src' vers 'middleware' (si vous avez un errorHandler séparé)
// const errorHandler = require('../middleware/errorHandler');

// --- Importer vos fichiers de routes ---
// CORRIGÉ: Chemins pour remonter du dossier 'src' vers 'routes'
const authRoutes = require('../routes/auth.routes');
const artistRoutes = require('../routes/artists.routes');
const smartlinkRoutes = require('../routes/smartLinkRoutes');
const uploadRoutes = require('../routes/uploadRoutes');
// Ajoutez d'autres routeurs ici selon votre projet
// const userRoutes = require('../routes/user.routes.js');
// const wordpressRoutes = require('../routes/wordpress.routes.js');

const app = express();

// --- Connexion à la base de données MongoDB ---
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('ERREUR: La variable d\'environnement MONGO_URI n\'est pas définie.');
      process.exit(1);
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// --- Middlewares ---
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Monter les Routeurs ---
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/smartlinks', smartlinkRoutes);
app.use('/api/upload', uploadRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/wordpress', wordpressRoutes);
app.use('/api/reviews', require('../routes/reviews.routes'));

app.get('/api', (req, res) => {
  res.status(200).json({ success: true, message: 'API MDMC Music Ads SmartLink Builder est opérationnelle !' });
});

// --- Middleware de Gestion d'Erreurs Global ---
// (Logique du errorHandler comme fournie précédemment, utilisant ErrorResponse)
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('--- GESTIONNAIRE D\'ERREURS GLOBAL ---');
  console.error('Message:', err.message);
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.error('Erreur Complète:', err);
      if(err.stack) console.error('Stack:', err.stack);
  }
  console.error('------------------------------------');

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = `Ressource non trouvée. L'identifiant fourni est invalide: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }
  if (err.code === 11000) {
    let field = Object.keys(err.keyValue)[0];
    let value = err.keyValue[field];
    field = field.charAt(0).toUpperCase() + field.slice(1);
    const message = `Le champ '${field}' avec la valeur '${value}' existe déjà. Cette valeur doit être unique.`;
    error = new ErrorResponse(message, 400);
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = `Données invalides: ${messages.join('. ')}`;
    error = new ErrorResponse(message, 400);
  }
  if (err.name === 'JsonWebTokenError') {
    const message = 'Authentification échouée (token invalide). Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401);
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Votre session a expiré. Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur Interne du Serveur'
  });
});

// --- Démarrage du Serveur ---
const PORT = process.env.PORT || 5001;
const server = app.listen(
  PORT,
  console.log(
    `Serveur démarré en mode ${process.env.NODE_ENV || 'inconnu (probablement development)'} sur le port ${PORT}`
  )
);

process.on('unhandledRejection', (err, promise) => {
  console.error(`ERREUR (Unhandled Rejection): ${err.message || err}`);
  server.close(() => process.exit(1));
});
process.on('uncaughtException', (err) => {
    console.error(`ERREUR (Uncaught Exception): ${err.message || err}`);
    server.close(() => process.exit(1));
});

module.exports = app;
