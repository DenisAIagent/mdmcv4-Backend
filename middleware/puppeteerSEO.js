// middleware/puppeteerSEO.js
// Middleware Puppeteer pour rendu dynamique et métadonnées Open Graph
// Compatible avec architecture Vue.js SPA + Hash Routing

const puppeteer = require('puppeteer');
const SmartLink = require('../models/SmartLink');
const Artist = require('../models/Artist');

// 🤖 User-agents des bots sociaux et SEO
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'facebookcatalog', 
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegram',
  'discord',
  'slack',
  'googlebot',
  'bingbot',
  'yandexbot',
  'applebot',
  'pinterestbot'
];

// 💾 Cache en mémoire pour les pages rendues (TTL: 1 heure)
const RENDER_CACHE = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure en ms

// 🚀 Configuration Puppeteer optimisée
const PUPPETEER_CONFIG = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor'
  ],
  timeout: 30000
};

/**
 * 🔍 Détecte si l'User-Agent est un bot social/SEO
 */
const isSocialBot = (userAgent) => {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some(bot => ua.includes(bot));
};

/**
 * 💾 Gestion du cache avec TTL
 */
const getCachedPage = (key) => {
  const cached = RENDER_CACHE.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Cache hit: ${key}`);
    return cached.html;
  }
  if (cached) {
    RENDER_CACHE.delete(key);
  }
  return null;
};

const setCachedPage = (key, html) => {
  RENDER_CACHE.set(key, {
    html,
    timestamp: Date.now()
  });
  console.log(`💾 Cache set: ${key} (${RENDER_CACHE.size} pages en cache)`);
};

/**
 * 🎨 Génère le HTML statique avec métadonnées Open Graph
 * Compatible avec le modèle SmartLink Vue.js
 */
const generateStaticHTML = (smartlink) => {
  const artist = smartlink.artistId;
  const title = smartlink.trackTitle;
  const description = smartlink.description || `Écoutez "${smartlink.trackTitle}" de ${artist.name} sur toutes les plateformes de streaming.`;
  const imageUrl = smartlink.coverImageUrl || 'https://www.mdmcmusicads.com/assets/images/default-cover.jpg';
  const seoTitle = `${title} - ${artist.name}`;
  const seoDescription = description;
  const primaryColor = '#E50914'; // Rouge MDMC
  
  const platforms = smartlink.platformLinks || [];
  const currentUrl = `https://www.mdmcmusicads.com/#/smartlinks/${artist.slug}/${smartlink.slug}`;
  const staticUrl = `https://www.mdmcmusicads.com/smartlinks/${artist.slug}/${smartlink.slug}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- SEO Meta Tags -->
    <title>${seoTitle || `${title} - ${artist} | MDMC SmartLink`}</title>
    <meta name="description" content="${seoDescription || description}">
    <meta name="keywords" content="musique, streaming, ${artist}, ${title}, smartlink, MDMC">
    <meta name="author" content="MDMC Music Ads">
    <meta name="robots" content="index, follow">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="music.song">
    <meta property="og:url" content="${staticUrl}">
    <meta property="og:title" content="${title} - ${artist}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:secure_url" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:site_name" content="MDMC SmartLinks">
    <meta property="og:locale" content="fr_FR">
    
    <!-- Music specific Open Graph -->
    <meta property="music:song" content="${title}">
    <meta property="music:musician" content="${artist}">
    <meta property="music:creator" content="MDMC Music Ads">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${staticUrl}">
    <meta name="twitter:title" content="${title} - ${artist}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="twitter:image:alt" content="${title} - ${artist}">
    <meta name="twitter:site" content="@MDMCMusicAds">
    <meta name="twitter:creator" content="@MDMCMusicAds">
    
    <!-- WhatsApp Meta -->
    <meta property="og:image:alt" content="${title} - ${artist}">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="${staticUrl}">
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="https://www.mdmcmusicads.com/assets/images/favicon.png">
    
    <!-- JSON-LD Schema.org -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": "${title}",
      "byArtist": {
        "@type": "MusicGroup",
        "name": "${artist}"
      },
      "image": "${imageUrl}",
      "description": "${description}",
      "url": "${currentUrl}",
      "publisher": {
        "@type": "Organization",
        "name": "MDMC Music Ads",
        "url": "https://www.mdmcmusicads.com"
      }
    }
    </script>
    
    <!-- Auto-redirect vers SPA Vue.js -->
    <script>
      // Redirection après 1.5 secondes (temps pour les bots de crawler)
      setTimeout(function() {
        window.location.href = "${currentUrl}";
      }, 1500);
      
      // Analytics tracking pour pages statiques
      if (typeof gtag !== 'undefined') {
        gtag('event', 'static_smartlink_view', {
          'smartlink_slug': '${smartlink.slug}',
          'artist': '${artist.name}',
          'title': '${title}',
          'page_type': 'static_seo'
        });
      }
    </script>
    
    <!-- Styles minimalistes -->
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}40 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #333;
      }
      .container {
        max-width: 400px;
        text-align: center;
        background: rgba(255,255,255,0.95);
        padding: 40px 30px;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.8);
      }
      .cover {
        width: 200px;
        height: 200px;
        border-radius: 15px;
        margin-bottom: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        object-fit: cover;
      }
      h1 {
        margin: 15px 0 10px;
        font-size: 1.5em;
        font-weight: 600;
        line-height: 1.3;
        color: #333;
      }
      .artist {
        font-size: 1.2em;
        color: ${primaryColor};
        margin-bottom: 20px;
        font-weight: 500;
      }
      .loading {
        color: #666;
        margin: 20px 0;
        font-size: 0.95em;
      }
      .spinner {
        border: 3px solid #f0f0f0;
        border-top: 3px solid ${primaryColor};
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
        font-size: 0.85em;
        color: #888;
      }
      .fallback a {
        color: ${primaryColor};
        text-decoration: none;
      }
      .fallback a:hover {
        text-decoration: underline;
      }
      .platforms {
        margin-top: 15px;
        font-size: 0.8em;
        color: #999;
      }
    </style>
</head>
<body>
    <div class="container">
        <img src="${imageUrl}" alt="${title} - ${artist.name}" class="cover" 
             onerror="this.style.display='none'">
        <h1>${title}</h1>
        <div class="artist">${artist.name}</div>
        <div class="loading">
            <p>Chargement de votre SmartLink...</p>
            <div class="spinner"></div>
        </div>
        <div class="fallback">
            <small>Si le chargement ne fonctionne pas, <a href="${currentUrl}">cliquez ici</a></small>
        </div>
        ${platforms.length > 0 ? `
        <div class="platforms">
            <small>Disponible sur ${platforms.length} plateforme${platforms.length > 1 ? 's' : ''}</small>
        </div>
        ` : ''}
    </div>
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-P11JTJ21NZ"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-P11JTJ21NZ');
      
      // Event pour tracking des vues statiques
      gtag('event', 'page_view', {
        'page_title': '${title} - ${artist.name} (Static)',
        'page_location': '${staticUrl}',
        'custom_map': {
          'dimension1': 'static_smartlink',
          'dimension2': '${artist.name}',
          'dimension3': '${title}'
        }
      });
    </script>
</body>
</html>`;
};

/**
 * 🎯 Middleware principal Puppeteer SEO
 */
const puppeteerSEOMiddleware = async (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';
  const isBot = isSocialBot(userAgent);
  
  // Forcer le rendu pour les tests avec ?seo=true
  const forceSEO = req.query.seo === 'true';
  
  if (!isBot && !forceSEO) {
    return next(); // Laisser passer vers la SPA Vue.js
  }
  
  try {
    const { artistSlug, trackSlug } = req.params;
    const slug = `${artistSlug}/${trackSlug}`;
    
    console.log(`🤖 Bot détecté: ${userAgent.substring(0, 50)}...`);
    console.log(`🔗 Génération SEO pour: ${slug}`);
    
    // Vérifier le cache d'abord
    const cacheKey = `seo_${slug}`;
    const cachedHTML = getCachedPage(cacheKey);
    if (cachedHTML) {
      res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Rendered-By': 'Puppeteer-Cache'
      });
      return res.send(cachedHTML);
    }
    
    // Rechercher le SmartLink en base avec l'artiste
    const smartlink = await SmartLink.findOne({
      slug: trackSlug,
      isPublished: true
    }).populate({
      path: 'artistId',
      select: 'name slug'
    });
    
    if (!smartlink || !smartlink.artistId || smartlink.artistId.slug !== artistSlug) {
      console.log(`❌ SmartLink non trouvé: ${artistSlug}/${trackSlug}`);
      return next(); // 404 géré par la SPA
    }
    
    console.log(`✅ SmartLink trouvé: ${smartlink.trackTitle} - ${smartlink.artistId.name}`);
    
    // Générer le HTML statique optimisé
    const staticHTML = generateStaticHTML(smartlink);
    
    // Mettre en cache
    setCachedPage(cacheKey, staticHTML);
    
    // Retourner le HTML avec les headers appropriés
    res.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Rendered-By': 'Puppeteer-Static',
      'X-Robots-Tag': 'index, follow'
    });
    
    return res.send(staticHTML);
    
  } catch (error) {
    console.error('❌ Erreur Puppeteer middleware:', error);
    return next(); // En cas d'erreur, laisser la SPA gérer
  }
};

/**
 * 🚀 Rendu dynamique avec Puppeteer (version avancée, optionnelle)
 * Utilisée si le rendu statique ne suffit pas
 */
const renderWithPuppeteer = async (url, smartlink) => {
  let browser = null;
  
  try {
    console.log(`🚀 Lancement Puppeteer pour: ${url}`);
    
    browser = await puppeteer.launch(PUPPETEER_CONFIG);
    const page = await browser.newPage();
    
    // Configuration de la page
    await page.setUserAgent('Mozilla/5.0 (compatible; PuppeteerBot/1.0)');
    await page.setViewport({ width: 1200, height: 800 });
    
    // Aller sur la SPA
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Attendre que Vue.js et vue-meta aient fini de charger
    await page.waitForFunction(
      () => window.Vue && document.querySelector('meta[property="og:title"]'),
      { timeout: 15000 }
    );
    
    // Injecter les métadonnées si vue-meta n'a pas fonctionné
    await page.evaluate((smartlink) => {
      const setMeta = (property, content) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };
      
      setMeta('og:title', `${smartlink.title} - ${smartlink.artist}`);
      setMeta('og:description', smartlink.description);
      setMeta('og:image', smartlink.imageUrl);
      setMeta('og:type', 'music.song');
      
      document.title = `${smartlink.title} - ${smartlink.artist} | MDMC SmartLink`;
    }, smartlink);
    
    // Récupérer le HTML final
    const html = await page.content();
    
    console.log(`✅ Rendu Puppeteer terminé`);
    return html;
    
  } catch (error) {
    console.error('❌ Erreur rendu Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * 🧹 Nettoyage périodique du cache
 */
const cleanupCache = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, value] of RENDER_CACHE.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      RENDER_CACHE.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cache nettoyé: ${cleaned} entrées supprimées (${RENDER_CACHE.size} restantes)`);
  }
};

// Nettoyage automatique toutes les heures
setInterval(cleanupCache, CACHE_TTL);

module.exports = {
  puppeteerSEOMiddleware,
  renderWithPuppeteer,
  isSocialBot,
  cleanupCache
};