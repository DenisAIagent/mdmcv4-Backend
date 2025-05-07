// backend/app.js

// Charger les variables d'environnement (si vous utilisez un fichier .env)
// Assurez-vous que dotenv est installé (npm install dotenv) et configuré.
// Si votre fichier .env n'est pas à la racine du projet backend mais un niveau au-dessus,
// vous pourriez avoir besoin de spécifier le chemin : require('dotenv').config({ path: '../.env' });
// Pour cet exemple, je suppose qu'il est à la racine du backend ou que les variables sont déjà chargées.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config(); // Charger .env seulement en développement/test
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // Optionnel, pour le logging HTTP

// Importer la classe ErrorResponse et le gestionnaire d'erreurs global
const ErrorResponse = require('./utils/errorResponse'); // Chemin basé sur votre structure
const errorHandler = require('./middleware/errorHandler'); // Chemin basé sur votre structure (à créer si inexistant)

// --- Importer vos fichiers de routes ---
// Vérifiez les noms exacts de vos fichiers dans le dossier 'routes'
const authRoutes = require('./routes/auth.routes');         // Adaptez le nom du fichier si différent
const artistRoutes = require('./routes/artists.routes');    // Adaptez le nom du fichier si différent
const smartlinkRoutes = require('./routes/smartLinkRoutes'); // Celui que nous avons défini
const uploadRoutes = require('./routes/uploadRoutes');       // Adaptez le nom du fichier si différent (ex: upload.routes.js)
// Ajoutez d'autres routeurs ici selon votre projet (ex: chatbot, landingPage, marketing, reviews, user, wordpress)
// Exemple:
// const userRoutes = require('./routes/user.routes.js');
// const wordpressRoutes = require('./routes/wordpress.routes.js');


// Initialiser l'application Express
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

// Activer CORS
// Configurez l'origine pour correspondre à votre frontend en production.
// Pour le développement, '*' ou l'URL de votre dev frontend est souvent utilisé.
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // URL de votre frontend React
  credentials: true
}));

// Morgan pour le logging HTTP en mode développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Parser le corps des requêtes JSON
app.use(express.json());
// Parser le corps des requêtes URL-encoded
app.use(express.urlencoded({ extended: true }));
// Parser les cookies (nécessaire si votre middleware 'protect' lit les tokens des cookies)
app.use(cookieParser());

// Servir les fichiers statiques (si vous avez un dossier public pour des images par exemple)
// const path = require('path');
// app.use(express.static(path.join(__dirname, 'public')));


// --- Monter les Routeurs ---
// Toutes les routes seront préfixées par /api
app.use('/api/auth', authRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/smartlinks', smartlinkRoutes); // Nouveau routeur pour les SmartLinks
app.use('/api/upload', uploadRoutes);         // Si vous avez un routeur pour l'upload
// Montez vos autres routeurs ici :
// app.use('/api/users', userRoutes);
// app.use('/api/wordpress', wordpressRoutes);
// ... etc.

// Route de test simple pour l'API
app.get('/api', (req, res) => {
  res.status(200).json({ success: true, message: 'API MDMC Music Ads SmartLink Builder est opérationnelle !' });
});

// --- Middleware de Gestion d'Erreurs Global ---
// Ce middleware doit être défini APRÈS toutes les autres routes et middlewares.
// Si vous n'avez pas de fichier middleware/errorHandler.js, créez-le ou mettez la logique ici.
// Je vais inclure une version ici pour que ce fichier soit complet.
// Si vous avez déjà errorHandler.js, assurez-vous qu'il est similaire.
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log pour le développeur
  console.error('--- GESTIONNAIRE D\'ERREURS GLOBAL ---');
  console.error('Message:', err.message);
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) { // Plus de détails en dev
      console.error('Erreur Complète:', err);
      console.error('Stack:', err.stack);
  }
  console.error('------------------------------------');


  // Erreur Mongoose: ObjectId invalide (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    const message = `Ressource non trouvée. L'identifiant fourni est invalide: ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Erreur Mongoose: Duplication de champ unique (code 11000)
  if (err.code === 11000) {
    let field = Object.keys(err.keyValue)[0];
    let value = err.keyValue[field];
    // Rendre le message plus lisible
    field = field.charAt(0).toUpperCase() + field.slice(1); // Mettre la première lettre en majuscule
    const message = `Le champ '${field}' avec la valeur '${value}' existe déjà. Cette valeur doit être unique.`;
    error = new ErrorResponse(message, 400);
  }

  // Erreur Mongoose: Échec de validation (ValidationError)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = `Données invalides: ${messages.join('. ')}`;
    error = new ErrorResponse(message, 400);
  }

  // Erreurs JWT (gérées dans le middleware 'protect', mais en fallback ici)
  if (err.name === 'JsonWebTokenError') {
    const message = 'Authentification échouée (token invalide). Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401);
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Votre session a expiré. Veuillez vous reconnecter.';
    error = new ErrorResponse(message, 401);
  }

  // Réponse finale d'erreur au client
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur Interne du Serveur'
  });
});


// --- Démarrage du Serveur ---
const PORT = process.env.PORT || 5001; // J'ai changé le port par défaut au cas où le frontend utilise 5000

const server = app.listen(
  PORT,
  console.log(
    `Serveur démarré en mode ${process.env.NODE_ENV || 'inconnu (probablement development)'} sur le port ${PORT}`
  )
);

// Gérer les rejets de promesses non interceptés (erreurs asynchrones non gérées)
process.on('unhandledRejection', (err, promise) => {
  console.error(`ERREUR (Unhandled Rejection): ${err.message || err}`);
  // Fermer le serveur et quitter le processus proprement
  server.close(() => process.exit(1));
});

// Gérer les exceptions non interceptées (erreurs synchrones non gérées)
process.on('uncaughtException', (err) => {
    console.error(`ERREUR (Uncaught Exception): ${err.message || err}`);
    server.close(() => process.exit(1));
});

module.exports = app; // Utile pour les tests ou si vous séparez le démarrage du serveur
