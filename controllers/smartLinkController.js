// @desc    Récupérer les liens de plateformes depuis une URL/ISRC source
// @route   POST /api/v1/smartlinks/fetch-platform-links
// @access  Private (Admin)
exports.fetchPlatformLinks = asyncHandler(async (req, res, next) => {
  const { sourceUrl } = req.body;
  
  if (!sourceUrl || typeof sourceUrl !== 'string' || sourceUrl.trim() === '') {
    return next(new ErrorResponse('URL source ou ISRC requis', 400));
  }

  const cleanSourceUrl = sourceUrl.trim();
  console.log('Backend: Récupération liens pour:', cleanSourceUrl);

  try {
    // TODO: Ici vous intégrerez votre logique de récupération réelle
    // Pour l'instant, réponse de test basée sur l'URL source
    
    let mockData = {
      title: "Titre extrait",
      artistName: "Artiste extrait",
      thumbnailUrl: "https://via.placeholder.com/300",
      links: {}
    };

    // Simulation basée sur le type d'URL
    if (cleanSourceUrl.includes('spotify.com')) {
      mockData = {
        title: "Track depuis Spotify",
        artistName: "Artiste Spotify",
        thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b273...",
        links: {
          spotify: cleanSourceUrl,
          appleMusic: "https://music.apple.com/album/track-id/123456789",
          deezer: "https://www.deezer.com/track/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    } else if (cleanSourceUrl.includes('music.apple.com')) {
      mockData = {
        title: "Track depuis Apple Music",
        artistName: "Artiste Apple",
        thumbnailUrl: "https://is1-ssl.mzstatic.com/image/thumb/...",
        links: {
          appleMusic: cleanSourceUrl,
          spotify: "https://open.spotify.com/track/123456789",
          deezer: "https://www.deezer.com/track/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    } else if (cleanSourceUrl.includes('deezer.com')) {
      mockData = {
        title: "Track depuis Deezer",
        artistName: "Artiste Deezer",
        thumbnailUrl: "https://e-cdns-images.dzcdn.net/images/cover/...",
        links: {
          deezer: cleanSourceUrl,
          spotify: "https://open.spotify.com/track/123456789",
          appleMusic: "https://music.apple.com/album/track-id/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    } else if (cleanSourceUrl.startsWith('ISRC') || /^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$/.test(cleanSourceUrl)) {
      // ISRC détecté
      mockData = {
        title: "Track depuis ISRC",
        artistName: "Artiste ISRC",
        thumbnailUrl: "https://via.placeholder.com/300",
        links: {
          spotify: "https://open.spotify.com/track/123456789",
          appleMusic: "https://music.apple.com/album/track-id/123456789",
          deezer: "https://www.deezer.com/track/123456789",
          youtubeMusic: "https://music.youtube.com/watch?v=123456789"
        }
      };
    }

    res.status(200).json({
      success: true,
      data: mockData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des liens:', error);
    return next(new ErrorResponse('Erreur lors de la récupération des liens de plateformes', 500));
  }
});
