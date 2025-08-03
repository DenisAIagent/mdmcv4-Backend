// Script d'activation de l'architecture HTML statique
// Migre tous les SmartLinks existants vers des fichiers HTML statiques

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const StaticHtmlGenerator = require('../services/staticHtmlGenerator');

async function activateStaticHtmlArchitecture() {
  console.log('🚀 ACTIVATION ARCHITECTURE HTML STATIQUE SMARTLINKS MDMC\n');
  
  try {
    // Connexion à MongoDB
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Instance du générateur HTML
    const htmlGenerator = new StaticHtmlGenerator();

    // Recherche de tous les SmartLinks existants
    console.log('\n2. Recherche des SmartLinks existants...');
    
    // Essayer avec le modèle SmartLinkHTML d'abord
    let SmartLinkModel;
    let smartlinks = [];
    
    try {
      SmartLinkModel = require('../models/SmartLinkHTML');
      smartlinks = await SmartLinkModel.find({ isPublished: true });
      console.log(`✅ Trouvé ${smartlinks.length} SmartLinks (modèle SmartLinkHTML)`);
    } catch (error) {
      console.log('⚠️  Modèle SmartLinkHTML non trouvé, tentative avec SmartLink...');
      
      try {
        SmartLinkModel = require('../models/SmartLink');
        smartlinks = await SmartLinkModel.find({ isPublished: true }).populate('artistId');
        console.log(`✅ Trouvé ${smartlinks.length} SmartLinks (modèle SmartLink)`);
      } catch (error2) {
        console.error('❌ Aucun modèle SmartLink trouvé:', error2.message);
        return;
      }
    }

    if (smartlinks.length === 0) {
      console.log('⚠️  Aucun SmartLink à migrer');
      return;
    }

    // Transformation des données selon le modèle
    console.log('\n3. Transformation des données...');
    const smartlinksData = smartlinks.map(smartlink => {
      // Vérifier le format du SmartLink
      if (smartlink.artist && smartlink.title) {
        // Format SmartLinkHTML
        return formatSmartLinkHTML(smartlink);
      } else if (smartlink.trackTitle && smartlink.artistId) {
        // Format SmartLink avec population
        return formatSmartLinkPopulated(smartlink);
      } else {
        console.warn(`⚠️  SmartLink avec format non reconnu:`, smartlink._id);
        return null;
      }
    }).filter(Boolean);

    console.log(`✅ ${smartlinksData.length} SmartLinks formatés pour génération`);

    // Génération de tous les fichiers HTML
    console.log('\n4. Génération des fichiers HTML statiques...');
    const results = await htmlGenerator.regenerateAllSmartLinks(smartlinksData);

    // Résultats
    console.log('\n📊 RÉSULTATS DE LA MIGRATION:');
    console.log(`   ✅ Succès: ${results.success.length}`);
    console.log(`   ❌ Erreurs: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Erreurs détaillées:');
      results.errors.forEach(error => {
        console.log(`   - ${error.smartlink}: ${error.error}`);
      });
    }

    // Statistiques finales
    console.log('\n5. Statistiques finales...');
    const stats = await htmlGenerator.getStats();
    console.log('📈 Architecture HTML statique:');
    console.log(`   - Fichiers HTML: ${stats.totalFiles}`);
    console.log(`   - Artistes: ${stats.totalArtists}`);
    console.log(`   - Taille totale: ${Math.round(stats.totalSize / 1024)} KB`);
    console.log(`   - Dernière génération: ${stats.lastGenerated}`);

    // URLs de test
    console.log('\n🔗 URLs de test générées:');
    results.success.slice(0, 3).forEach(filePath => {
      const pathParts = filePath.split('/');
      const fileName = pathParts[pathParts.length - 1].replace('.html', '');
      const artistSlug = pathParts[pathParts.length - 2];
      console.log(`   https://www.mdmcmusicads.com/smartlinks/${artistSlug}/${fileName}`);
    });

    console.log('\n🎯 ARCHITECTURE HTML STATIQUE ACTIVÉE AVEC SUCCÈS !');
    console.log('\n📋 Prochaines étapes:');
    console.log('   1. Redémarrer le serveur Express');
    console.log('   2. Tester les URLs SmartLinks sans hash (#)');
    console.log('   3. Valider avec Facebook Debugger');
    console.log('   4. Configurer redirections hash → URLs directes');

  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Formatage SmartLinkHTML (nouveau modèle)
function formatSmartLinkHTML(smartlink) {
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
    }
  };
}

// Formatage SmartLink avec artistId populé (ancien modèle)
function formatSmartLinkPopulated(smartlink) {
  return {
    trackTitle: smartlink.trackTitle,
    slug: smartlink.slug,
    description: smartlink.description || `Écoutez "${smartlink.trackTitle}" de ${smartlink.artistId.name} sur toutes les plateformes de streaming`,
    subtitle: smartlink.subtitle || '',
    coverImageUrl: smartlink.coverImageUrl,
    platformLinks: smartlink.platformLinks || [],
    artist: {
      name: smartlink.artistId.name,
      slug: smartlink.artistId.slug
    }
  };
}

// Lancement du script
if (require.main === module) {
  activateStaticHtmlArchitecture().catch(console.error);
}

module.exports = { activateStaticHtmlArchitecture };