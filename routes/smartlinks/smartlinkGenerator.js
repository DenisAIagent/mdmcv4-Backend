// routes/smartlinks/smartlinkGenerator.js
// Générateur de SmartLink avec analytics statiques

const fs = require('fs');
const path = require('path');

/**
 * 🎯 SERVICE DE GÉNÉRATION DE SMARTLINKS HYBRIDES
 * 
 * Ce service génère des pages HTML statiques avec analytics pré-injectés
 * pour résoudre les problèmes de détection de Google Analytics et GTM
 */
class SmartLinkGenerator {
  constructor() {
    // Template HTML de base
    this.template = null;
    this.loadTemplate();
  }

  loadTemplate() {
    try {
      // Template HTML inline pour éviter les dépendances de fichiers
      this.template = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TRACK_TITLE}} - {{ARTIST_NAME}} | Écoutez sur toutes les plateformes</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="Écoutez {{TRACK_TITLE}} par {{ARTIST_NAME}} sur votre plateforme musicale préférée : Spotify, Apple Music, Deezer, YouTube Music et plus encore.">
    <meta name="keywords" content="{{TRACK_TITLE}}, {{ARTIST_NAME}}, musique, streaming, Spotify, Apple Music, Deezer">
    
    <!-- Open Graph -->
    <meta property="og:title" content="{{TRACK_TITLE}} - {{ARTIST_NAME}}">
    <meta property="og:description" content="Écoutez {{TRACK_TITLE}} par {{ARTIST_NAME}} sur votre plateforme préférée">
    <meta property="og:image" content="{{COVER_IMAGE_URL}}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:type" content="music.song">
    <meta property="og:url" content="{{SMARTLINK_URL}}">
    <meta property="music:musician" content="{{ARTIST_NAME}}">
    <meta property="music:release_date" content="{{RELEASE_DATE}}">
    
    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{{TRACK_TITLE}} - {{ARTIST_NAME}}">
    <meta name="twitter:description" content="Écoutez {{TRACK_TITLE}} par {{ARTIST_NAME}} sur votre plateforme préférée">
    <meta name="twitter:image" content="{{COVER_IMAGE_URL}}">
    
    {{ANALYTICS_SCRIPTS}}
    
    <style>
        ${this.getCriticalCSS()}
    </style>
</head>
<body>
    <div class="bg-artwork"></div>
    
    <div class="smartlink-container">
        <div id="loading" class="loading">
            <div class="spinner"></div>
            <p>Chargement...</p>
        </div>
        
        <div id="content" style="display: none;">
            <img id="artwork" class="artwork" src="{{COVER_IMAGE_URL}}" alt="{{TRACK_TITLE}} - {{ARTIST_NAME}}">
            
            <h1 class="track-title">{{TRACK_TITLE}}</h1>
            <p class="artist-name">{{ARTIST_NAME}}</p>
            <p class="subtitle">{{SUBTITLE}}</p>
            
            <div id="platforms" class="platforms">
                <!-- Les plateformes seront injectées ici -->
            </div>
        </div>
    </div>
    
    {{TRACKING_SCRIPT}}
    
    {{NOSCRIPT_TAGS}}
</body>
</html>`;
      console.log('✅ Template SmartLink chargé');
    } catch (error) {
      console.error('❌ Erreur chargement template:', error);
    }
  }

  /**
   * 🎯 GÉNÉRATION D'UN SMARTLINK COMPLET
   * 
   * @param {Object} smartLinkData - Données du SmartLink
   * @param {Object} artistData - Données de l'artiste
   * @param {Object} options - Options de génération
   */
  async generateSmartLink(smartLinkData, artistData, options = {}) {
    try {
      console.log('🎯 Génération SmartLink pour:', smartLinkData.trackTitle);

      // 🎨 Préparation des données
      const data = this.prepareData(smartLinkData, artistData, options);
      
      // 🎯 Génération des scripts analytics
      const analyticsScripts = this.generateAnalyticsScripts(data.trackingIds, data);
      
      // 📊 Génération du script de tracking
      const trackingScript = this.generateTrackingScript(data);
      
      // 🏷️ Génération des balises noscript
      const noscriptTags = this.generateNoscriptTags(data.trackingIds);
      
      // 🔗 Remplacement des variables dans le template
      let html = this.template
        .replace(/\{\{TRACK_TITLE\}\}/g, this.escapeHtml(data.trackTitle))
        .replace(/\{\{ARTIST_NAME\}\}/g, this.escapeHtml(data.artistName))
        .replace(/\{\{COVER_IMAGE_URL\}\}/g, data.coverImageUrl)
        .replace(/\{\{SMARTLINK_URL\}\}/g, data.smartlinkUrl)
        .replace(/\{\{SMARTLINK_ID\}\}/g, data.smartlinkId)
        .replace(/\{\{RELEASE_DATE\}\}/g, data.releaseDate || '')
        .replace(/\{\{SUBTITLE\}\}/g, this.escapeHtml(data.subtitle))
        .replace(/\{\{PLATFORMS_JSON\}\}/g, JSON.stringify(data.platforms))
        .replace(/\{\{ANALYTICS_SCRIPTS\}\}/g, analyticsScripts)
        .replace(/\{\{TRACKING_SCRIPT\}\}/g, trackingScript)
        .replace(/\{\{NOSCRIPT_TAGS\}\}/g, noscriptTags);

      console.log('✅ SmartLink généré avec succès');
      
      return {
        success: true,
        html: html,
        data: data,
        meta: {
          title: `${data.trackTitle} - ${data.artistName}`,
          description: `Écoutez ${data.trackTitle} par ${data.artistName} sur votre plateforme préférée`,
          image: data.coverImageUrl,
          url: data.smartlinkUrl
        }
      };

    } catch (error) {
      console.error('❌ Erreur génération SmartLink:', error);
      return {
        success: false,
        error: error.message,
        fallbackHtml: this.generateFallbackHtml()
      };
    }
  }

  /**
   * 🎯 GÉNÉRATION DES SCRIPTS ANALYTICS STATIQUES
   */
  generateAnalyticsScripts(trackingIds, data) {
    let scripts = '';

    // 🎯 Google Analytics 4
    if (trackingIds.ga4Id && trackingIds.ga4Id.trim()) {
      scripts += `
    <!-- 🎯 GOOGLE ANALYTICS 4 - INJECTION STATIQUE -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${trackingIds.ga4Id}"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${trackingIds.ga4Id}', {
            page_title: '${this.escapeJs(data.trackTitle)} - ${this.escapeJs(data.artistName)}',
            page_location: window.location.href,
            custom_map: {
                'custom_parameter_1': 'smartlink_type',
                'custom_parameter_2': 'artist_name',
                'custom_parameter_3': 'track_title'
            }
        });
        
        gtag('event', 'page_view', {
            smartlink_type: 'music',
            artist_name: '${this.escapeJs(data.artistName)}',
            track_title: '${this.escapeJs(data.trackTitle)}',
            smartlink_id: '${data.smartlinkId}'
        });
        
        console.log('🎯 GA4 initialisé statiquement:', '${trackingIds.ga4Id}');
    </script>`;
    }

    // 🎯 Google Tag Manager
    if (trackingIds.gtmId && trackingIds.gtmId.trim()) {
      scripts += `
    <!-- 🎯 GOOGLE TAG MANAGER - INJECTION STATIQUE -->
    <script>
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'smartlink_type': 'music',
            'artist_name': '${this.escapeJs(data.artistName)}',
            'track_title': '${this.escapeJs(data.trackTitle)}',
            'smartlink_id': '${data.smartlinkId}',
            'event': 'smartlink_page_load'
        });
        
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${trackingIds.gtmId}');
        
        console.log('🎯 GTM initialisé statiquement:', '${trackingIds.gtmId}');
    </script>`;
    }

    // 🎯 Meta Pixel
    if (trackingIds.metaPixelId && trackingIds.metaPixelId.trim()) {
      scripts += `
    <!-- 🎯 META PIXEL - INJECTION STATIQUE -->
    <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        
        fbq('init', '${trackingIds.metaPixelId}');
        fbq('track', 'PageView');
        
        fbq('trackCustom', 'SmartLinkView', {
            content_name: '${this.escapeJs(data.trackTitle)} - ${this.escapeJs(data.artistName)}',
            content_category: 'Music',
            smartlink_type: 'music',
            artist_name: '${this.escapeJs(data.artistName)}',
            track_title: '${this.escapeJs(data.trackTitle)}',
            smartlink_id: '${data.smartlinkId}'
        });
        
        console.log('🎯 Meta Pixel initialisé statiquement:', '${trackingIds.metaPixelId}');
    </script>`;
    }

    // 🎯 TikTok Pixel
    if (trackingIds.tiktokPixelId && trackingIds.tiktokPixelId.trim()) {
      scripts += `
    <!-- 🎯 TIKTOK PIXEL - INJECTION STATIQUE -->
    <script>
        !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            
            ttq.load('${trackingIds.tiktokPixelId}');
            ttq.page();
            
            ttq.track('ViewContent', {
                content_id: '${data.smartlinkId}',
                content_type: 'music',
                content_name: '${this.escapeJs(data.trackTitle)} - ${this.escapeJs(data.artistName)}',
                description: 'SmartLink music page view',
                value: 1,
                currency: 'EUR'
            });
            
            console.log('🎯 TikTok Pixel initialisé statiquement:', '${trackingIds.tiktokPixelId}');
        }(window, document, 'ttq');
    </script>`;
    }

    return scripts;
  }

  /**
   * 📊 GÉNÉRATION DU SCRIPT DE TRACKING INTERACTIF
   */
  generateTrackingScript(data) {
    return `
    <script>
        // Configuration globale
        window.SMARTLINK_DATA = {
            id: '${data.smartlinkId}',
            trackTitle: '${this.escapeJs(data.trackTitle)}',
            artistName: '${this.escapeJs(data.artistName)}',
            platforms: ${JSON.stringify(data.platforms)}
        };
        
        // Fonction de tracking des clics
        function trackPlatformClick(platformName, platformUrl) {
            console.log('🔗 Clic sur', platformName);
            
            // GA4 tracking
            if (window.gtag) {
                gtag('event', 'platform_click', {
                    event_category: 'smartlink',
                    event_label: platformName,
                    smartlink_id: window.SMARTLINK_DATA.id,
                    track_title: window.SMARTLINK_DATA.trackTitle,
                    artist_name: window.SMARTLINK_DATA.artistName,
                    platform_clicked: platformName,
                    value: 1
                });
                console.log('🎯 GA4 - Platform click tracked:', platformName);
            }
            
            // GTM tracking
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'smartlink_platform_click',
                    platform_name: platformName,
                    platform_url: platformUrl,
                    smartlink_id: window.SMARTLINK_DATA.id,
                    track_title: window.SMARTLINK_DATA.trackTitle,
                    artist_name: window.SMARTLINK_DATA.artistName,
                    event_category: 'smartlink_interaction',
                    event_action: 'platform_click',
                    event_label: platformName,
                    value: 1
                });
                console.log('🎯 GTM - Platform click tracked:', platformName);
            }
            
            // Meta Pixel tracking
            if (window.fbq) {
                fbq('track', 'Lead', {
                    content_name: window.SMARTLINK_DATA.trackTitle + ' - ' + window.SMARTLINK_DATA.artistName,
                    content_category: 'Music',
                    platform: platformName,
                    value: 1,
                    currency: 'EUR'
                });
                
                fbq('trackCustom', 'SmartLinkPlatformClick', {
                    platform_name: platformName,
                    smartlink_id: window.SMARTLINK_DATA.id,
                    track_title: window.SMARTLINK_DATA.trackTitle,
                    artist_name: window.SMARTLINK_DATA.artistName
                });
                console.log('🎯 Meta Pixel - Platform click tracked:', platformName);
            }
            
            // TikTok Pixel tracking
            if (window.ttq) {
                ttq.track('ClickButton', {
                    content_id: window.SMARTLINK_DATA.id,
                    content_name: window.SMARTLINK_DATA.trackTitle + ' - ' + window.SMARTLINK_DATA.artistName,
                    platform: platformName,
                    button_text: platformName,
                    value: 1,
                    currency: 'EUR'
                });
                console.log('🎯 TikTok Pixel - Platform click tracked:', platformName);
            }
            
            // Database tracking
            trackToDatabase(platformName);
            
            // Redirection
            setTimeout(function() {
                window.open(platformUrl, '_blank');
            }, 100);
        }
        
        // Database tracking
        async function trackToDatabase(platformName) {
            try {
                const response = await fetch('/api/v1/smartlinks/' + window.SMARTLINK_DATA.id + '/log-platform-click', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platformName: platformName })
                });
                
                if (response.ok) {
                    console.log('📊 Database tracking successful');
                } else {
                    console.warn('📊 Database tracking failed:', response.status);
                }
            } catch (error) {
                console.error('📊 Database tracking error:', error);
            }
        }
        
        // Initialisation interface
        function initializeInterface() {
            const platforms = window.SMARTLINK_DATA.platforms;
            const container = document.getElementById('platforms');
            
            container.innerHTML = platforms.map(function(platform) {
                return '<div class="platform" onclick="trackPlatformClick(\\'' + platform.name + '\\', \\'' + platform.url + '\\')"><div class="platform-info"><img class="platform-logo" src="' + platform.logo + '" alt="' + platform.name + '"><span class="platform-name">' + platform.name + '</span></div><button class="platform-cta">Écouter</button></div>';
            }).join('');
            
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';
            
            console.log('🎨 Interface initialisée avec', platforms.length, 'plateformes');
        }
        
        // Démarrage
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 SmartLink hybride démarré');
            console.log('🎯 Analytics status:', {
                ga4: !!window.gtag,
                gtm: !!window.dataLayer,
                metaPixel: !!window.fbq,
                tiktokPixel: !!window.ttq
            });
            
            setTimeout(initializeInterface, 500);
        });
    </script>`;
  }

  /**
   * 🏷️ GÉNÉRATION DES BALISES NOSCRIPT
   */
  generateNoscriptTags(trackingIds) {
    let tags = '';

    if (trackingIds.gtmId && trackingIds.gtmId.trim()) {
      tags += `
    <noscript>
        <iframe src="https://www.googletagmanager.com/ns.html?id=${trackingIds.gtmId}" 
                height="0" width="0" style="display:none;visibility:hidden"></iframe>
    </noscript>`;
    }

    if (trackingIds.metaPixelId && trackingIds.metaPixelId.trim()) {
      tags += `
    <noscript>
        <img height="1" width="1" style="display:none"
             src="https://www.facebook.com/tr?id=${trackingIds.metaPixelId}&ev=PageView&noscript=1"/>
    </noscript>`;
    }

    return tags;
  }

  /**
   * 🎨 PRÉPARATION DES DONNÉES
   */
  prepareData(smartLinkData, artistData, options) {
    // Logos des plateformes
    const platformLogos = {
      'spotify': 'https://services.linkfire.com/logo_spotify_onlight.svg',
      'apple music': 'https://services.linkfire.com/logo_applemusic_onlight.svg',
      'applemusic': 'https://services.linkfire.com/logo_applemusic_onlight.svg',
      'deezer': 'https://services.linkfire.com/logo_deezer_onlight.svg',
      'youtube': 'https://services.linkfire.com/logo_youtube_onlight.svg',
      'youtube music': 'https://services.linkfire.com/logo_youtubemusic_onlight.svg',
      'youtubemusic': 'https://services.linkfire.com/logo_youtubemusic_onlight.svg',
      'amazon music': 'https://services.linkfire.com/logo_amazonmusic_onlight.svg',
      'amazonmusic': 'https://services.linkfire.com/logo_amazonmusic_onlight.svg',
      'tidal': 'https://services.linkfire.com/logo_tidal_onlight.svg',
      'soundcloud': 'https://services.linkfire.com/logo_soundcloud_onlight.svg'
    };

    // Préparation des plateformes
    const platforms = (smartLinkData.platformLinks || []).map(link => ({
      name: link.platform,
      url: link.url,
      logo: platformLogos[link.platform.toLowerCase()] || 'https://via.placeholder.com/32x32/666666/ffffff?text=?'
    }));

    // Déterminer le sous-titre
    let subtitle = "Choisissez votre plateforme préférée";
    if (smartLinkData.useDescriptionAsSubtitle && smartLinkData.description) {
      subtitle = smartLinkData.description;
    } else if (smartLinkData.customSubtitle) {
      subtitle = smartLinkData.customSubtitle;
    }

    return {
      smartlinkId: smartLinkData._id,
      trackTitle: smartLinkData.trackTitle,
      artistName: artistData.name,
      coverImageUrl: smartLinkData.coverImageUrl || 'https://via.placeholder.com/400x400/f0f0f0/666?text=🎵',
      smartlinkUrl: `${options.baseUrl || 'https://mdmc.link'}/s/${artistData.slug}/${smartLinkData.slug}`,
      releaseDate: smartLinkData.releaseDate,
      subtitle: subtitle,
      platforms: platforms,
      trackingIds: smartLinkData.trackingIds || {}
    };
  }

  /**
   * 🎨 CSS CRITIQUE INLINE
   */
  getCriticalCSS() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .bg-artwork {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: url('{{COVER_IMAGE_URL}}');
            background-size: cover;
            background-position: center;
            filter: blur(20px);
            opacity: 0.3;
            z-index: -1;
        }
        
        .smartlink-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .artwork {
            width: 200px;
            height: 200px;
            border-radius: 12px;
            margin: 0 auto 20px;
            display: block;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        
        .track-title {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        
        .artist-name {
            font-size: 18px;
            font-weight: 500;
            color: #666;
            margin-bottom: 20px;
        }
        
        .subtitle {
            font-size: 14px;
            color: #888;
            margin-bottom: 30px;
        }
        
        .platforms {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .platform {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .platform:hover {
            background: #e9ecef;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .platform-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .platform-logo {
            width: 32px;
            height: 32px;
            border-radius: 6px;
        }
        
        .platform-name {
            font-size: 16px;
            font-weight: 500;
            color: #1a1a1a;
        }
        
        .platform-cta {
            background: #007AFF;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
        }
        
        .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007AFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
            .smartlink-container { padding: 30px 20px; }
            .artwork { width: 160px; height: 160px; }
            .track-title { font-size: 20px; }
        }`;
  }

  /**
   * 🛡️ FONCTIONS DE SÉCURITÉ
   */
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  escapeJs(text) {
    if (!text) return '';
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  /**
   * 🔄 GÉNÉRATION DE FALLBACK EN CAS D'ERREUR
   */
  generateFallbackHtml() {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartLink - Erreur</title>
    <style>
        body {
            font-family: Arial, sans-serif;
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
        }
        h1 { color: #e74c3c; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>😕 SmartLink Indisponible</h1>
        <p>Ce SmartLink n'est temporairement pas disponible. Veuillez réessayer plus tard.</p>
    </div>
</body>
</html>`;
  }
}

module.exports = SmartLinkGenerator;