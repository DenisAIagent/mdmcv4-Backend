// controllers/wordpress.js - Fix export/import avec logs détaillés
const axios = require('axios');

// Système de logs détaillés
const logger = {
  info: (msg, data = {}) => console.log(`✅ [${new Date().toISOString()}] WP-CTRL: ${msg}`, data),
  error: (msg, error = {}) => console.error(`❌ [${new Date().toISOString()}] WP-CTRL: ${msg}`, error),
  warn: (msg, data = {}) => console.warn(`⚠️ [${new Date().toISOString()}] WP-CTRL: ${msg}`, data),
  debug: (msg, data = {}) => console.log(`🔍 [${new Date().toISOString()}] WP-CTRL: ${msg}`, data),
  request: (url, params) => console.log(`📡 [${new Date().toISOString()}] WP-CTRL: Requête vers ${url}`, params),
  response: (status, dataLength) => console.log(`📦 [${new Date().toISOString()}] WP-CTRL: Réponse ${status}, ${dataLength} articles`)
};

// @desc    Obtenir les derniers articles WordPress (PROXY)
// @route   GET /api/wordpress/posts
// @access  Public
const getLatestPosts = async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Début getLatestPosts');
    logger.debug('Headers de la requête:', {
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      referer: req.headers.referer
    });

    const wpUrl = 'https://blog.mdmcmusicads.com/wp-json/wp/v2/posts';
    const params = {
      per_page: 3,
      _embed: true
    };
    
    logger.request(wpUrl, params);
    logger.info('⏳ Appel WordPress API en cours...');
    
    const response = await axios.get(wpUrl, {
      params: params,
      timeout: 10000,
      headers: {
        'User-Agent': 'MDMC-Backend/1.0'
      }
    });

    logger.response(response.status, response.data.length);
    logger.debug('Headers de réponse WordPress:', {
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      server: response.headers.server
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Format de réponse WordPress invalide');
    }

    logger.info(`✅ ${response.data.length} articles bruts reçus de WordPress`);

    const formattedPosts = response.data.map((post, index) => {
      logger.debug(`🔄 Formatage article ${index + 1}:`, {
        id: post.id,
        title: post.title?.rendered?.substring(0, 30) + '...'
      });

      // Extraire l'image featured avec logs
      let featuredImage = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
      
      if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
        featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
        logger.debug(`📷 Image trouvée pour article ${post.id}:`, featuredImage.substring(0, 50) + '...');
      } else {
        logger.warn(`📷 Pas d'image featured pour article ${post.id}, utilisation fallback`);
      }

      // Extraire la catégorie avec logs
      let category = 'ARTICLE';
      if (post._embedded?.['wp:term']?.[0]?.[0]?.name) {
        category = post._embedded['wp:term'][0][0].name.toUpperCase();
        logger.debug(`🏷️ Catégorie trouvée pour article ${post.id}:`, category);
      } else {
        logger.warn(`🏷️ Pas de catégorie pour article ${post.id}, utilisation par défaut`);
      }

      const formattedPost = {
        id: post.id,
        title: post.title.rendered,
        excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
        date: new Date(post.date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        category: category,
        image: featuredImage,
        link: post.link
      };

      logger.debug(`✅ Article ${index + 1} formaté:`, {
        id: formattedPost.id,
        title: formattedPost.title.substring(0, 30) + '...',
        category: formattedPost.category
      });

      return formattedPost;
    });

    const duration = Date.now() - startTime;
    logger.info(`🎯 Articles traités avec succès en ${duration}ms`);

    const responseData = {
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
      processTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    };

    logger.info('📤 Envoi réponse au frontend:', {
      count: formattedPosts.length,
      processTime: `${duration}ms`
    });

    res.status(200).json(responseData);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('💥 Erreur dans getLatestPosts:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      duration: `${duration}ms`
    });

    if (error.response) {
      logger.error('📡 Détails réponse d\'erreur:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    }

    logger.warn('🔄 Utilisation fallback articles à cause de l\'erreur');
    
    // Fallback avec articles par défaut avec logs
    const fallbackPosts = [
      {
        id: 1,
        title: "Stratégies de marketing musical avancées",
        excerpt: "Découvrez les dernières tendances en marketing musical et comment optimiser votre présence digitale pour atteindre votre audience cible...",
        date: "7 juin 2025",
        category: "STRATÉGIE",
        image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        link: "https://blog.mdmcmusicads.com"
      },
      {
        id: 2,
        title: "Comment propulser son clip musical en 2025",
        excerpt: "Les coulisses d'un succès inattendu et les stratégies éprouvées pour faire exploser la visibilité de votre clip sur YouTube et les réseaux...",
        date: "8 juin 2025",
        category: "TENDANCES",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        link: "https://blog.mdmcmusicads.com"
      },
      {
        id: 3,
        title: "Optimisation des campagnes publicitaires musicales",
        excerpt: "Techniques avancées et méthodes éprouvées pour maximiser le ROI de vos campagnes publicitaires et toucher votre audience idéale...",
        date: "6 juin 2025",
        category: "PERFORMANCE",
        image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        link: "https://blog.mdmcmusicads.com"
      }
    ];

    logger.info(`📦 Envoi ${fallbackPosts.length} articles fallback`);

    res.status(200).json({
      success: true,
      count: fallbackPosts.length,
      data: fallbackPosts,
      note: 'Fallback data - WordPress API non accessible',
      error: error.message,
      processTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
};

// Export correct
module.exports = {
  getLatestPosts
};
