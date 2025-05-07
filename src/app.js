// backend/app.js (ou server.js)

// Charger les variables d'environnement depuis le fichier .env (si vous en utilisez un)
// require('dotenv').config(); // Si vous utilisez dotenv, sinon assurez-vous que vos variables d'env sont chargées
// Pour un projet avec import/export ES6 (si package.json a "type": "module"):
// import dotenv from 'dotenv';
// dotenv.config();

const express = require('express');
const mongoose = require('mongoose'); // Si vous utilisez Mongoose pour MongoDB
const cors = require('cors'); // Pour gérer les requêtes Cross-Origin
const cookieParser = require('cookie-parser'); // Pour parser les cookies (utile si JWT est dans les cookies)
const morgan = require('morgan'); // Pour le logging HTTP (optionnel, utile en développement)

// Importer la classe ErrorResponse (si vous l'utilisez)
const ErrorResponse = require('./utils/errorResponse'); // Adaptez le chemin
// Importer le middleware de gestion d'erreurs global
const errorHandler = require('./middleware/errorHandler'); // Adaptez le chemin (nous allons le définir ci-dessous aussi)

// --- Importer vos fichiers de routes ---
const authRoutes = require('./routes/authRoutes');             // Exemple, adaptez le chemin
const artistRoutes = require('./routes/artistRoutes');         // Exemple, adaptez le chemin
const smartlinkRoutes = require('./routes/smartlinkRoutes');   // NOUVEAU, adaptez le chemin
const uploadRoutes = require('./routes/uploadRoutes');         // Exemple, adaptez le chemin
// Ajoutez d'autres routeurs ici si nécessaire

// Initialiser l'application Express
const app = express();

// --- Connexion à la base de données MongoDB (Exemple avec Mongoose) ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Options pour éviter les avertissements de dépréciation Mongoose
      // useNewUrlParser: true, // Plus nécessaire dans Mongoose 6+
      // useUnifiedTopology: true, // Plus nécessaire dans Mongoose 6+
      // useCreateIndex: true, // Plus nécessaire, les index sont créés via schema.index()
      // useFindAndModify: false, // Plus nécessaire
    });
    console.log(`MongoDB Connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`);
    process.exit(1); // Quitter le processus avec échec
  }
};

connectDB(); // Appeler la fonction de connexion

// --- Middlewares ---

// Activer CORS pour toutes les routes (ou configurez des options spécifiques)
// Exemple de configuration CORS plus permissive pour le développement :
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL de votre frontend
  credentials: true // Important si vous utilisez des cookies ou des sessions
}));

// Morgan pour le logging HTTP en mode développement (optionnel)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Parser le corps des requêtes JSON
app.use(express.json());
// Parser le corps des requêtes URL-encoded
app.use(express.urlencoded({ extended: true }));
// Parser les cookies
app.use(cookieParser());

// --- Monter les Routeurs ---
// Les routes seront préfixées par /api
app.use('/api/auth', authRoutes);             // Ex: /api/auth/login, /api/auth/register
app.use('/api/artists', artistRoutes);         // Ex: /api/artists, /api/artists/:slugOrId
app.use('/api/smartlinks', smartlinkRoutes);   // Ex: /api/smartlinks, /api/smartlinks/:id
app.use('/api/upload', uploadRoutes);         // Ex: /api/upload/image

// Route de test simple pour vérifier que le serveur fonctionne
app.get('/api', (req, res) => {
  res.json({ message: 'API MDMC Music Ads SmartLink Builder fonctionne !' });
});

// --- Middleware de Gestion d'Erreurs Global ---
// Doit être défini APRÈS toutes les autres routes et middlewares.
// Si vous avez créé un fichier séparé (ex: middleware/errorHandler.js), importez-le.
// Sinon, vous pouvez définir la logique ici :
app.use((err, req, res, next) => {
  let error = { ...err }; // Crée une copie de l'objet erreur
  error.message = err.message; // S'assurer que le message est copié

  // Log de l'erreur pour le développeur (console ou un système de logging)
  console.error('-------------------- ERROR LOG --------------------');
  console.error('Message:', error.message);
  if (process.env.NODE_ENV === 'development') { // Afficher la stack trace seulement en dev
    console.error('Stack Trace:', err.stack);
  }
  console.error('-------------------------------------------------');


  // Erreur Mongoose: ObjectId invalide (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = `Ressource non trouvée. ID invalide: ${err.value}`;
    error = new ErrorResponse(message, 404); // Utilise votre classe ErrorResponse
  }

  // Erreur Mongoose: Duplication de champ unique (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `La valeur '${value}' pour le champ '${field}' existe déjà. Veuillez en choisir une autre.`;
    error = new ErrorResponse(message, 400); // 400 Bad Request
  }

  // Erreur Mongoose: Échec de validation (ValidationError)
  if (err.name === 'ValidationError') {
    // Concatène tous les messages d'erreur de validation
    // Ou retourne seulement le premier pour la simplicité : Object.values(err.errors).map(val => val.message)[0]
    const messages = Object.values(err.errors).map(val => val.message).join('. ');
    const message = `Erreur de validation des données: ${messages}`;
    error = new ErrorResponse(message, 400); // 400 Bad Request
  }

  // Erreur JWT: Token invalide ou expiré (géré dans le middleware 'protect')
  // Si ErrorResponse est déjà utilisé dans 'protect', cette section peut ne pas être nécessaire ici
  // si 'protect' appelle déjà next() avec une instance d'ErrorResponse.
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token invalide. Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401); // 401 Unauthorized
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Votre session a expiré. Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401); // 401 Unauthorized
  }

  // Réponse finale d'erreur au client
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur Interne du Serveur',
    // data: null // Optionnel
  });
});


// --- Démarrage du Serveur ---
const PORT = process.env.PORT || 5000; // Utiliser le port défini dans .env ou 5000 par défaut

const server = app.listen(
  PORT,
  console.log(
    `Serveur démarré en mode ${process.env.NODE_ENV || 'development'} sur le port ${PORT}`
  )
);

// Gérer les rejets de promesses non interceptés (erreurs globales)
process.on('unhandledRejection', (err, promise) => {
  console.error(`Erreur non gérée (Unhandled Rejection): ${err.message}`);
  // Fermer le serveur et quitter le processus proprement
  server.close(() => process.exit(1));
});

// Gérer les exceptions non interceptées
process.on('uncaughtException', (err) => {
    console.error(`Exception non gérée (Uncaught Exception): ${err.message}`);
    server.close(() => process.exit(1));
});
