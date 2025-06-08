// À remplacer dans controllers/wordpress.js - fonction getLatestPosts

// @desc    Obtenir les derniers articles WordPress (route publique - PROXY)
// @route   GET /api/wordpress/posts
// @access  Public
exports.getLatestPosts = asyncHandler(async (req, res, next) => {
  try {
    console.log('📝 WordPress Proxy: Récupération des articles...');
    
    // Configuration directe de l'API WordPress (plus besoin de connexion en base)
    const WORDPRESS_API_URL = 'https://blog-wp-production.up.railway.app/wp-json/wp/v2/posts';
    
    // Paramètres de la requête
    const params = new URLSearchParams({
      per_page: req.query.limit || 3,
      _embed: 'true',
      status: 'publish',
      orderby: 'date',
      order: 'desc'
    });

    const fullUrl = `${WORDPRESS_API_URL}?${params}`;
    console.log('🔗 WordPress Proxy: URL API:', fullUrl);

    // Faire la requête à l'API WordPress depuis le backend (pas de CORS côté serveur)
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MDMC-Backend-Proxy/1.0'
      },
      timeout: 10000 // 10 secondes timeout
    });

    if (!response.ok) {
      console.error('❌ WordPress Proxy: Erreur API WordPress:', response.status, response.statusText);
      throw new Error(`Erreur API WordPress: ${response.status} ${response.statusText}`);
    }

    const posts = await response.json();
    console.log('✅ WordPress Proxy: Articles récupérés:', posts.length);

    // Transformer et optimiser les données pour le frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: {
        rendered: post.title.rendered
      },
      excerpt: {
        rendered: post.excerpt.rendered
      },
      content: {
        rendered: post.content.rendered
      },
      date: post.date,
      modified: post.modified,
      slug: post.slug,
      link: post.link,
      categories: post.categories || [],
      
      // Images optimisées
      _embedded: post._embedded ? {
        'wp:featuredmedia': post._embedded['wp:featuredmedia'] ? [{
          source_url: post._embedded['wp:featuredmedia'][0]?.source_url,
          alt_text: post._embedded['wp:featuredmedia'][0]?.alt_text || post.title.rendered
        }] : null,
        'wp:term': post._embedded['wp:term'] || []
      } : {},

      // Métadonnées SEO si disponibles
      yoast_head_json: post.yoast_head_json || {}
    }));

    // Réponse avec métadonnées du proxy
    res.status(200).json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
      meta: {
        source: 'WordPress API Proxy',
        timestamp: new Date().toISOString(),
        cached: false
      }
    });

  } catch (error) {
    console.error('❌ WordPress Proxy: Erreur complète:', error);
    
    // En cas d'erreur, retourner des articles de fallback
    const fallbackArticles = [
      {
        id: 1,
        title: { rendered: "Stratégies de marketing musical avancées" },
        excerpt: { rendered: "Découvrez les dernières tendances en marketing musical et comment optimiser votre présence digitale..." },
        date: new Date().toISOString(),
        link: "https://blog-wp-production.up.railway.app/",
        categories: [1],
        _embedded: {
          'wp:featuredmedia': [{
            source_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop&crop=center",
            alt_text: "Marketing musical"
          }]
        }
      },
      {
        id: 2,
        title: { rendered: "Comment propulser son clip musical en 2025" },
        excerpt: { rendered: "Les coulisses d'un succès inattendu et les stratégies éprouvées pour faire exploser la visibilité de votre clip..." },
        date: new Date().toISOString(),
        link: "https://blog-wp-production.up.railway.app/",
        categories: [2],
        _embedded: {
          'wp:featuredmedia': [{
            source_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=400&fit=crop&crop=center",
            alt_text: "Studio musical"
          }]
        }
      },
      {
        id: 3,
        title: { rendered: "Optimisation des campagnes publicitaires musicales" },
        excerpt: { rendered: "Techniques avancées et méthodes éprouvées pour maximiser le ROI de vos campagnes publicitaires..." },
        date: new Date().toISOString(),
        link: "https://blog-wp-production.up.railway.app/",
        categories: [3],
        _embedded: {
          'wp:featuredmedia': [{
            source_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&crop=center",
            alt_text: "Marketing digital"
          }]
        }
      }
    ];

    res.status(200).json({
      success: true,
      count: fallbackArticles.length,
      data: fallbackArticles,
      meta: {
        source: 'Fallback Articles',
        timestamp: new Date().toISOString(),
        cached: false,
        error: 'WordPress API indisponible'
      }
    });
  }
});
