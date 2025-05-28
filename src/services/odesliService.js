const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Service d'intégration avec l'API Odesli (anciennement Songlink)
 * Cette API permet de récupérer les liens vers différentes plateformes de streaming
 * à partir d'un seul lien.
 */
class OdesliService {
  constructor() {
    // URL de base de l'API Odesli
    this.baseUrl = 'https://api.song.link/v1-alpha.1/links';
    
    // Cache pour stocker les résultats des requêtes
    this.cache = new Map();
    
    // Durée de validité du cache en millisecondes (24 heures)
    this.cacheTTL = 24 * 60 * 60 * 1000;
  }

  /**
   * Récupère les informations d'un lien musical à partir de l'API Odesli
   * @param {string} url - URL d'une plateforme de streaming musical
   * @returns {Promise<Object>} - Informations sur le morceau et liens vers les plateformes
   */
  async getLinks(url) {
    try {
      // Vérifier si le résultat est dans le cache
      if (this.cache.has(url)) {
        const cachedData = this.cache.get(url);
        
        // Vérifier si le cache est encore valide
        if (Date.now() - cachedData.timestamp < this.cacheTTL) {
          logger.info(`Récupération des données depuis le cache pour: ${url}`);
          return cachedData.data;
        }
        
        // Supprimer les données expirées du cache
        this.cache.delete(url);
      }
      
      logger.info(`Requête à l'API Odesli pour: ${url}`);
      
      // Paramètres de la requête
      const params = {
        url,
        userCountry: 'FR', // Par défaut, utiliser la France comme pays
      };
      
      // Effectuer la requête à l'API Odesli
      const response = await axios.get(this.baseUrl, { params });
      
      // Vérifier si la réponse est valide
      if (!response.data) {
        throw new Error('Réponse vide de l\'API Odesli');
      }
      
      // Stocker le résultat dans le cache
      this.cache.set(url, {
        data: response.data,
        timestamp: Date.now(),
      });
      
      return response.data;
    } catch (error) {
      logger.error(`Erreur lors de la requête à l'API Odesli: ${error.message}`);
      throw new Error(`Impossible de récupérer les informations pour ce lien: ${error.message}`);
    }
  }

  /**
   * Formate les données de l'API Odesli pour les adapter au format de SmartLink
   * @param {Object} odesliData - Données brutes de l'API Odesli
   * @returns {Object} - Données formatées pour un SmartLink
   */
  formatData(odesliData) {
    try {
      // Vérifier si les données sont valides
      if (!odesliData || !odesliData.entityUniqueId) {
        throw new Error('Données Odesli invalides');
      }
      
      // Récupérer les informations de base
      const { entityUniqueId, entitiesByUniqueId, linksByPlatform } = odesliData;
      const entity = entitiesByUniqueId[entityUniqueId];
      
      // Vérifier si l'entité existe
      if (!entity) {
        throw new Error('Entité musicale non trouvée');
      }
      
      // Mapper les plateformes supportées
      const platformMapping = {
        spotify: 'Spotify',
        appleMusic: 'Apple Music',
        deezer: 'Deezer',
        youtubeMusic: 'YouTube Music',
        amazonMusic: 'Amazon Music',
        tidal: 'Tidal',
        soundcloud: 'SoundCloud',
        bandcamp: 'Bandcamp',
      };
      
      // Créer la liste des plateformes
      const platforms = [];
      
      // Parcourir les liens par plateforme
      for (const [platform, linkData] of Object.entries(linksByPlatform)) {
        // Vérifier si la plateforme est supportée
        if (platformMapping[platform]) {
          platforms.push({
            name: platformMapping[platform],
            url: linkData.url,
          });
        }
      }
      
      // Déterminer le type de sortie (single, ep, album)
      let type = 'single';
      if (entity.type === 'album') {
        // Si c'est un album, vérifier le nombre de pistes
        const trackCount = entity.trackCount || 0;
        if (trackCount > 1 && trackCount <= 6) {
          type = 'ep';
        } else if (trackCount > 6) {
          type = 'album';
        }
      }
      
      // Créer un slug à partir du titre
      const slug = this.createSlug(`${entity.title} ${entity.artistName}`);
      
      // Retourner les données formatées
      return {
        title: entity.title,
        artistName: entity.artistName,
        coverImage: entity.thumbnailUrl,
        platforms,
        type,
        slug,
      };
    } catch (error) {
      logger.error(`Erreur lors du formatage des données Odesli: ${error.message}`);
      throw new Error(`Impossible de formater les données: ${error.message}`);
    }
  }

  /**
   * Crée un slug à partir d'une chaîne de caractères
   * @param {string} text - Texte à transformer en slug
   * @returns {string} - Slug généré
   */
  createSlug(text) {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') // Normaliser les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
      .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
      .replace(/--+/g, '-') // Éviter les tirets multiples
      .trim(); // Supprimer les espaces en début et fin
  }
}

module.exports = new OdesliService();
