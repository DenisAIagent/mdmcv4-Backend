// backend/src/app.js

if (process.env.NODE_ENV !== 'production') {
  // Si .env est à la racine du projet backend (un niveau au-dessus de src)
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path'); // Inclus pour la construction de chemin pour dotenv

// Importer la classe ErrorResponse et le gestionnaire d'erreurs global
const ErrorResponse = require('../utils/errorResponse'); // Chemin corrigé
// const errorHandler = require('../middleware/errorHandler'); // Chemin corrigé (si vous avez un fichier séparé)

// --- Importer vos fichiers de routes ---
const authRoutes = require('../routes/auth.routes');         // Adaptez le nom du fichier si différent
const artistRoutes = require('../routes/artists.routes');    // Adaptez le nom du fichier si différent
const smartlinkRoutes = require('../routes/smartLinkRoutes');
const uploadRoutes = require('../routes/uploadRoutes');       // Assurez-vous que ce fichier existe dans routes/
// Ajoutez d'autres routeurs ici selon votre projet
// const userRoutes = require('../routes/user.routes.js');
// const wordpressRoutes = require('../routes/wordpress.routes.js');

const app = express();

// --- Connexion à la base de données MongoDB ---
const connectDB = async () => {
  try {
    // MODIFIÉ ICI pour utiliser MONGODB_URI (avec DB)
    if (!process.env.MONGODB_URI) {
      console.error('ERREUR: La variable d\'environnement MONGODB_URI n\'est pas définie.');
      process.exit(1);
    }
    // MODIFIÉ ICI pour utiliser MONGODB_URI (avec DB)
    const conn = await mongoose.connect(process.env.MONGODB_URI);
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

app.get('/api', (req, res) => {
  res.status(200).json({ success: true, message: 'API MDMC Music Ads SmartLink Builder est opérationnelle !' });
});

// --- Middleware de Gestion d'Erreurs Global ---
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
  // Gérer les erreurs de Multer (si vous l'utilisez pour l'upload)
  // Assurez-vous d'importer multer si vous le référencez directement ici (MulterError)
  // const multer = require('multer'); // Si besoin d'importer pour instanceof MulterError
  if (err.name === 'MulterError') { // Vérifier si l'erreur est une instance de MulterError
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
