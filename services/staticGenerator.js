// services/staticGenerator.js
// Service de génération de SmartLinks HTML statiques optimisé

const fs = require('fs').promises;
const path = require('path');
const ejs = require('ejs');

/**
 * 🎯 GÉNÉRATEUR DE SMARTLINKS STATIQUES MDMC
 * 
 * Ce service génère des fichiers HTML statiques purs pour optimiser :
 * - SEO et métadonnées Open Graph
 * - Performance (pas de JS côté client)
 * - Analytics pré-intégrés
 * - Cache navigateur maximal
 */
class StaticSmartLinkGenerator {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
    this.publicPath = path.join(__dirname, '../public/smartlinks');
    this.assetsPath = path.join(__dirname, '../public/assets');
    
    // Cache des templates compilés
    this.templateCache = new Map();
    
    console.log('🎯 StaticSmartLinkGenerator initialisé');
  }

  /**
   * 🎨 GÉNÉRATION D'UN SMARTLINK STATIQUE COMPLET
   */
  async generateStaticSmartLink(smartLinkData, options = {}) {
    try {
      console.log(`🎯 Génération statique: ${smartLinkData.artist} - ${smartLinkData.title}`);

      // Préparer les données pour le template
      const templateData = this.prepareTemplateData(smartLinkData, options);
      
      // Choisir le template selon la configuration
      const templateName = smartLinkData.template || 'default';
      
      // Générer le HTML
      const html = await this.renderTemplate(templateName, templateData);
      
      // Créer les répertoires nécessaires
      const artistDir = path.join(this.publicPath, templateData.artistSlug);
      await fs.mkdir(artistDir, { recursive: true });
      
      // Chemin du fichier statique
      const filePath = path.join(artistDir, `${templateData.trackSlug}.html`);
      
      // Écrire le fichier HTML
      await fs.writeFile(filePath, html, 'utf8');
      
      // Générer les assets si nécessaire
      await this.generateAssets(templateData);
      
      console.log(`✅ Fichier statique créé: ${filePath}`);
      
      return {
        success: true,
        filePath,
        url: `/smartlinks/${templateData.artistSlug}/${templateData.trackSlug}.html`,
        data: templateData
      };

    } catch (error) {
      console.error('❌ Erreur génération statique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🗑️ SUPPRESSION D'UN SMARTLINK STATIQUE
   */
  async deleteStaticSmartLink(artistSlug, trackSlug) {
    try {
      const filePath = path.join(this.publicPath, artistSlug, `${trackSlug}.html`);
      
      // Vérifier si le fichier existe
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`🗑️ Fichier statique supprimé: ${filePath}`);
        
        // Nettoyer le dossier artiste s'il est vide
        const artistDir = path.join(this.publicPath, artistSlug);
        const files = await fs.readdir(artistDir);
        if (files.length === 0) {
          await fs.rmdir(artistDir);
          console.log(`🗑️ Dossier artiste supprimé: ${artistDir}`);
        }
        
        return { success: true };
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.log(`⚠️ Fichier statique déjà absent: ${filePath}`);
          return { success: true };
        }
        throw err;
      }
    } catch (error) {
      console.error('❌ Erreur suppression statique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🔄 MISE À JOUR D'UN SMARTLINK STATIQUE
   */
  async updateStaticSmartLink(oldSlug, newSmartLinkData, options = {}) {
    try {
      // Supprimer l'ancien fichier si le slug a changé
      if (oldSlug !== `${newSmartLinkData.artistSlug}/${newSmartLinkData.trackSlug}`) {
        const [oldArtistSlug, oldTrackSlug] = oldSlug.split('/');
        await this.deleteStaticSmartLink(oldArtistSlug, oldTrackSlug);
      }
      
      // Générer le nouveau fichier
      return await this.generateStaticSmartLink(newSmartLinkData, options);
      
    } catch (error) {
      console.error('❌ Erreur mise à jour statique:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🎨 RENDU DU TEMPLATE EJS
   */
  async renderTemplate(templateName, data) {
    try {
      // Vérifier le cache
      const cacheKey = `${templateName}-${Date.now()}`;
      
      // Chemin du template
      const templatePath = path.join(this.templatesPath, `${templateName}.ejs`);
      
      // Compiler et rendre le template
      const html = await ejs.renderFile(templatePath, data, {
        cache: process.env.NODE_ENV === 'production',
        filename: templatePath
      });
      
      return html;
      
    } catch (error) {
      console.error(`❌ Erreur rendu template ${templateName}:`, error);
      
      // Fallback vers template default
      if (templateName !== 'default') {
        console.log('🔄 Fallback vers template default');
        return await this.renderTemplate('default', data);
      }
      
      throw error;
    }
  }

  /**
   * 🎯 PRÉPARATION DES DONNÉES POUR LE TEMPLATE
   */
  prepareTemplateData(smartLinkData, options = {}) {
    // Générer les slugs si nécessaire
    const artistSlug = smartLinkData.artistSlug || this.slugify(smartLinkData.artist);
    const trackSlug = smartLinkData.trackSlug || this.slugify(smartLinkData.title);
    
    // Préparer les plateformes
    const platforms = this.preparePlatforms(smartLinkData);
    
    // Métadonnées SEO
    const seoTitle = smartLinkData.seoTitle || `${smartLinkData.title} - ${smartLinkData.artist} | MDMC SmartLink`;
    const seoDescription = smartLinkData.seoDescription || 
      `Écoutez ${smartLinkData.title} de ${smartLinkData.artist} sur Spotify, Apple Music, YouTube Music et toutes les plateformes de streaming.`;
    
    // URL complète du SmartLink
    const baseUrl = options.baseUrl || 'https://www.mdmcmusicads.com';
    const smartlinkUrl = `${baseUrl}/smartlinks/${artistSlug}/${trackSlug}.html`;
    
    return {
      // Identifiants
      smartlinkId: smartLinkData._id || smartLinkData.slug,
      artistSlug,
      trackSlug,
      
      // Contenu
      artist: smartLinkData.artist,
      title: smartLinkData.title,
      description: smartLinkData.description || seoDescription,
      imageUrl: smartLinkData.imageUrl,
      releaseDate: smartLinkData.releaseDate,
      
      // SEO
      seoTitle,
      seoDescription,
      smartlinkUrl,
      canonicalUrl: smartlinkUrl,
      
      // Plateformes
      platforms,
      platformsJson: JSON.stringify(platforms),
      
      // Personnalisation
      primaryColor: smartLinkData.primaryColor || '#E50914',
      template: smartLinkData.template || 'default',
      
      // Analytics
      trackingIds: smartLinkData.trackingIds || {},
      
      // Configuration
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      
      // Assets
      cssPath: '/assets/css/smartlink.min.css',
      jsPath: '/assets/js/analytics.min.js'
    };
  }

  /**
   * 🔗 PRÉPARATION DES PLATEFORMES
   */
  preparePlatforms(smartLinkData) {
    const platformsConfig = {
      spotify: { 
        name: 'Spotify', 
        color: '#1DB954',
        icon: 'spotify'
      },
      apple: { 
        name: 'Apple Music', 
        color: '#FA243C',
        icon: 'apple'
      },
      youtube: { 
        name: 'YouTube Music', 
        color: '#FF0000',
        icon: 'youtube'
      },
      deezer: { 
        name: 'Deezer', 
        color: '#FEAA2D',
        icon: 'deezer'
      },
      amazon: { 
        name: 'Amazon Music', 
        color: '#00A8E1',
        icon: 'amazon'
      },
      tidal: { 
        name: 'Tidal', 
        color: '#000000',
        icon: 'tidal'
      },
      soundcloud: { 
        name: 'SoundCloud', 
        color: '#FF8800',
        icon: 'soundcloud'
      },
      bandcamp: { 
        name: 'Bandcamp', 
        color: '#408294',
        icon: 'bandcamp'
      }
    };

    const platforms = [];
    
    // Mapping des URLs
    const urlMappings = {
      spotifyUrl: 'spotify',
      appleUrl: 'apple', 
      youtubeUrl: 'youtube',
      deezerUrl: 'deezer',
      amazonUrl: 'amazon',
      tidalUrl: 'tidal',
      soundcloudUrl: 'soundcloud',
      bandcampUrl: 'bandcamp'
    };

    for (const [urlKey, platformKey] of Object.entries(urlMappings)) {
      if (smartLinkData[urlKey]) {
        platforms.push({
          key: platformKey,
          name: platformsConfig[platformKey].name,
          url: smartLinkData[urlKey],
          color: platformsConfig[platformKey].color,
          icon: platformsConfig[platformKey].icon
        });
      }
    }

    return platforms;
  }

  /**
   * 🎨 GÉNÉRATION DES ASSETS COMMUNS
   */
  async generateAssets(templateData) {
    try {
      // Créer le répertoire assets
      await fs.mkdir(path.join(this.assetsPath, 'css'), { recursive: true });
      await fs.mkdir(path.join(this.assetsPath, 'js'), { recursive: true });

      // CSS optimisé
      const css = await this.generateOptimizedCSS(templateData);
      await fs.writeFile(
        path.join(this.assetsPath, 'css', 'smartlink.min.css'), 
        css, 
        'utf8'
      );

      // JavaScript analytics
      const js = await this.generateAnalyticsJS(templateData);
      await fs.writeFile(
        path.join(this.assetsPath, 'js', 'analytics.min.js'), 
        js, 
        'utf8'
      );

      console.log('✅ Assets générés');
      
    } catch (error) {
      console.warn('⚠️ Erreur génération assets:', error.message);
      // Non bloquant
    }
  }

  /**
   * 📱 GÉNÉRATION CSS OPTIMISÉ
   */
  async generateOptimizedCSS(templateData) {
    const primaryColor = templateData.primaryColor;
    
    return `
/* MDMC SmartLinks - CSS Optimisé */
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,${primaryColor}33 0%,${primaryColor}66 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;color:#333}
.container{background:rgba(255,255,255,.95);backdrop-filter:blur(10px);border-radius:20px;padding:40px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 40px rgba(0,0,0,.1)}
.artwork{width:200px;height:200px;border-radius:12px;margin:0 auto 20px;display:block;box-shadow:0 8px 24px rgba(0,0,0,.15);object-fit:cover}
.title{font-size:24px;font-weight:700;color:#1a1a1a;margin-bottom:8px;line-height:1.2}
.artist{font-size:18px;font-weight:500;color:#666;margin-bottom:20px}
.description{font-size:14px;color:#888;margin-bottom:30px;line-height:1.4}
.platforms{display:flex;flex-direction:column;gap:12px}
.platform{display:flex;align-items:center;justify-content:space-between;padding:16px;background:#f8f9fa;border-radius:12px;cursor:pointer;transition:all .2s ease;text-decoration:none;color:inherit}
.platform:hover{background:#e9ecef;transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
.platform-info{display:flex;align-items:center;gap:12px}
.platform-icon{width:32px;height:32px;border-radius:6px}
.platform-name{font-size:16px;font-weight:500;color:#1a1a1a}
.platform-cta{background:${primaryColor};color:#fff;border:none;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:500;cursor:pointer}
@media (max-width:480px){.container{padding:30px 20px}.artwork{width:160px;height:160px}.title{font-size:20px}}
    `.trim();
  }

  /**
   * 📊 GÉNÉRATION JAVASCRIPT ANALYTICS
   */
  async generateAnalyticsJS(templateData) {
    return `
// MDMC SmartLinks - Analytics optimisé
(function(){
  'use strict';
  
  // Configuration
  const SMARTLINK_DATA = ${JSON.stringify({
    id: templateData.smartlinkId,
    title: templateData.title,
    artist: templateData.artist
  })};
  
  // Tracking des clics
  function trackClick(platform, url) {
    console.log('🔗 Clic:', platform);
    
    // GA4
    if (window.gtag) {
      gtag('event', 'platform_click', {
        event_category: 'smartlink',
        event_label: platform,
        smartlink_id: SMARTLINK_DATA.id
      });
    }
    
    // GTM
    if (window.dataLayer) {
      dataLayer.push({
        event: 'smartlink_click',
        platform: platform,
        smartlink_id: SMARTLINK_DATA.id
      });
    }
    
    // Database tracking
    fetch('/api/smartlinks-html/' + SMARTLINK_DATA.id + '/click', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({platform: platform})
    }).catch(console.warn);
    
    // Redirection
    setTimeout(() => window.open(url, '_blank'), 100);
  }
  
  // Initialisation
  document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.platform');
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const platform = this.dataset.platform;
        const url = this.dataset.url;
        trackClick(platform, url);
      });
    });
  });
})();
    `.trim();
  }

  /**
   * 🔤 UTILITAIRE DE SLUGIFICATION
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

module.exports = StaticSmartLinkGenerator;