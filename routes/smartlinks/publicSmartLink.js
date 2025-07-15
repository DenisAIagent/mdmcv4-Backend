// routes/smartlinks/publicSmartLink.js
// Route pour servir les SmartLinks avec analytics statiques

const express = require('express');
const SmartLinkGenerator = require('./smartlinkGenerator');
const SmartLink = require('../../models/SmartLink');
const Artist = require('../../models/Artist');
const router = express.Router();

// Instance du générateur
const smartLinkGenerator = new SmartLinkGenerator();

/**
 * 🎯 ROUTE PRINCIPALE POUR SMARTLINKS HYBRIDES
 * 
 * GET /s/:artistSlug/:trackSlug
 * Sert une page HTML statique avec analytics pré-injectés
 */
router.get('/s/:artistSlug/:trackSlug', async (req, res) => {
  try {
    const { artistSlug, trackSlug } = req.params;
    
    console.log(`🎯 Requête SmartLink: ${artistSlug}/${trackSlug}`);
    console.log(`🌍 User-Agent: ${req.get('User-Agent')}`);
    console.log(`🌍 IP: ${req.ip}`);
    
    // 🔍 Recherche de l'artiste
    const artist = await Artist.findOne({ slug: artistSlug });
    if (!artist) {
      console.log(`❌ Artiste non trouvé: ${artistSlug}`);
      return res.status(404).send(generateNotFoundPage('Artiste non trouvé'));
    }
    
    // 🔍 Recherche du SmartLink
    const smartLink = await SmartLink.findOne({
      slug: trackSlug,
      artistId: artist._id,
      isPublished: true
    }).populate('artistId');
    
    if (!smartLink) {
      console.log(`❌ SmartLink non trouvé: ${trackSlug}`);
      return res.status(404).send(generateNotFoundPage('SmartLink non trouvé'));
    }
    
    // 📊 Incrémenter le compteur de vues (asynchrone)
    incrementViewCount(smartLink._id);
    
    // 🎯 Vérification des analytics
    const hasAnalytics = smartLink.trackingIds && (
      smartLink.trackingIds.ga4Id ||
      smartLink.trackingIds.gtmId ||
      smartLink.trackingIds.metaPixelId ||
      smartLink.trackingIds.tiktokPixelId
    );
    
    console.log(`🎯 Analytics disponibles: ${hasAnalytics}`);
    if (hasAnalytics) {
      console.log(`🎯 IDs de tracking:`, {
        ga4: !!smartLink.trackingIds.ga4Id,
        gtm: !!smartLink.trackingIds.gtmId,
        meta: !!smartLink.trackingIds.metaPixelId,
        tiktok: !!smartLink.trackingIds.tiktokPixelId
      });
    }
    
    // 🎨 Génération de la page HTML avec analytics
    const result = await smartLinkGenerator.generateSmartLink(
      smartLink.toObject(),
      artist.toObject(),
      {
        baseUrl: `${req.protocol}://${req.get('host')}`,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
    
    if (!result.success) {
      console.error(`❌ Erreur génération SmartLink:`, result.error);
      return res.status(500).send(result.fallbackHtml);
    }
    
    // 🌐 Headers optimisés pour SEO et performance
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300', // Cache 5 minutes
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      // Headers Open Graph dynamiques
      'X-OG-Title': result.meta.title,
      'X-OG-Description': result.meta.description,
      'X-OG-Image': result.meta.image,
      'X-OG-URL': result.meta.url
    });
    
    console.log(`✅ SmartLink servi avec succès: ${smartLink.trackTitle} - ${artist.name}`);
    
    // 📊 Log pour monitoring
    logSmartLinkAccess({
      smartLinkId: smartLink._id,
      artistSlug,
      trackSlug,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      hasAnalytics,
      timestamp: new Date()
    });
    
    // 🎯 Envoi de la page HTML générée
    res.send(result.html);
    
  } catch (error) {
    console.error('❌ Erreur serveur SmartLink:', error);
    res.status(500).send(generateErrorPage(error.message));
  }
});

/**
 * 🎯 ROUTE API POUR DONNÉES JSON (pour React/SPA)
 * 
 * GET /api/v1/smartlinks/:artistSlug/:trackSlug
 * Retourne les données JSON pour les applications React
 */
router.get('/api/v1/smartlinks/:artistSlug/:trackSlug', async (req, res) => {
  try {
    const { artistSlug, trackSlug } = req.params;
    
    // Recherche identique à la route HTML
    const artist = await Artist.findOne({ slug: artistSlug });
    if (!artist) {
      return res.status(404).json({
        success: false,
        error: 'Artiste non trouvé'
      });
    }
    
    const smartLink = await SmartLink.findOne({
      slug: trackSlug,
      artistId: artist._id,
      isPublished: true
    }).populate('artistId');
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    // Incrémenter vues
    incrementViewCount(smartLink._id);
    
    // Retour JSON
    res.json({
      success: true,
      data: {
        smartLink: smartLink.toObject(),
        artist: artist.toObject()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur API SmartLink:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 📊 ROUTE DE TRACKING DES CLICS
 * 
 * POST /api/v1/smartlinks/:id/log-platform-click
 * Enregistre les clics sur les plateformes
 */
router.post('/api/v1/smartlinks/:id/log-platform-click', async (req, res) => {
  try {
    const { id } = req.params;
    const { platformName } = req.body;
    
    if (!platformName) {
      return res.status(400).json({
        success: false,
        error: 'Nom de plateforme requis'
      });
    }
    
    console.log(`📊 Tracking clic: ${platformName} sur SmartLink ${id}`);
    
    const smartLink = await SmartLink.findById(id);
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        error: 'SmartLink non trouvé'
      });
    }
    
    // Initialiser les compteurs si nécessaire
    if (!smartLink.platformClickCount) smartLink.platformClickCount = 0;
    if (!smartLink.platformClickStats) smartLink.platformClickStats = {};
    
    // Incrémenter les compteurs
    smartLink.platformClickCount += 1;
    const currentCount = smartLink.platformClickStats[platformName] || 0;
    smartLink.platformClickStats[platformName] = currentCount + 1;
    
    // Sauvegarder
    await smartLink.save();
    
    console.log(`✅ Clic enregistré: ${platformName} (${currentCount + 1} clics)`);
    
    res.json({
      success: true,
      data: {
        totalClicks: smartLink.platformClickCount,
        platformClicks: currentCount + 1,
        platform: platformName
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur tracking clic:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 🔄 FONCTIONS UTILITAIRES
 */

// Incrémenter le compteur de vues (asynchrone)
async function incrementViewCount(smartLinkId) {
  try {
    await SmartLink.findByIdAndUpdate(
      smartLinkId,
      { $inc: { viewCount: 1 } },
      { new: false }
    );
    console.log(`📊 Vue incrémentée pour SmartLink ${smartLinkId}`);
  } catch (error) {
    console.error('❌ Erreur incrémentation vue:', error);
  }
}

// Logger les accès SmartLink
function logSmartLinkAccess(data) {
  // Ici vous pourriez envoyer vers un service de logging externe
  // comme Datadog, New Relic, ou simplement dans un fichier de log
  console.log(`📊 SmartLink Access:`, {
    id: data.smartLinkId,
    path: `${data.artistSlug}/${data.trackSlug}`,
    analytics: data.hasAnalytics,
    userAgent: data.userAgent?.substring(0, 100) + '...',
    timestamp: data.timestamp.toISOString()
  });
}

// Page 404 personnalisée
function generateNotFoundPage(message) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartLink - Non trouvé</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        h1 { color: #e74c3c; margin-bottom: 20px; font-size: 48px; }
        h2 { color: #333; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .home-link {
            display: inline-block;
            padding: 12px 24px;
            background: #007AFF;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>😕</h1>
        <h2>SmartLink non trouvé</h2>
        <p>${message}</p>
        <p>Ce SmartLink n'existe pas ou n'est plus disponible.</p>
        <a href="/" class="home-link">Retour à l'accueil</a>
    </div>
</body>
</html>`;
}

// Page d'erreur personnalisée
function generateErrorPage(error) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartLink - Erreur</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        h1 { color: #e74c3c; margin-bottom: 20px; font-size: 48px; }
        h2 { color: #333; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        .retry-btn {
            display: inline-block;
            padding: 12px 24px;
            background: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            border: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️</h1>
        <h2>Erreur temporaire</h2>
        <p>Une erreur est survenue lors du chargement de ce SmartLink.</p>
        <p style="font-size: 12px; color: #999;">${error}</p>
        <button class="retry-btn" onclick="window.location.reload()">Réessayer</button>
    </div>
</body>
</html>`;
}

module.exports = router;