/**
 * Configuration de l'application Express pour MDMC Music Ads v4
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

// Initialisation de l'application Express
const app = express();

// Middleware de base
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging en développement
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Importation des routes
const authRoutes = require('./routes/auth.routes');
const smartlinkRoutes = require('./routes/smartlink.routes');

// Définition des routes
app.use('/api/auth', authRoutes);
app.use('/api/smartlinks', smartlinkRoutes);

// Route de base pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API MDMC Music Ads v4' });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

module.exports = app;
