// middleware/smartlinkSEO.js
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');
const fs = require('fs').promises;
const path = require('path');

/**
 * Middleware pour servir du HTML dynamique avec métadonnées SEO pour les smartlinks
 * Intercept les requêtes vers les smartlinks et génère du HTML avec Open Graph optimisé
 */
const smartlinkSEOMiddleware = async (req, res, next) => {
  const { artistSlug, trackSlug } = req.params;
  
  // Seulement traiter les requêtes vers les smartlinks avec un User-Agent de bot social
  const userAgent = req.get('User-Agent') || '';
  const isSocialBot = /facebook|twitter|linkedinbot|whatsapp|telegram|discord|slack/i.test(userAgent);
  const isBot = /bot|crawler|spider|facebook|twitter|linkedin|whatsapp|telegram|discord|slack/i.test(userAgent);
  
  // En dev, on peut forcer le traitement pour tester
  const forceSEO = req.query.seo === 'true' || process.env.NODE_ENV === 'development';
  
  if (!isSocialBot && !forceSEO) {
    return next();
  }

  try {
    console.log(`🤖 Bot détecté: ${userAgent}`);
    console.log(`🔗 Génération SEO pour: /${artistSlug}/${trackSlug}`);

    // Chercher le smartlink dans la base de données
    const smartLink = await SmartLink.findOne({ 
      trackSlug: trackSlug,
      isPublished: true 
    }).populate('artistId');

    if (!smartLink || !smartLink.artistId) {
      return next(); // Laisser React gérer la 404
    }

    // Vérifier que l'artist slug correspond
    if (smartLink.artistId.slug !== artistSlug) {
      return next();
    }

    // Construire les métadonnées
    const metadata = {
      title: `${smartLink.trackTitle} - ${smartLink.artistId.name}`,
      description: smartLink.description || `Listen to ${smartLink.trackTitle} by ${smartLink.artistId.name} on your favorite music platform. Available on Spotify, Apple Music, YouTube and more.`,
      image: smartLink.coverImageUrl || 'https://www.mdmcmusicads.com/assets/images/logo.png',
      url: `https://www.mdmcmusicads.com/#/smartlinks/${artistSlug}/${trackSlug}`,
      siteName: 'MDMC Music Ads',
      type: 'music.song',
      artist: smartLink.artistId.name,
      releaseDate: smartLink.releaseDate ? smartLink.releaseDate.toISOString().split('T')[0] : null
    };

    // Générer le HTML avec métadonnées
    const html = generateSEOHTML(metadata);
    
    // Définir les headers appropriés
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      'X-Robots-Tag': 'index, follow'
    });

    return res.send(html);

  } catch (error) {
    console.error('❌ Erreur SEO middleware:', error);
    return next(); // En cas d'erreur, laisser React gérer
  }
};

/**
 * Génère le HTML avec métadonnées Open Graph optimisées
 */
function generateSEOHTML(metadata) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${metadata.title}</title>
    <meta name="title" content="${metadata.title}">
    <meta name="description" content="${metadata.description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="${metadata.type}">
    <meta property="og:url" content="${metadata.url}">
    <meta property="og:title" content="${metadata.title}">
    <meta property="og:description" content="${metadata.description}">
    <meta property="og:image" content="${metadata.image}">
    <meta property="og:site_name" content="${metadata.siteName}">
    ${metadata.artist ? `<meta property="music:musician" content="${metadata.artist}">` : ''}
    ${metadata.releaseDate ? `<meta property="music:release_date" content="${metadata.releaseDate}">` : ''}
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${metadata.url}">
    <meta property="twitter:title" content="${metadata.title}">
    <meta property="twitter:description" content="${metadata.description}">
    <meta property="twitter:image" content="${metadata.image}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/assets/images/favicon.png">
    
    <!-- Preload critical resources -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Auto-redirect to React app -->
    <meta http-equiv="refresh" content="0; url=${metadata.url}">
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-P11JTJ21NZ"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-P11JTJ21NZ');
    </script>
</head>
<body>
    <!-- Content visible en cas de redirect fail -->
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; text-align: center;">
        <img src="${metadata.image}" alt="${metadata.title}" style="max-width: 200px; border-radius: 12px; margin-bottom: 20px;">
        <h1 style="color: #333; margin-bottom: 10px;">${metadata.title}</h1>
        <p style="color: #666; margin-bottom: 20px; max-width: 500px;">${metadata.description}</p>
        <a href="${metadata.url}" style="background: #1db954; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
            Écouter maintenant →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Redirection automatique en cours...
        </p>
    </div>
    
    <!-- Fallback redirect script -->
    <script>
        setTimeout(function() {
            window.location.href = '${metadata.url}';
        }, 100);
    </script>
</body>
</html>`;
}

module.exports = { smartlinkSEOMiddleware };