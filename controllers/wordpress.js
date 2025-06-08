// controllers/wordpress.js - Fix export/import
const axios = require('axios');

// @desc    Obtenir les derniers articles WordPress (PROXY)
// @route   GET /api/wordpress/posts
// @access  Public
const getLatestPosts = async (req, res) => {
  try {
    console.log('🔄 Controller: Début appel WordPress API...');
    
    const response = await axios.get('https://blog.mdmcmusicads.com/wp-json/wp/v2/posts', {
      params: {
        per_page: 3,
        _embed: true
      },
      timeout: 10000
    });

    console.log('✅ Controller: Réponse WordPress reçue, articles:', response.data.length);

    const formattedPosts = response.data.map(post => {
      // Extraire l'image featured
      let featuredImage = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
      
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        featuredImage = post._embedded['wp:featuredmedia'][0].source_url;
      }

      // Extraire la catégorie
      let category = 'ARTICLE';
      if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0] && post._embedded['wp:term'][0][0]) {
        category = post._embedded['wp:term'][0][0].name.toUpperCase();
      }

      return {
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
    });

    console.log('✅ Controller: Articles formatés:', formattedPosts.length);

    res.status(200).json({
      success: true,
      count: formattedPosts.length,
      data: formattedPosts
    });

  } catch (error) {
    console.error('❌ Controller WordPress Error:', error.message);
    
    // Fallback avec articles par défaut
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

    console.log('🔄 Controller: Utilisation fallback articles');

    res.status(200).json({
      success: true,
      count: fallbackPosts.length,
      data: fallbackPosts,
      note: 'Fallback data - WordPress API non accessible'
    });
  }
};

// Export correct
module.exports = {
  getLatestPosts
};
