// Service de génération HTML statique pour SmartLinks MDMC
// Génère des fichiers HTML à partir de templates EJS

const fs = require('fs').promises;
const path = require('path');
const ejs = require('ejs');
const slugify = require('slugify');

class StaticHtmlGenerator {
  constructor() {
    this.templatePath = path.join(__dirname, '../templates/smartlink.ejs');
    this.publicDir = path.join(__dirname, '../public/smartlinks');
    this.baseUrl = process.env.SITE_URL || 'https://www.mdmcmusicads.com';
  }

  /**
   * Génère un fichier HTML statique pour un SmartLink
   * @param {Object} smartlinkData - Données du SmartLink
   * @returns {Promise<string>} - Chemin du fichier généré
   */
  async generateSmartLinkHtml(smartlinkData) {
    try {
      // Validation des données
      this.validateSmartLinkData(smartlinkData);

      // Préparation des données pour le template
      const templateData = this.prepareTemplateData(smartlinkData);

      // Génération du HTML avec EJS
      const htmlContent = await ejs.renderFile(this.templatePath, templateData);

      // Création du chemin de fichier
      const filePath = this.getFilePath(smartlinkData.artist.slug, smartlinkData.slug);

      // Création du dossier si nécessaire
      await this.ensureDirectoryExists(path.dirname(filePath));

      // Écriture du fichier HTML
      await fs.writeFile(filePath, htmlContent, 'utf8');

      console.log(`✅ SmartLink HTML généré: ${filePath}`);
      return filePath;

    } catch (error) {
      console.error('❌ Erreur génération HTML:', error);
      throw new Error(`Impossible de générer le HTML: ${error.message}`);
    }
  }

  /**
   * Supprime un fichier HTML statique
   * @param {string} artistSlug - Slug de l'artiste
   * @param {string} trackSlug - Slug du titre
   */
  async deleteSmartLinkHtml(artistSlug, trackSlug) {
    try {
      const filePath = this.getFilePath(artistSlug, trackSlug);
      
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ SmartLink HTML supprimé: ${filePath}`);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        console.log(`⚠️ Fichier HTML inexistant: ${filePath}`);
      }

      // Suppression du dossier artiste s'il est vide
      await this.cleanupEmptyDirectories(artistSlug);

    } catch (error) {
      console.error('❌ Erreur suppression HTML:', error);
      throw error;
    }
  }

  /**
   * Met à jour un fichier HTML existant
   * @param {Object} smartlinkData - Nouvelles données du SmartLink
   * @returns {Promise<string>} - Chemin du fichier mis à jour
   */
  async updateSmartLinkHtml(smartlinkData) {
    try {
      // Suppression de l'ancien fichier si slug a changé
      if (smartlinkData.oldSlug && smartlinkData.oldSlug !== smartlinkData.slug) {
        await this.deleteSmartLinkHtml(smartlinkData.artist.slug, smartlinkData.oldSlug);
      }

      // Génération du nouveau fichier
      return await this.generateSmartLinkHtml(smartlinkData);

    } catch (error) {
      console.error('❌ Erreur mise à jour HTML:', error);
      throw error;
    }
  }

  /**
   * Régénère tous les SmartLinks HTML (maintenance)
   * @param {Array} smartlinksData - Tableau de tous les SmartLinks
   */
  async regenerateAllSmartLinks(smartlinksData) {
    console.log(`🔄 Régénération de ${smartlinksData.length} SmartLinks...`);
    
    const results = {
      success: [],
      errors: []
    };

    for (const smartlink of smartlinksData) {
      try {
        const filePath = await this.generateSmartLinkHtml(smartlink);
        results.success.push(filePath);
      } catch (error) {
        results.errors.push({
          smartlink: `${smartlink.artist.name} - ${smartlink.trackTitle}`,
          error: error.message
        });
      }
    }

    console.log(`✅ Régénération terminée: ${results.success.length} succès, ${results.errors.length} erreurs`);
    return results;
  }

  /**
   * Valide les données d'un SmartLink
   * @param {Object} data - Données à valider
   */
  validateSmartLinkData(data) {
    const required = ['trackTitle', 'artist', 'slug', 'platformLinks'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Champs manquants: ${missing.join(', ')}`);
    }

    if (!data.artist.name || !data.artist.slug) {
      throw new Error('Données artiste incomplètes (name, slug requis)');
    }

    if (!Array.isArray(data.platformLinks) || data.platformLinks.length === 0) {
      throw new Error('Au moins un lien de plateforme requis');
    }
  }

  /**
   * Prépare les données pour le template EJS
   * @param {Object} smartlinkData - Données brutes du SmartLink
   * @returns {Object} - Données formatées pour le template
   */
  prepareTemplateData(smartlinkData) {
    const artistName = smartlinkData.artist.name;
    const trackTitle = smartlinkData.trackTitle;
    
    return {
      // Métadonnées SEO
      title: `${trackTitle} - ${artistName}`,
      description: smartlinkData.description || `Écoutez "${trackTitle}" de ${artistName} sur toutes les plateformes de streaming`,
      image: smartlinkData.coverImageUrl || `${this.baseUrl}/assets/images/default-cover.jpg`,
      url: `${this.baseUrl}/smartlinks/${smartlinkData.artist.slug}/${smartlinkData.slug}`,
      
      // Données du SmartLink
      artist: {
        name: artistName,
        slug: smartlinkData.artist.slug
      },
      track: {
        title: trackTitle,
        slug: smartlinkData.slug,
        subtitle: smartlinkData.subtitle || ''
      },
      
      // Liens plateformes organisés
      platforms: this.organizePlatformLinks(smartlinkData.platformLinks),
      
      // Configuration
      baseUrl: this.baseUrl,
      analyticsEnabled: process.env.NODE_ENV === 'production',
      gaId: process.env.GA4_ID,
      metaPixelId: process.env.META_PIXEL_ID,
      
      // Charte MDMC
      brandName: 'MDMC Music Ads',
      brandUrl: 'https://www.mdmcmusicads.com',
      primaryColor: '#E50914',
      
      // Timestamp pour cache busting
      timestamp: Date.now()
    };
  }

  /**
   * Organise les liens des plateformes avec métadonnées
   * @param {Array} platformLinks - Liens bruts des plateformes
   * @returns {Array} - Liens organisés avec métadonnées
   */
  organizePlatformLinks(platformLinks) {
    const platformConfig = {
      spotify: { name: 'Spotify', color: '#1DB954', priority: 1 },
      apple: { name: 'Apple Music', color: '#FA243C', priority: 2 },
      youtube: { name: 'YouTube Music', color: '#FF0000', priority: 3 },
      deezer: { name: 'Deezer', color: '#FEAA2D', priority: 4 },
      tidal: { name: 'Tidal', color: '#000000', priority: 5 },
      amazon: { name: 'Amazon Music', color: '#00A8E1', priority: 6 },
      soundcloud: { name: 'SoundCloud', color: '#FF5500', priority: 7 },
      bandcamp: { name: 'Bandcamp', color: '#629AA0', priority: 8 }
    };

    return platformLinks
      .filter(link => link.url && link.platform)
      .map(link => ({
        ...link,
        ...platformConfig[link.platform],
        displayName: platformConfig[link.platform]?.name || link.platform
      }))
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));
  }

  /**
   * Génère le chemin de fichier pour un SmartLink
   * @param {string} artistSlug - Slug de l'artiste
   * @param {string} trackSlug - Slug du titre
   * @returns {string} - Chemin complet du fichier
   */
  getFilePath(artistSlug, trackSlug) {
    return path.join(this.publicDir, artistSlug, `${trackSlug}.html`);
  }

  /**
   * Génère l'URL publique pour un SmartLink
   * @param {string} artistSlug - Slug de l'artiste
   * @param {string} trackSlug - Slug du titre
   * @returns {string} - URL publique
   */
  getPublicUrl(artistSlug, trackSlug) {
    return `${this.baseUrl}/smartlinks/${artistSlug}/${trackSlug}`;
  }

  /**
   * Assure l'existence d'un dossier
   * @param {string} dirPath - Chemin du dossier
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Nettoie les dossiers vides après suppression
   * @param {string} artistSlug - Slug de l'artiste
   */
  async cleanupEmptyDirectories(artistSlug) {
    try {
      const artistDir = path.join(this.publicDir, artistSlug);
      const files = await fs.readdir(artistDir);
      
      if (files.length === 0) {
        await fs.rmdir(artistDir);
        console.log(`🧹 Dossier artiste vide supprimé: ${artistDir}`);
      }
    } catch (error) {
      // Ignore les erreurs de nettoyage
      console.log(`⚠️ Impossible de nettoyer le dossier: ${error.message}`);
    }
  }

  /**
   * Vérifie si un fichier HTML existe
   * @param {string} artistSlug - Slug de l'artiste
   * @param {string} trackSlug - Slug du titre
   * @returns {Promise<boolean>} - True si le fichier existe
   */
  async htmlFileExists(artistSlug, trackSlug) {
    try {
      const filePath = this.getFilePath(artistSlug, trackSlug);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtient les statistiques du générateur
   * @returns {Promise<Object>} - Statistiques
   */
  async getStats() {
    try {
      const stats = {
        totalFiles: 0,
        totalArtists: 0,
        totalSize: 0,
        lastGenerated: null
      };

      const artists = await fs.readdir(this.publicDir);
      stats.totalArtists = artists.length;

      for (const artist of artists) {
        const artistDir = path.join(this.publicDir, artist);
        const files = await fs.readdir(artistDir);
        
        for (const file of files) {
          if (file.endsWith('.html')) {
            stats.totalFiles++;
            const filePath = path.join(artistDir, file);
            const stat = await fs.stat(filePath);
            stats.totalSize += stat.size;
            
            if (!stats.lastGenerated || stat.mtime > stats.lastGenerated) {
              stats.lastGenerated = stat.mtime;
            }
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      return { error: error.message };
    }
  }
}

module.exports = StaticHtmlGenerator;