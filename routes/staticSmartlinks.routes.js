// Routes pour servir les SmartLinks HTML statiques
// Gère la distribution des fichiers HTML générés

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const StaticHtmlGenerator = require('../services/staticHtmlGenerator');

const router = express.Router();
const htmlGenerator = new StaticHtmlGenerator();

// Middleware pour logs des requêtes SmartLinks
const logSmartLinkAccess = (req, res, next) => {
  const { artistSlug, trackSlug } = req.params;
  const userAgent = req.get('User-Agent') || '';
  const isBot = /bot|crawler|spider|facebook|twitter|whatsapp|telegram|slack/i.test(userAgent);
  
  console.log(`📊 SmartLink access: ${artistSlug}/${trackSlug} - ${isBot ? 'Bot' : 'User'} - ${userAgent.substring(0, 50)}`);
  
  // Ajout d'headers pour le cache
  if (isBot) {
    res.set({
      'Cache-Control': 'public, max-age=3600', // Cache 1h pour les bots
      'X-Served-By': 'Static-HTML',
      'X-Content-Type': 'text/html'
    });
  } else {
    res.set({
      'Cache-Control': 'public, max-age=300', // Cache 5min pour les utilisateurs
      'X-Served-By': 'Static-HTML'
    });
  }
  
  next();
};

/**
 * GET /smartlinks/:artistSlug/:trackSlug
 * Sert le fichier HTML statique pour un SmartLink
 */
router.get('/:artistSlug/:trackSlug', logSmartLinkAccess, async (req, res) => {
  try {
    const { artistSlug, trackSlug } = req.params;
    
    // Validation des paramètres
    if (!artistSlug || !trackSlug) {
      return res.status(400).json({
        error: 'Paramètres manquants',
        message: 'artistSlug et trackSlug sont requis'
      });
    }
    
    // Vérification de l'existence du fichier HTML
    const filePath = htmlGenerator.getFilePath(artistSlug, trackSlug);
    const fileExists = await htmlGenerator.htmlFileExists(artistSlug, trackSlug);
    
    if (!fileExists) {
      console.log(`❌ SmartLink HTML non trouvé: ${filePath}`);
      
      // Tentative de régénération depuis la base de données
      try {
        const SmartLink = require('../models/SmartLink');
        const smartlink = await SmartLink.findOne({
          slug: trackSlug,
          isPublished: true
        }).populate('artistId');
        
        if (smartlink) {
          console.log(`🔄 Régénération HTML pour: ${artistSlug}/${trackSlug}`);
          
          // Reformatage des données pour le générateur
          const smartlinkData = {
            trackTitle: smartlink.trackTitle,
            slug: smartlink.slug,
            description: smartlink.description,
            subtitle: smartlink.subtitle,
            coverImageUrl: smartlink.coverImageUrl,
            platformLinks: smartlink.platformLinks,
            artist: {
              name: smartlink.artistId.name,
              slug: smartlink.artistId.slug
            }
          };
          
          // Génération du fichier HTML
          await htmlGenerator.generateSmartLinkHtml(smartlinkData);
          
          // Redirection vers le fichier généré
          return res.redirect(req.originalUrl);
        }
      } catch (dbError) {
        console.error('❌ Erreur accès base de données:', dbError);
      }
      
      // Page 404 personnalisée pour SmartLinks
      return res.status(404).send(generateNotFoundPage(artistSlug, trackSlug));
    }
    
    // Lecture et envoi du fichier HTML
    try {
      const htmlContent = await fs.readFile(filePath, 'utf8');
      
      // Headers de sécurité
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });
      
      res.send(htmlContent);
      
      // Log analytique asynchrone (sans bloquer la réponse)
      setImmediate(() => {
        logSmartLinkView(artistSlug, trackSlug, req);
      });
      
    } catch (readError) {
      console.error('❌ Erreur lecture fichier HTML:', readError);
      res.status(500).send(generateErrorPage('Erreur de lecture du SmartLink'));
    }
    
  } catch (error) {
    console.error('❌ Erreur route SmartLinks statiques:', error);
    res.status(500).send(generateErrorPage('Erreur serveur'));
  }
});

/**
 * GET /smartlinks/:artistSlug/:trackSlug/preview
 * Prévisualisation d'un SmartLink (pour l'admin)
 */
router.get('/:artistSlug/:trackSlug/preview', async (req, res) => {
  try {
    const { artistSlug, trackSlug } = req.params;
    
    // Vérification des permissions admin (optionnel)
    // const isAdmin = req.user && req.user.role === 'admin';
    
    const filePath = htmlGenerator.getFilePath(artistSlug, trackSlug);
    const fileExists = await htmlGenerator.htmlFileExists(artistSlug, trackSlug);
    
    if (!fileExists) {
      return res.status(404).json({
        error: 'SmartLink non trouvé',
        message: `Aucun fichier HTML pour ${artistSlug}/${trackSlug}`
      });
    }
    
    const htmlContent = await fs.readFile(filePath, 'utf8');
    
    // Ajout d'un bandeau de prévisualisation
    const previewBanner = `
      <div style="position: fixed; top: 0; left: 0; right: 0; background: #E50914; color: white; padding: 8px; text-align: center; z-index: 9999; font-family: system-ui;">
        <strong>MODE PRÉVISUALISATION</strong> - SmartLink: ${artistSlug}/${trackSlug}
      </div>
      <style>body { margin-top: 40px !important; }</style>
    `;
    
    const htmlWithBanner = htmlContent.replace('</head>', `${previewBanner}</head>`);
    
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlWithBanner);
    
  } catch (error) {
    console.error('❌ Erreur prévisualisation SmartLink:', error);
    res.status(500).json({ error: 'Erreur de prévisualisation' });
  }
});

/**
 * POST /smartlinks/regenerate
 * Régénère tous les SmartLinks HTML (maintenance)
 */
router.post('/regenerate', async (req, res) => {
  try {
    // Vérification permissions admin
    // if (!req.user || req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Accès non autorisé' });
    // }
    
    const SmartLink = require('../models/SmartLink');
    const smartlinks = await SmartLink.find({ isPublished: true }).populate('artistId');
    
    if (smartlinks.length === 0) {
      return res.json({
        message: 'Aucun SmartLink à régénérer',
        count: 0
      });
    }
    
    // Formatage des données pour le générateur
    const smartlinksData = smartlinks.map(smartlink => ({
      trackTitle: smartlink.trackTitle,
      slug: smartlink.slug,
      description: smartlink.description,
      subtitle: smartlink.subtitle,
      coverImageUrl: smartlink.coverImageUrl,
      platformLinks: smartlink.platformLinks,
      artist: {
        name: smartlink.artistId.name,
        slug: smartlink.artistId.slug
      }
    }));
    
    // Régénération de tous les SmartLinks
    const results = await htmlGenerator.regenerateAllSmartLinks(smartlinksData);
    
    res.json({
      message: 'Régénération terminée',
      total: smartlinks.length,
      success: results.success.length,
      errors: results.errors.length,
      details: results.errors.length > 0 ? results.errors : undefined
    });
    
  } catch (error) {
    console.error('❌ Erreur régénération SmartLinks:', error);
    res.status(500).json({
      error: 'Erreur de régénération',
      message: error.message
    });
  }
});

/**
 * GET /smartlinks/stats
 * Statistiques des SmartLinks HTML statiques
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await htmlGenerator.getStats();
    
    res.json({
      message: 'Statistiques SmartLinks HTML',
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    res.status(500).json({
      error: 'Erreur de statistiques',
      message: error.message
    });
  }
});

/**
 * Log analytique d'une vue de SmartLink
 * @param {string} artistSlug - Slug de l'artiste
 * @param {string} trackSlug - Slug du titre
 * @param {Object} req - Objet request Express
 */
async function logSmartLinkView(artistSlug, trackSlug, req) {
  try {
    // Ici on pourrait intégrer avec une base de données d'analytics
    // ou envoyer vers un service externe comme Google Analytics Measurement Protocol
    
    const viewData = {
      artistSlug,
      trackSlug,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      ip: req.ip,
      isBot: /bot|crawler|spider|facebook|twitter|whatsapp|telegram|slack/i.test(req.get('User-Agent') || '')
    };
    
    console.log('📊 SmartLink view logged:', viewData);
    
    // TODO: Intégration avec système d'analytics
    // await AnalyticsService.logSmartLinkView(viewData);
    
  } catch (error) {
    console.error('❌ Erreur log analytics:', error);
  }
}

/**
 * Génère une page 404 personnalisée pour les SmartLinks
 * @param {string} artistSlug - Slug de l'artiste
 * @param {string} trackSlug - Slug du titre
 * @returns {string} - HTML de la page 404
 */
function generateNotFoundPage(artistSlug, trackSlug) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SmartLink non trouvé | MDMC Music Ads</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 1rem;
          color: #495057;
        }
        .container {
          text-align: center;
          max-width: 400px;
          background: white;
          padding: 3rem 2rem;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .error-code {
          font-size: 4rem;
          font-weight: 700;
          color: #E50914;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #141414;
        }
        p {
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        .smartlink-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 2rem;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .btn {
          background: #E50914;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 500;
          display: inline-block;
          transition: all 0.3s ease;
        }
        .btn:hover {
          background: #c4070f;
          transform: translateY(-2px);
        }
        .footer {
          margin-top: 2rem;
          font-size: 0.8rem;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-code">404</div>
        <h1>SmartLink non trouvé</h1>
        <p>Le SmartLink que vous recherchez n'existe pas ou a été supprimé.</p>
        
        <div class="smartlink-info">
          Artiste: ${artistSlug}<br>
          Titre: ${trackSlug}
        </div>
        
        <a href="https://www.mdmcmusicads.com" class="btn">
          Retour à l'accueil
        </a>
        
        <div class="footer">
          <p>Powered by <strong>MDMC Music Ads</strong><br>
          <em>Marketing musical qui convertit</em></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Génère une page d'erreur générique
 * @param {string} message - Message d'erreur
 * @returns {string} - HTML de la page d'erreur
 */
function generateErrorPage(message) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Erreur | MDMC SmartLinks</title>
      <style>
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 1rem;
        }
        .container {
          text-align: center;
          max-width: 400px;
          background: white;
          padding: 3rem 2rem;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .error-icon { font-size: 3rem; margin-bottom: 1rem; }
        h1 { color: #E50914; margin-bottom: 1rem; }
        p { color: #495057; margin-bottom: 2rem; }
        .btn {
          background: #E50914;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>Erreur</h1>
        <p>${message}</p>
        <a href="https://www.mdmcmusicads.com" class="btn">Retour à l'accueil</a>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;