// backend/src/app.js

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Assurez-vous que cors est importé
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const ErrorResponse = require('../utils/errorResponse');

// --- Importer vos fichiers de routes ---
const authRoutes = require('../routes/auth.routes');
const artistRoutes = require('../routes/artists.routes');
const smartlinkRoutes = require('../routes/smartLinkRoutes');
const uploadRoutes = require('../routes/uploadRoutes');

const app = express();

// --- Connexion à la base de données MongoDB ---
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) { // Utilise MONGODB_URI comme configuré
      console.error('ERREUR: La variable d\'environnement MONGODB_URI n\'est pas définie.');
      process.exit(1);
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1);
  }
};
connectDB();

// --- Middlewares ---

// Configuration CORS pour autoriser plusieurs origines
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000', // Votre URL Railway existante et localhost pour le dev
  'https://www.mdmcmusicads.com' // Ajoutez votre domaine personnalisé ici
];

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (comme les applis mobiles ou Postman) OU si l'origine est dans la liste blanche
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('L\'accès CORS pour cette origine n\'est pas autorisé.'));
    }
  },
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

app.get('/api', (req, res) => {
  res.status(200).json({ success: true, message: 'API MDMC Music Ads SmartLink Builder est opérationnelle !' });
});

// --- Middleware de Gestion d'Erreurs Global ---
// (Le reste de votre middleware errorHandler comme précédemment)
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('--- GESTIONNAIRE D\'ERREURS GLOBAL ---');
  console.error('Message:', err.message);
  if (err.name === 'Error' && err.message.includes('L\'accès CORS pour cette origine n\'est pas autorisé.')) {
    // Erreur CORS spécifique générée par notre configuration
    error = new ErrorResponse(err.message, 403); // 403 Forbidden
  } else if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
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
  const multer = require('multer'); // Importer multer ici pour vérifier l'instance
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = new ErrorResponse('Le fichier est trop volumineux. La taille maximale est de 5MB.', 400);
    } else {
        error = new ErrorResponse(`Erreur d'upload de fichier: ${err.message}`, 400);
    }
  } else if (err.message === 'Seules les images sont autorisées!') {
    error = new ErrorResponse(err.message, 400);
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
