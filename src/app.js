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

// Ajout de Puppeteer pour le rendu dynamique
const puppeteer = require('puppeteer');

// ---------------------------------------------------------------------------
// Dynamic rendering configuration
// ---------------------------------------------------------------------------
// Liste des user‑agents considérés comme des bots sociaux (Googlebot, Facebook, Twitter…)
const BOT_AGENTS = [
  'googlebot',
  'bingbot',
  'facebookexternalhit',
  'facebookcatalog',
  'facebook',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'slack',
  'discord'
];

// Cache en mémoire pour stocker les pages pré‑rendues et éviter des rendus répétitifs
const RENDER_CACHE = new Map();

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
const smartlinksHTMLRoutes = require('../routes/smartlinksHTML.routes'); // 🆕 Nouvelles routes HTML
const staticSmartlinksRoutes = require('../routes/staticSmartlinks.routes'); // 🆕 Routes HTML statiques
const shortLinksRoutes = require('../routes/shortLinks.routes');
const uploadRoutes = require('../routes/uploadRoutes');
const wordpressRoutes = require('../routes/wordpress.routes');
const analyticsRoutes = require('../routes/analytics');
const publicSmartLinkRoutes = require('../routes/smartlinks/publicSmartLink');
const staticPagesRoutes = require('../routes/staticPages.routes');

// Middleware SEO pour smartlinks
const { smartlinkSEOMiddleware } = require('../middleware/smartlinkSEO');
const { puppeteerSEOMiddleware } = require('../middleware/puppeteerSEO'); // 🆕 Middleware Puppeteer

// Ajoutez d'autres routeurs ici selon votre projet
// const userRoutes = require('../routes/user.routes.js');

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
// Configuration CORS complète pour développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
} else {
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://mdmcv7-frontend-production.up.railway.app',
      'https://smartlink.mdmcmusicads.com',
      'http://192.168.1.236:3000',
      'http://192.168.1.236:3001',
      'http://192.168.1.236:3002'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
  }));
}

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Note: Middleware Puppeteer supprimé - on utilise smartlinkSEOMiddleware existant

// --- 📄 SERVEUR DE FICHIERS STATIQUES HTML POUR SMARTLINKS ---
// Servir les pages statiques HTML générées pour les métadonnées Open Graph
app.use('/sl', express.static(path.join(__dirname, '..', 'public', 'sl')));

// --- 🆕 ARCHITECTURE HTML STATIQUE SMARTLINKS ---
// Routes HTML statiques pour SEO parfait (remplace Puppeteer)
// URLs directes : /smartlinks/:artistSlug/:trackSlug

// Route pour gérer les URLs avec hash (#) - redirection côté serveur
app.get('/', (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isSocialBot = /facebook|twitter|linkedinbot|whatsapp|telegram|discord|slack|bot|crawler|spider/i.test(userAgent);
  
  // Si c'est un bot social et qu'il y a un fragment dans le referer
  if (isSocialBot) {
    const referer = req.get('Referer') || '';
    const smartlinkMatch = referer.match(/#\/smartlinks\/([^\/]+)\/([^\/\?]+)/);
    
    if (smartlinkMatch) {
      const [, artistSlug, trackSlug] = smartlinkMatch;
      req.params = { artistSlug, trackSlug };
      return smartlinkSEOMiddleware(req, res, next);
    }
  }
  
  next();
});

// --- Monter les Routeurs ---
// 🔥 ARCHITECTURE HTML STATIQUE ACTIVÉE - PRIORITÉ ABSOLUE
app.use('/s', staticSmartlinksRoutes); // 🆕 Pages HTML statiques (AVANT TOUT)

// ✅ CORRECTION: Toutes les routes maintenant sur /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/artists', artistRoutes);

// ⭐ Routes publiques pour interface admin (AVANT les routes protégées)
const { fetchPlatformLinks, getAllSmartLinks, createSmartLink } = require('../controllers/smartLinkController');

app.get('/api/proxy/fetch-metadata', (req, res, next) => {
  // Passer l'URL depuis query params vers body
  req.body = { sourceUrl: req.query.url };
  fetchPlatformLinks(req, res, next);
});

app.post('/api/proxy/create-smartlink', createSmartLink);

app.get('/api/smartlinks', getAllSmartLinks);

// Routes publiques pour upload (compatibility)
app.use('/api/upload', uploadRoutes);

// Routes protégées
app.use('/api/v1/smartlinks', smartlinkRoutes);
app.use('/api/v1/smartlinks-html', smartlinksHTMLRoutes); // 🆕 API SmartLinks HTML
app.use('/api/v1/shortlinks', shortLinksRoutes);
app.use('/api/v1/wordpress', wordpressRoutes);
app.use('/api/wordpress', wordpressRoutes); // ⭐ Ajoutez cette ligne
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/static-pages', staticPagesRoutes);
app.use("/api/v1/reviews", require("../routes/reviews.routes"));
app.use("/api/simulator", require("../routes/simulator.routes"));
app.use("/api/newsletter", require("../routes/newsletter.routes"));

// --- 🎯 ROUTES SMARTLINKS HYBRIDES (FALLBACK APRÈS ROUTES STATIQUES) ---
// IMPORTANT: Cette route catch-all DOIT être APRÈS les routes statiques
app.use('/', publicSmartLinkRoutes);

// 🎯 ROUTE RACINE POUR SMARTLINKS (pour domaine smartlink.mdmcmusicads.com)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'MDMC SmartLinks Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    routes: {
      smartlinks_static: '/smartlinks/:artistSlug/:trackSlug',
      smartlinks_hybrid: '/s/:artistSlug/:trackSlug',
      api: '/api/v1'
    }
  });
});

// Route racine pour SmartLinks - page d'accueil
app.get('/', (req, res) => {
  // Si c'est une requête pour un SmartLink spécifique via query params
  const { artist, track } = req.query;
  if (artist && track) {
    return res.redirect(`/smartlinks/${artist}/${track}`);
  }
  
  // Page d'accueil simple pour le service SmartLinks
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MDMC SmartLinks Service</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 2rem;
          background: linear-gradient(135deg, #E50914 0%, #141414 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          text-align: center;
          max-width: 600px;
          background: rgba(255, 255, 255, 0.1);
          padding: 3rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.9; margin-bottom: 2rem; }
        .status { 
          background: rgba(40, 167, 69, 0.2);
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(40, 167, 69, 0.3);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎵 MDMC SmartLinks</h1>
        <p>Service de distribution de liens musicaux intelligents</p>
        <div class="status">
          <strong>✅ Service opérationnel</strong><br>
          Version 1.0.0 | ${new Date().toISOString()}
        </div>
        <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
          Format d'URL : /smartlinks/{artiste}/{titre}
        </p>
      </div>
    </body>
    </html>
  `);
});

// ✅ CORRECTION: Route principale API v1
app.get('/api/v1', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API MDMC Music Ads v1 est opérationnelle !',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      artists: '/api/v1/artists',
      smartlinks: '/api/v1/smartlinks',
      shortlinks: '/api/v1/shortlinks',
      upload: '/api/v1/upload',
      wordpress: '/api/v1/wordpress',
      reviews: '/api/v1/reviews',
      'static-pages': '/api/v1/static-pages'
    }
  });
});

// ✅ CORRECTION: Maintenir compatibilité ancienne route
app.get('/api', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API MDMC Music Ads est opérationnelle !',
    note: 'Utilisez /api/v1 pour les nouvelles requêtes'
  });
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
  '0.0.0.0',
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
