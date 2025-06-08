// controllers/wordpress.js - Version sans asyncHandler qui ne crash pas

// @desc    Obtenir les derniers articles WordPress (PROXY)
// @route   GET /api/wordpress/posts
// @access  Public
exports.getLatestPosts = async (req, res, next) => {
  console.log('🔥 [DEBUG] WordPress Proxy démarré');
  console.log('🔥 [DEBUG] Query params:', req.query);
  
  try {
    // URL directe WordPress API
    const wpApiUrl = 'https://blog-wp-production.up.railway.app/wp-json/wp/v2/posts?per_page=3&_embed';
    console.log('🔥 [DEBUG] URL WordPress:', wpApiUrl);

    // Import fetch pour Node.js
    let fetch;
    if (typeof globalThis.fetch !== 'undefined') {
      fetch = globalThis.fetch;
    } else {
      try {
        fetch = require('node-fetch');
      } catch (e) {
        console.error('❌ [ERROR] Fetch non disponible:', e.message);
        throw new Error('Fetch API non disponible');
      }
    }

    console.log('🔥 [DEBUG] Fetch disponible:', !!fetch);

    // Requête vers WordPress
    const response = await fetch(wpApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MDMC-Backend/1.0'
      }
    });

    console.log('🔥 [DEBUG] WordPress Response Status:', response.status);
    console.log('🔥 [DEBUG] WordPress Response OK:', response.ok);

    if (!response.ok) {
      throw new Error(`WordPress API Error: ${response.status}`);
    }

    const posts = await response.json();
    console.log('🔥 [DEBUG] Posts récupérés:', posts.length);
    
    if (posts.length > 0) {
      console.log('🔥 [DEBUG] Premier post:', posts[0]?.title?.rendered);
    }

    // Format simple pour le frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: {
        rendered: post.title.rendered
      },
      excerpt: {
        rendered: post.excerpt.rendered
      },
      date: post.date,
      link: post.link,
      categories: post.categories || [],
      _embedded: {
        'wp:featuredmedia': post._embedded?.['wp:featuredmedia'] || null
      }
    }));

    console.log('🔥 [DEBUG] Posts formatés:', formattedPosts.length);

    // Réponse API
    const responseData = {
      success: true,
      count: formattedPosts.length,
      data: formattedPosts,
      meta: {
        source: 'WordPress API',
        timestamp: new Date().toISOString()
      }
    };

    console.log('🔥 [DEBUG] Envoi réponse API...');
    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ [ERROR] WordPress Proxy:', error.message);
    console.error('❌ [ERROR] Stack:', error.stack);

    // Articles de fallback avec VRAIES images
    const fallbackPosts = [
      {
        id: 1,
        title: { rendered: "Stratégies de marketing musical avancées" },
        excerpt: { rendered: "Découvrez les dernières tendances en marketing musical et comment optimiser votre présence digitale pour atteindre votre audience cible..." },
        date: new Date().toISOString(),
        link: "https://blog-wp-production.up.railway.app/",
        categories: [1],
        _embedded: {
          'wp:featuredmedia': [{
            source_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop&crop=center"
          }]
        }
      },
      {
        id: 2,
        title: { rendered: "Comment propulser son clip musical en 2025" },
        excerpt: { rendered: "Les coulisses d'un succès inattendu et les stratégies éprouvées pour faire exploser la visibilité de votre clip sur YouTube et les réseaux sociaux..." },
        date: new Date().toISOString(),
        link: "https://blog-wp-production.up.railway.app/",
        categories: [2],
        _embedded: {
          'wp:featuredmedia': [{
            source_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=400&fit=crop&crop=center"
          }]
        }
      },
      {
        id: 3,
        title: { rendered: "Optimisation des campagnes publicitaires musicales" },
        excerpt: { rendered: "Techniques avancées et méthodes éprouvées pour maximiser le ROI de vos campagnes publicitaires et toucher votre audience idéale efficacement..." },
        date: new Date().toISOString(),
        link: "https://blog-wp-production.up.railway.app/",
        categories: [3],
        _embedded: {
          'wp:featuredmedia': [{
            source_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop&crop=center"
          }]
        }
      }
    ];

    res.status(200).json({
      success: true,
      count: fallbackPosts.length,
      data: fallbackPosts,
      meta: {
        source: 'Fallback Data - Backend Error Recovery',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
};
