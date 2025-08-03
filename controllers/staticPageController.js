// controllers/staticPageController.js
// Contrôleur pour la génération de pages statiques HTML pour métadonnées Open Graph

const fs = require('fs').promises;
const path = require('path');
const SmartLink = require('../models/SmartLink');

/**
 * Génère une page HTML statique pour un SmartLink
 * POST /api/v1/static-pages/generate
 */
const generateStaticPage = async (req, res) => {
  try {
    const {
      smartlinkId,
      shortId,
      trackTitle,
      artistName,
      coverImageUrl,
      description,
      platforms = []
    } = req.body;

    console.log(`📄 [Static Page] Génération pour: ${shortId}`);

    // Validation des données requises
    if (!shortId || !trackTitle || !artistName || !coverImageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes: shortId, trackTitle, artistName, coverImageUrl requis',
        received: { shortId, trackTitle, artistName, coverImageUrl: !!coverImageUrl }
      });
    }

    // Générer le HTML avec métadonnées Open Graph
    const html = generateStaticHTML({
      shortId,
      trackTitle,
      artistName,
      coverImageUrl,
      description: description || `Écoutez ${trackTitle} de ${artistName} sur toutes les plateformes de streaming`,
      platforms
    });

    // Chemin de destination pour le fichier HTML
    const staticDir = path.join(process.cwd(), 'public', 'sl');
    const filePath = path.join(staticDir, `${shortId}.html`);

    try {
      // Créer le dossier si nécessaire
      await fs.mkdir(staticDir, { recursive: true });

      // Sauvegarder le fichier HTML
      await fs.writeFile(filePath, html, 'utf8');

      console.log(`✅ [Static Page] Sauvegardée: ${filePath}`);

      // Mettre à jour le SmartLink avec l'URL de la page statique (non bloquant)
      if (smartlinkId) {
        try {
          await SmartLink.findByIdAndUpdate(smartlinkId, {
            staticPageUrl: `https://www.mdmcmusicads.com/sl/${shortId}.html`,
            staticPageGenerated: true,
            staticPageGeneratedAt: new Date()
          }, { timeout: 5000 }); // Timeout de 5s
          console.log(`✅ [Static Page] SmartLink mis à jour: ${smartlinkId}`);
        } catch (dbError) {
          console.warn(`⚠️ [Static Page] Échec mise à jour DB (non critique): ${dbError.message}`);
          // Ne pas faire échouer la réponse si juste la DB qui pose problème
        }
      }

      res.json({
        success: true,
        message: 'Page statique générée avec succès',
        data: {
          url: `https://www.mdmcmusicads.com/sl/${shortId}.html`,
          filePath: `/sl/${shortId}.html`,
          shortId,
          fileSize: html.length,
          dbUpdated: smartlinkId ? 'attempted' : 'skipped'
        }
      });

    } catch (fileError) {
      console.error('❌ [Static Page] Erreur fichier:', fileError);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'écriture du fichier',
        error: fileError.message
      });
    }

  } catch (error) {
    console.error('❌ [Static Page] Erreur génération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la génération',
      error: error.message
    });
  }
};

/**
 * Régénère toutes les pages statiques existantes
 * POST /api/v1/static-pages/regenerate-all
 */
const regenerateAllPages = async (req, res) => {
  try {
    console.log('🔄 [Static Page] Régénération de toutes les pages...');

    // Récupérer tous les SmartLinks publiés
    const smartlinks = await SmartLink.find({
      isPublished: true,
      shortId: { $exists: true, $ne: '' }
    }).select('shortId trackTitle artistName coverImageUrl description customDescription platformLinks');

    const results = {
      total: smartlinks.length,
      generated: 0,
      failed: 0,
      errors: []
    };

    if (results.total === 0) {
      return res.json({
        success: true,
        message: 'Aucun SmartLink à régénérer',
        data: results
      });
    }

    // Créer le dossier de destination
    const staticDir = path.join(process.cwd(), 'public', 'sl');
    await fs.mkdir(staticDir, { recursive: true });

    // Régénérer chaque page
    for (const smartlink of smartlinks) {
      try {
        const html = generateStaticHTML({
          shortId: smartlink.shortId,
          trackTitle: smartlink.trackTitle,
          artistName: smartlink.artistName,
          coverImageUrl: smartlink.coverImageUrl,
          description: smartlink.customDescription || smartlink.description,
          platforms: smartlink.platformLinks || []
        });

        const filePath = path.join(staticDir, `${smartlink.shortId}.html`);
        await fs.writeFile(filePath, html, 'utf8');

        // Mettre à jour la base de données
        await SmartLink.findByIdAndUpdate(smartlink._id, {
          staticPageUrl: `https://www.mdmcmusicads.com/sl/${smartlink.shortId}.html`,
          staticPageGenerated: true,
          staticPageGeneratedAt: new Date()
        });

        results.generated++;
        console.log(`✅ [Static Page] Régénéré: ${smartlink.shortId}`);

      } catch (error) {
        results.failed++;
        results.errors.push({
          shortId: smartlink.shortId,
          error: error.message
        });
        console.error(`❌ [Static Page] Échec: ${smartlink.shortId}`, error.message);
      }
    }

    console.log(`🎯 [Static Page] Terminé: ${results.generated}/${results.total} réussies`);

    res.json({
      success: true,
      message: `${results.generated} pages régénérées sur ${results.total}`,
      data: results
    });

  } catch (error) {
    console.error('❌ [Static Page] Erreur régénération globale:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la régénération globale',
      error: error.message
    });
  }
};

/**
 * Supprime une page statique
 * DELETE /api/v1/static-pages/:shortId
 */
const deleteStaticPage = async (req, res) => {
  try {
    const { shortId } = req.params;

    if (!shortId) {
      return res.status(400).json({
        success: false,
        message: 'shortId requis dans les paramètres'
      });
    }

    const filePath = path.join(process.cwd(), 'public', 'sl', `${shortId}.html`);

    try {
      await fs.unlink(filePath);
      console.log(`🗑️ [Static Page] Supprimée: ${shortId}`);

      // Mettre à jour la base de données
      await SmartLink.updateMany(
        { shortId },
        {
          $unset: {
            staticPageUrl: 1,
            staticPageGenerated: 1,
            staticPageGeneratedAt: 1
          }
        }
      );

      res.json({
        success: true,
        message: 'Page statique supprimée avec succès',
        data: { shortId }
      });

    } catch (error) {
      if (error.code === 'ENOENT') {
        // Fichier n'existe pas déjà
        res.json({
          success: true,
          message: 'Page statique déjà inexistante',
          data: { shortId }
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ [Static Page] Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

/**
 * Fonction utilitaire pour générer le HTML avec métadonnées Open Graph
 */
const generateStaticHTML = (data) => {
  const {
    shortId,
    trackTitle,
    artistName,
    coverImageUrl,
    description,
    platforms = []
  } = data;

  const title = `${trackTitle} - ${artistName}`;
  const reactUrl = `https://www.mdmcmusicads.com/#/smartlinks/${artistName.toLowerCase().replace(/\s+/g, '-')}/${trackTitle.toLowerCase().replace(/\s+/g, '-')}-${shortId}`;
  const currentUrl = `https://www.mdmcmusicads.com/sl/${shortId}.html`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} | MDMC SmartLink</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(coverImageUrl)}">
    <meta property="og:image:secure_url" content="${escapeHtml(coverImageUrl)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:site_name" content="MDMC SmartLinks">
    <meta property="og:locale" content="fr_FR">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${currentUrl}">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(coverImageUrl)}">
    <meta name="twitter:image:alt" content="${escapeHtml(title)}">
    <meta name="twitter:site" content="@MDMCMusicAds">
    
    <!-- Music specific meta -->
    <meta property="music:song" content="${escapeHtml(trackTitle)}">
    <meta property="music:musician" content="${escapeHtml(artistName)}">
    <meta property="music:creator" content="MDMC Music Ads">
    
    <!-- General meta -->
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="keywords" content="musique, streaming, ${escapeHtml(artistName)}, ${escapeHtml(trackTitle)}, smartlink, MDMC">
    <meta name="author" content="MDMC Music Ads">
    <meta name="robots" content="index, follow">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${currentUrl}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="https://www.mdmcmusicads.com/assets/images/favicon.png">
    
    <!-- Redirection automatique vers React SPA -->
    <script>
      // Redirection après 1 seconde (temps pour les bots de crawler)
      setTimeout(function() {
        window.location.href = "${reactUrl}";
      }, 1000);
      
      // Analytics pour tracking des vues statiques
      if (typeof gtag !== 'undefined') {
        gtag('event', 'static_page_view', {
          'smartlink_id': '${shortId}',
          'track_title': '${escapeHtml(trackTitle)}',
          'artist_name': '${escapeHtml(artistName)}',
          'page_type': 'static_html'
        });
      }
    </script>
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      .container {
        max-width: 400px;
        text-align: center;
        background: rgba(255,255,255,0.1);
        padding: 40px 30px;
        border-radius: 20px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
      }
      .cover {
        width: 200px;
        height: 200px;
        border-radius: 15px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        object-fit: cover;
      }
      h1 {
        margin: 15px 0 10px;
        font-size: 1.4em;
        font-weight: 600;
        line-height: 1.3;
      }
      .artist {
        font-size: 1.1em;
        opacity: 0.9;
        margin-bottom: 20px;
        font-weight: 400;
      }
      .loading {
        opacity: 0.8;
        margin: 20px 0;
      }
      .spinner {
        border: 3px solid rgba(255,255,255,0.3);
        border-top: 3px solid #fff;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .fallback {
        margin-top: 20px;
        font-size: 0.9em;
        opacity: 0.7;
      }
      .fallback a {
        color: #fff;
        text-decoration: underline;
      }
      .fallback a:hover {
        text-decoration: none;
      }
    </style>
</head>
<body>
    <div class="container">
        <img src="${escapeHtml(coverImageUrl)}" alt="${escapeHtml(title)}" class="cover" 
             onerror="this.style.display='none'">
        <h1>${escapeHtml(trackTitle)}</h1>
        <div class="artist">${escapeHtml(artistName)}</div>
        <div class="loading">
            <p>Redirection vers votre SmartLink...</p>
            <div class="spinner"></div>
        </div>
        <div class="fallback">
            <small>Si la redirection ne fonctionne pas, <a href="${reactUrl}">cliquez ici</a></small>
        </div>
    </div>
    
    <!-- GTM pour tracking -->
    <script>
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          'event': 'static_smartlink_view',
          'smartlink_id': '${shortId}',
          'track_title': '${escapeHtml(trackTitle)}',
          'artist_name': '${escapeHtml(artistName)}'
        });
      }
    </script>
</body>
</html>`;
};

/**
 * Fonction utilitaire pour échapper les caractères HTML
 */
const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

module.exports = {
  generateStaticPage,
  regenerateAllPages,
  deleteStaticPage
};