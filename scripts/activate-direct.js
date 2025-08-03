// Script d'activation directe - génère un SmartLink HTML sans passer par MongoDB
// Pour tester l'architecture HTML statique immédiatement

const StaticHtmlGenerator = require('../services/staticHtmlGenerator');

async function activateDirectly() {
  console.log('🚀 ACTIVATION DIRECTE ARCHITECTURE HTML STATIQUE\n');
  
  try {
    const htmlGenerator = new StaticHtmlGenerator();
    
    // Données du SmartLink Slipknot basées sur l'URL existante
    const slipknotData = {
      trackTitle: 'Wait and Bleed',
      slug: 'wait-and-bleed-454666',
      description: 'Écoutez "Wait and Bleed" de Slipknot, un classique du metal alternatif qui a marqué les années 2000. Disponible sur toutes les plateformes de streaming.',
      subtitle: 'Du nouvel album Iowa',
      coverImageUrl: 'https://i.scdn.co/image/ab67616d0000b273d76b279a3709e50b6e8ac3d3',
      platformLinks: [
        {
          platform: 'spotify',
          url: 'https://open.spotify.com/track/2DlHlPMa4M17kufBvbOT4r'
        },
        {
          platform: 'apple', 
          url: 'https://music.apple.com/us/album/wait-and-bleed/1440890531?i=1440890910'
        },
        {
          platform: 'youtube',
          url: 'https://www.youtube.com/watch?v=B1zCN0YhW1s'
        },
        {
          platform: 'deezer',
          url: 'https://www.deezer.com/track/125506'
        },
        {
          platform: 'amazon',
          url: 'https://music.amazon.com/albums/B002FVNXGA'
        },
        {
          platform: 'tidal',
          url: 'https://tidal.com/browse/track/624466'
        }
      ],
      artist: {
        name: 'Slipknot',
        slug: 'slipknot'
      }
    };

    console.log('1. Génération SmartLink Slipknot...');
    const filePath = await htmlGenerator.generateSmartLinkHtml(slipknotData);
    console.log(`✅ Fichier HTML généré: ${filePath}`);

    // Création d'autres SmartLinks de test
    const testSmartLinks = [
      {
        trackTitle: 'Master of Puppets',
        slug: 'master-of-puppets',
        description: 'Le chef-d\'œuvre de Metallica qui a défini le thrash metal pour des générations.',
        coverImageUrl: 'https://i.scdn.co/image/ab67616d0000b27383c0cb757f7018e2d087b7c4',
        platformLinks: [
          { platform: 'spotify', url: 'https://open.spotify.com/track/1TiXlqx9XCXl2gCa8LGmh5' },
          { platform: 'apple', url: 'https://music.apple.com/album/master-of-puppets/1454269663?i=1454269779' },
          { platform: 'youtube', url: 'https://www.youtube.com/watch?v=xnKhsTXoKCI' }
        ],
        artist: { name: 'Metallica', slug: 'metallica' }
      },
      {
        trackTitle: 'One More Time',
        slug: 'one-more-time',
        description: 'Le hit emblématique de Daft Punk qui a révolutionné la musique électronique.',
        coverImageUrl: 'https://i.scdn.co/image/ab67616d0000b273da3f76d63f8ad7e8f19a8f6e',
        platformLinks: [
          { platform: 'spotify', url: 'https://open.spotify.com/track/0DiWol3AO6WpXZgp0goxAV' },
          { platform: 'apple', url: 'https://music.apple.com/album/one-more-time/697194953?i=697195394' },
          { platform: 'deezer', url: 'https://www.deezer.com/track/3135556' }
        ],
        artist: { name: 'Daft Punk', slug: 'daft-punk' }
      }
    ];

    console.log('\n2. Génération SmartLinks de test supplémentaires...');
    for (const smartlink of testSmartLinks) {
      try {
        const testFilePath = await htmlGenerator.generateSmartLinkHtml(smartlink);
        console.log(`✅ ${smartlink.artist.name} - ${smartlink.trackTitle}: ${testFilePath}`);
      } catch (error) {
        console.log(`❌ Erreur ${smartlink.trackTitle}: ${error.message}`);
      }
    }

    // Statistiques finales
    console.log('\n3. Statistiques de l\'architecture...');
    const stats = await htmlGenerator.getStats();
    console.log('📊 Architecture HTML statique activée:');
    console.log(`   - Fichiers HTML générés: ${stats.totalFiles}`);
    console.log(`   - Artistes: ${stats.totalArtists}`);
    console.log(`   - Taille totale: ${Math.round(stats.totalSize / 1024)} KB`);
    console.log(`   - Dernière génération: ${stats.lastGenerated}`);

    // URLs de test
    console.log('\n🔗 URLS DE TEST ACTIVÉES:');
    console.log('\n   SLIPKNOT - Wait and Bleed:');
    console.log(`   ❌ Ancienne: https://www.mdmcmusicads.com/#/smartlinks/slipknot/wait-and-bleed-454666`);
    console.log(`   ✅ Nouvelle: https://www.mdmcmusicads.com/smartlinks/slipknot/wait-and-bleed-454666`);
    
    console.log('\n   AUTRES TESTS:');
    console.log(`   ✅ Metallica: https://www.mdmcmusicads.com/smartlinks/metallica/master-of-puppets`);
    console.log(`   ✅ Daft Punk: https://www.mdmcmusicads.com/smartlinks/daft-punk/one-more-time`);

    console.log('\n🎯 ARCHITECTURE HTML STATIQUE ACTIVÉE !');
    console.log('\n📋 Tests à effectuer:');
    console.log('   1. Redémarrer le serveur Express');
    console.log('   2. Visiter les URLs générées ci-dessus');
    console.log('   3. Tester avec Facebook Debugger:');
    console.log('      https://developers.facebook.com/tools/debug/');
    console.log('   4. Comparer les métadonnées vs anciennes URLs hash');
    
    console.log('\n🚀 Serveur Express configuration:');
    console.log('   Routes statiques activées: /smartlinks/:artistSlug/:trackSlug');
    console.log('   Priority: AVANT toutes les autres routes');
    console.log('   SEO: Métadonnées Open Graph natives dans HTML');

    return {
      stats,
      urls: {
        slipknot: 'https://www.mdmcmusicads.com/smartlinks/slipknot/wait-and-bleed-454666',
        metallica: 'https://www.mdmcmusicads.com/smartlinks/metallica/master-of-puppets',
        daftpunk: 'https://www.mdmcmusicads.com/smartlinks/daft-punk/one-more-time'
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
    throw error;
  }
}

// Lancement du script
if (require.main === module) {
  activateDirectly().catch(console.error);
}

module.exports = { activateDirectly };