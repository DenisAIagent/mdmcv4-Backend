// backend/services/odesliService.js
// Service pour intégration API Odesli (song.link) - Cross-platform music links

const axios = require('axios');

class OdesliService {
  constructor() {
    this.baseURL = 'https://api.song.link/v1-alpha.1';
    this.timeout = 30000; // 30 secondes
    this.retryAttempts = 3;
    this.cache = new Map(); // Cache en mémoire simple
    this.cacheTimeout = 3600000; // 1 heure
  }

  /**
   * Récupère les liens cross-platform pour une URL/ISRC donnée
   * @param {string} input - URL ou ISRC/UPC
   * @param {string} userCountry - Code pays (FR, US, etc.)
   * @returns {Promise<Object>} Données formatées pour l'interface
   */
  async fetchPlatformLinks(input, userCountry = 'FR') {
    const cacheKey = `${input}_${userCountry}`;
    
    // Vérifier le cache
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log('📦 Odesli: Données récupérées depuis le cache');
      return cached;
    }

    try {
      console.log(`🔍 Odesli: Recherche pour "${input}" (${userCountry})`);
      
      const params = new URLSearchParams({
        url: input,
        userCountry: userCountry,
        songIfSingle: 'true'
      });

      const response = await this.makeRequest(`/links?${params.toString()}`, 'GET');
      
      if (!response || !response.entitiesByUniqueId || !response.linksByPlatform) {
        throw new Error('Format de réponse API invalide');
      }

      // Formatage des données pour notre interface
      console.log('🔄 Début formatage réponse...');
      let formattedData;
      try {
        formattedData = this.formatApiResponse(response);
        console.log('✅ Formatage réussi');
      } catch (formatError) {
        console.error('❌ Erreur formatage:', formatError.message);
        console.error('Stack:', formatError.stack);
        throw formatError;
      }
      
      // Mise en cache
      this.setCachedResult(cacheKey, formattedData);
      
      console.log(`✅ Odesli: ${Object.keys(formattedData.data.linksByPlatform).length} plateformes trouvées`);
      return formattedData;

    } catch (error) {
      console.error('❌ Odesli API Error:', error.message);
      throw this.handleApiError(error, input);
    }
  }

  /**
   * Effectue une requête HTTP avec retry automatique
   */
  async makeRequest(endpoint, method = 'GET', config = {}) {
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const requestConfig = {
          method,
          url: `${this.baseURL}${endpoint}`,
          timeout: this.timeout,
          headers: {
            'User-Agent': 'MDMC-SmartLinks/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          ...config
        };

        console.log(`🔗 Odesli Request: ${requestConfig.method} ${requestConfig.url}`);
        if (config.params) {
          console.log(`📋 Params:`, config.params);
        }

        const response = await axios(requestConfig);
        console.log(`📥 Odesli Response Status: ${response.status}`);
        return response.data;

      } catch (error) {
        lastError = error;
        console.log(`❌ Tentative ${attempt} échouée:`, error.response?.status, error.response?.data || error.message);
        
        if (attempt < this.retryAttempts && (!error.response || error.response.status >= 500)) {
          const delay = Math.pow(2, attempt) * 1000; // Backoff exponentiel
          console.log(`⏳ Odesli: Tentative ${attempt} échouée, retry dans ${delay}ms`);
          await this.sleep(delay);
        } else {
          break; // Ne pas retry pour les erreurs 4xx
        }
      }
    }

    throw lastError;
  }

  /**
   * Formate la réponse API Odesli pour notre interface
   */
  formatApiResponse(response) {
    console.log('🔄 Formatage réponse Odesli:', Object.keys(response));
    
    // Vérifications de sécurité
    if (!response || typeof response !== 'object') {
      throw new Error('Réponse API vide ou invalide');
    }

    if (!response.entitiesByUniqueId || !response.linksByPlatform) {
      console.log('⚠️ Structure réponse:', {
        hasEntities: !!response.entitiesByUniqueId,
        hasLinks: !!response.linksByPlatform,
        keys: Object.keys(response)
      });
      throw new Error('Structure de réponse API invalide - entités ou liens manquants');
    }

    // Trouver l'entité principale
    const entityId = response.entityUniqueId;
    const entity = entityId ? response.entitiesByUniqueId[entityId] : null;
    
    // Si pas d'entité principale, prendre la première disponible
    const fallbackEntity = entity || Object.values(response.entitiesByUniqueId)[0];
    
    if (!fallbackEntity) {
      throw new Error('Aucune entité trouvée dans la réponse');
    }

    console.log('🎵 Entité trouvée:', {
      id: entityId,
      title: fallbackEntity.title,
      artist: fallbackEntity.artistName
    });

    // Métadonnées principales
    const metadata = {
      title: fallbackEntity.title || '',
      artist: fallbackEntity.artistName || '',
      album: fallbackEntity.albumName || '',
      artwork: this.selectBestArtwork(fallbackEntity),
      isrc: this.extractISRC(response),
      type: fallbackEntity.type || 'song',
      duration: fallbackEntity.durationInSeconds,
      releaseDate: fallbackEntity.releaseDate,
      apiProvider: fallbackEntity.apiProvider
    };

    // Liens par plateforme avec nettoyage
    const linksByPlatform = this.cleanPlatformLinks(response.linksByPlatform);
    
    // Artworks alternatifs
    const alternativeArtworks = this.extractAlternativeArtworks(response);

    return {
      success: true,
      data: {
        ...metadata,
        linksByPlatform,
        alternativeArtworks,
        pageUrl: response.pageUrl,
        entityId: entityId || 'fallback',
        userCountry: response.userCountry
      }
    };
  }

  /**
   * Sélectionne la meilleure artwork disponible
   */
  selectBestArtwork(entity) {
    // Priorité : plus haute résolution disponible
    if (entity.thumbnailUrl) {
      // Essayer d'obtenir une version haute résolution
      const baseUrl = entity.thumbnailUrl;
      
      // Spotify: remplacer par 640x640
      if (baseUrl.includes('i.scdn.co')) {
        return baseUrl.replace(/\/[0-9]+x[0-9]+\//, '/640x640/');
      }
      
      // Apple Music: essayer 1000x1000
      if (baseUrl.includes('mzstatic.com')) {
        return baseUrl.replace(/\/[0-9]+x[0-9]+/, '/1000x1000');
      }
      
      return baseUrl;
    }
    
    return null;
  }

  /**
   * Extrait les artworks alternatifs
   */
  extractAlternativeArtworks(response) {
    const artworks = [];
    
    if (!response.entitiesByUniqueId || typeof response.entitiesByUniqueId !== 'object') {
      return artworks;
    }
    
    Object.values(response.entitiesByUniqueId).forEach(entity => {
      if (entity && entity.thumbnailUrl) {
        artworks.push({
          url: entity.thumbnailUrl,
          width: entity.thumbnailWidth || 640,
          height: entity.thumbnailHeight || 640,
          source: entity.apiProvider || 'unknown'
        });
      }
    });

    // Trier par résolution décroissante
    return artworks.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  }

  /**
   * Nettoie et standardise les liens de plateformes
   */
  cleanPlatformLinks(linksByPlatform) {
    console.log('🧹 Nettoyage liens plateformes:', Object.keys(linksByPlatform || {}));
    
    if (!linksByPlatform || typeof linksByPlatform !== 'object') {
      console.log('⚠️ linksByPlatform invalide:', linksByPlatform);
      return {};
    }
    
    const cleaned = {};
    const platformMapping = {
      'spotify': 'Spotify',
      'appleMusic': 'Apple Music',
      'youtube': 'YouTube',
      'youtubeMusic': 'YouTube Music',
      'deezer': 'Deezer',
      'amazonMusic': 'Amazon Music',
      'tidal': 'Tidal',
      'soundcloud': 'SoundCloud',
      'pandora': 'Pandora',
      'napster': 'Napster',
      'yandex': 'Yandex Music'
    };

    Object.entries(linksByPlatform).forEach(([platform, data]) => {
      console.log(`🔗 Traitement plateforme ${platform}:`, typeof data, data);
      
      const cleanPlatform = platformMapping[platform] || platform;
      
      if (data && typeof data === 'object' && data.url) {
        cleaned[cleanPlatform] = {
          url: data.url.replace(/;$/, ''), // Supprimer ; final
          nativeAppUriMobile: data.nativeAppUriMobile,
          nativeAppUriDesktop: data.nativeAppUriDesktop,
          entityUniqueId: data.entityUniqueId
        };
      } else if (typeof data === 'string') {
        // Format simple URL directe
        cleaned[cleanPlatform] = {
          url: data.replace(/;$/, ''),
          nativeAppUriMobile: null,
          nativeAppUriDesktop: null,
          entityUniqueId: null
        };
      } else {
        console.log(`⚠️ Format de données invalide pour ${platform}:`, data);
      }
    });

    console.log('✅ Liens nettoyés:', Object.keys(cleaned));
    return cleaned;
  }

  /**
   * Extrait l'ISRC depuis la réponse
   */
  extractISRC(response) {
    if (!response.entitiesByUniqueId || typeof response.entitiesByUniqueId !== 'object') {
      return null;
    }
    
    // Rechercher dans les entités
    for (const entity of Object.values(response.entitiesByUniqueId)) {
      if (entity && entity.isrc) {
        return entity.isrc;
      }
    }
    return null;
  }

  /**
   * Détecte le type d'input (URL, ISRC, UPC)
   */
  detectInputType(input) {
    const cleanInput = input.trim();

    // ISRC: 12 caractères alphanumériques (CCXXXYYZZZZZZ)
    if (/^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/.test(cleanInput)) {
      return { type: 'isrc', value: cleanInput };
    }

    // UPC/EAN: 12-13 chiffres
    if (/^[0-9]{12,13}$/.test(cleanInput)) {
      return { type: 'upc', value: cleanInput };
    }

    // URL Spotify
    if (/open\.spotify\.com\/(track|album|playlist)\/[a-zA-Z0-9]+/.test(cleanInput)) {
      return { type: 'spotify_url', value: cleanInput };
    }

    // URL Apple Music
    if (/music\.apple\.com\/[a-z]{2}\//.test(cleanInput)) {
      return { type: 'apple_url', value: cleanInput };
    }

    // URL YouTube Music
    if (/music\.youtube\.com\/watch/.test(cleanInput)) {
      return { type: 'youtube_url', value: cleanInput };
    }

    // URL Deezer
    if (/deezer\.com\/(track|album|playlist)\/[0-9]+/.test(cleanInput)) {
      return { type: 'deezer_url', value: cleanInput };
    }

    // URL générique
    if (/^https?:\/\//.test(cleanInput)) {
      return { type: 'url', value: cleanInput };
    }

    throw new Error(`Format d'entrée non reconnu: ${cleanInput}`);
  }

  /**
   * Gestion d'erreurs API spécifiques
   */
  handleApiError(error, input) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 404:
          return new Error(`Contenu non trouvé pour: ${input}`);
        case 429:
          return new Error('Limite de taux API atteinte. Réessayez dans quelques minutes.');
        case 400:
          return new Error(`Format d'entrée invalide: ${input}`);
        case 500:
          return new Error('Erreur serveur Odesli. Réessayez plus tard.');
        default:
          return new Error(`Erreur API Odesli (${status}): ${data?.error || error.message}`);
      }
    }

    if (error.code === 'ECONNABORTED') {
      return new Error('Délai d\'attente dépassé. Vérifiez votre connexion.');
    }

    return new Error(`Erreur réseau: ${error.message}`);
  }

  /**
   * Gestion du cache simple
   */
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Nettoyage périodique du cache (garde les 100 derniers)
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      this.cache.clear();
      entries.slice(0, 100).forEach(([k, v]) => this.cache.set(k, v));
    }
  }

  /**
   * Utilitaire sleep pour retry
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validation des formats d'entrée
   */
  validateInput(input) {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      throw new Error('URL ou ISRC requis');
    }

    try {
      return this.detectInputType(input);
    } catch (error) {
      throw new Error(`Format invalide. Formats supportés: URL Spotify/Apple Music/YouTube Music/Deezer, ISRC (12 caractères), UPC (12-13 chiffres)`);
    }
  }

  /**
   * Test de santé de l'API
   */
  async healthCheck() {
    try {
      // Test avec un track Spotify connu
      const testUrl = 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';
      await this.makeRequest('/links', 'GET', { 
        params: { url: testUrl, userCountry: 'US' }
      });
      return { status: 'ok', message: 'API Odesli fonctionnelle' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

// Instance singleton
const odesliService = new OdesliService();

module.exports = odesliService;