// Middleware pour intégrer la génération HTML statique avec l'API SmartLinks
// Génère/met à jour/supprime automatiquement les fichiers HTML lors des opérations CRUD

const StaticHtmlGenerator = require('../services/staticHtmlGenerator');

class HtmlGenerationMiddleware {
  constructor() {
    this.htmlGenerator = new StaticHtmlGenerator();
  }

  /**
   * Middleware après création d'un SmartLink
   * Génère automatiquement le fichier HTML statique
   */
  afterCreate() {
    return async (req, res, next) => {
      try {
        // Vérifier si la réponse contient un SmartLink créé avec succès
        if (!res.locals.smartlink || !res.locals.smartlink._id) {
          return next();
        }

        const smartlink = res.locals.smartlink;
        
        // Préparer les données pour le générateur HTML
        const smartlinkData = this.formatSmartLinkForHtml(smartlink);
        
        // Génération du fichier HTML en arrière-plan
        setImmediate(async () => {
          try {
            const filePath = await this.htmlGenerator.generateSmartLinkHtml(smartlinkData);
            console.log(`✅ HTML généré automatiquement: ${filePath}`);
            
            // Optionnel: mettre à jour le SmartLink avec le chemin du fichier
            await smartlink.constructor.findByIdAndUpdate(smartlink._id, {
              htmlFilePath: filePath,
              htmlGeneratedAt: new Date()
            });
            
          } catch (htmlError) {
            console.error('❌ Erreur génération HTML après création:', htmlError);
            // Ne pas faire échouer la réponse API pour une erreur de génération HTML
          }
        });

        next();
        
      } catch (error) {
        console.error('❌ Erreur middleware afterCreate:', error);
        // Continuer sans faire échouer la requête
        next();
      }
    };
  }

  /**
   * Middleware après mise à jour d'un SmartLink
   * Régénère le fichier HTML statique
   */
  afterUpdate() {
    return async (req, res, next) => {
      try {
        if (!res.locals.smartlink || !res.locals.oldSmartlink) {
          return next();
        }

        const newSmartlink = res.locals.smartlink;
        const oldSmartlink = res.locals.oldSmartlink;
        
        // Préparer les données pour le générateur
        const smartlinkData = this.formatSmartLinkForHtml(newSmartlink);
        
        // Si les slugs ont changé, inclure l'ancien slug pour suppression
        if (oldSmartlink.slug !== newSmartlink.slug) {
          smartlinkData.oldSlug = oldSmartlink.trackSlug;
        }

        // Mise à jour du fichier HTML en arrière-plan
        setImmediate(async () => {
          try {
            const filePath = await this.htmlGenerator.updateSmartLinkHtml(smartlinkData);
            console.log(`🔄 HTML mis à jour automatiquement: ${filePath}`);
            
            // Mettre à jour la date de génération
            await newSmartlink.constructor.findByIdAndUpdate(newSmartlink._id, {
              htmlFilePath: filePath,
              htmlGeneratedAt: new Date()
            });
            
          } catch (htmlError) {
            console.error('❌ Erreur génération HTML après mise à jour:', htmlError);
          }
        });

        next();
        
      } catch (error) {
        console.error('❌ Erreur middleware afterUpdate:', error);
        next();
      }
    };
  }

  /**
   * Middleware après suppression d'un SmartLink
   * Supprime le fichier HTML statique
   */
  afterDelete() {
    return async (req, res, next) => {
      try {
        if (!res.locals.deletedSmartlink) {
          return next();
        }

        const deletedSmartlink = res.locals.deletedSmartlink;
        
        // Suppression du fichier HTML en arrière-plan
        setImmediate(async () => {
          try {
            await this.htmlGenerator.deleteSmartLinkHtml(
              deletedSmartlink.artistSlug, 
              deletedSmartlink.trackSlug
            );
            console.log(`🗑️ HTML supprimé automatiquement: ${deletedSmartlink.slug}`);
            
          } catch (htmlError) {
            console.error('❌ Erreur suppression HTML après deletion:', htmlError);
          }
        });

        next();
        
      } catch (error) {
        console.error('❌ Erreur middleware afterDelete:', error);
        next();
      }
    };
  }

  /**
   * Middleware pour stocker les données avant modification/suppression
   * Nécessaire pour comparer les changements
   */
  beforeUpdate() {
    return async (req, res, next) => {
      try {
        const { slug } = req.params;
        
        if (slug) {
          // Stocker l'ancien SmartLink pour comparaison
          const SmartLinkHTML = require('../models/SmartLinkHTML');
          const oldSmartlink = await SmartLinkHTML.findOne({ slug });
          res.locals.oldSmartlink = oldSmartlink;
        }

        next();
        
      } catch (error) {
        console.error('❌ Erreur middleware beforeUpdate:', error);
        next();
      }
    };
  }

  /**
   * Middleware pour régénérer tous les SmartLinks HTML
   * Utile pour la maintenance ou changements de template
   */
  regenerateAll() {
    return async (req, res, next) => {
      try {
        const SmartLinkHTML = require('../models/SmartLinkHTML');
        const smartlinks = await SmartLinkHTML.find({ isPublished: true });
        
        if (smartlinks.length === 0) {
          return res.json({
            success: true,
            message: 'Aucun SmartLink à régénérer',
            count: 0
          });
        }

        // Formatage des données pour le générateur
        const smartlinksData = smartlinks.map(smartlink => 
          this.formatSmartLinkForHtml(smartlink)
        );

        // Régénération de tous les fichiers HTML
        const results = await this.htmlGenerator.regenerateAllSmartLinks(smartlinksData);

        res.json({
          success: true,
          message: 'Régénération terminée',
          total: smartlinks.length,
          successCount: results.success.length,
          errorCount: results.errors.length,
          errors: results.errors.length > 0 ? results.errors : undefined,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Erreur régénération complète:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la régénération',
          error: error.message
        });
      }
    };
  }

  /**
   * Formate les données d'un SmartLink pour le générateur HTML
   * @param {Object} smartlink - Document SmartLink de la base de données
   * @returns {Object} - Données formatées pour le générateur
   */
  formatSmartLinkForHtml(smartlink) {
    // Création des liens de plateformes formatés
    const platformLinks = [];
    
    const platformMapping = {
      spotifyUrl: 'spotify',
      appleUrl: 'apple',
      youtubeUrl: 'youtube',
      deezerUrl: 'deezer',
      amazonUrl: 'amazon',
      tidalUrl: 'tidal',
      soundcloudUrl: 'soundcloud',
      bandcampUrl: 'bandcamp'
    };

    Object.entries(platformMapping).forEach(([urlField, platformKey]) => {
      if (smartlink[urlField]) {
        platformLinks.push({
          platform: platformKey,
          url: smartlink[urlField]
        });
      }
    });

    return {
      trackTitle: smartlink.title,
      slug: smartlink.trackSlug,
      description: smartlink.description || `Écoutez "${smartlink.title}" de ${smartlink.artist} sur toutes les plateformes de streaming`,
      subtitle: smartlink.subtitle || '',
      coverImageUrl: smartlink.imageUrl,
      platformLinks: platformLinks,
      artist: {
        name: smartlink.artist,
        slug: smartlink.artistSlug
      },
      // Données additionnelles
      primaryColor: smartlink.primaryColor || '#E50914',
      template: smartlink.template || 'default',
      isPublished: smartlink.isPublished,
      createdAt: smartlink.createdAt
    };
  }

  /**
   * Helper pour ajouter les données SmartLink aux locals
   * @param {Object} smartlink - SmartLink créé/modifié
   */
  static setSmartLinkInLocals(smartlink) {
    return (req, res, next) => {
      res.locals.smartlink = smartlink;
      next();
    };
  }

  /**
   * Helper pour ajouter les données SmartLink supprimé aux locals
   * @param {Object} smartlink - SmartLink supprimé
   */
  static setDeletedSmartLinkInLocals(smartlink) {
    return (req, res, next) => {
      res.locals.deletedSmartlink = smartlink;
      next();
    };
  }

  /**
   * Statistiques des fichiers HTML générés
   */
  getStats() {
    return async (req, res, next) => {
      try {
        const stats = await this.htmlGenerator.getStats();
        
        res.json({
          success: true,
          message: 'Statistiques HTML',
          data: stats,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Erreur récupération stats HTML:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur récupération statistiques',
          error: error.message
        });
      }
    };
  }
}

// Export d'une instance singleton
const htmlGenerationMiddleware = new HtmlGenerationMiddleware();

module.exports = htmlGenerationMiddleware;