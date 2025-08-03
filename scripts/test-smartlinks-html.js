// scripts/test-smartlinks-html.js
// Script de test pour l'API SmartLinks HTML

const mongoose = require('mongoose');
const SmartLinkHTML = require('../models/SmartLinkHTML');

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mdmc';

// 🧪 Données de test
const testSmartLinks = [
  {
    artist: 'Jacob Bryant',
    title: 'When I Get On A Roll',
    description: 'Nouveau single country de Jacob Bryant, disponible sur toutes les plateformes',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b2733f5c2c1b8e9c4d6f2a1e9b8c',
    spotifyUrl: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
    appleUrl: 'https://music.apple.com/us/album/when-i-get-on-a-roll/1234567890',
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    deezerUrl: 'https://www.deezer.com/track/123456789',
    primaryColor: '#FF6B35',
    template: 'default'
  },
  {
    artist: 'The Rolling Stones',
    title: 'Paint It Black',
    description: 'Classique rock des Rolling Stones, remasterisé',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273dc30583ba717007b00cceb25',
    spotifyUrl: 'https://open.spotify.com/track/63T7DJ1AFDD6Bn8VzG6JE8',
    appleUrl: 'https://music.apple.com/us/album/paint-it-black/123456789',
    youtubeUrl: 'https://www.youtube.com/watch?v=O4irXQhgMqg',
    soundcloudUrl: 'https://soundcloud.com/therollingstones/paint-it-black',
    primaryColor: '#1DB954',
    template: 'dark'
  },
  {
    artist: 'Daft Punk',
    title: 'Get Lucky',
    description: 'Hit électro de Daft Punk feat. Pharrell Williams',
    imageUrl: 'https://i.scdn.co/image/ab67616d0000b273de3c04b5a9e1c6e9a2b8f7e4',
    spotifyUrl: 'https://open.spotify.com/track/69kOkLUCkxIZYexIgSG8rq',
    appleUrl: 'https://music.apple.com/us/album/get-lucky/123456789',
    youtubeUrl: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I',
    deezerUrl: 'https://www.deezer.com/track/987654321',
    tidalUrl: 'https://tidal.com/browse/track/123456789',
    primaryColor: '#FFD700',
    template: 'gradient'
  }
];

/**
 * 🔌 Connexion à la base de données
 */
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    process.exit(1);
  }
}

/**
 * 🧹 Nettoyage des données de test
 */
async function cleanupTestData() {
  try {
    const result = await SmartLinkHTML.deleteMany({
      artist: { $in: testSmartLinks.map(t => t.artist) }
    });
    console.log(`🧹 ${result.deletedCount} SmartLinks de test supprimés`);
  } catch (error) {
    console.warn('⚠️ Erreur nettoyage:', error.message);
  }
}

/**
 * 🚀 Création des SmartLinks de test
 */
async function createTestSmartLinks() {
  console.log('\n📝 Création des SmartLinks de test...');
  
  for (const smartlinkData of testSmartLinks) {
    try {
      // Ajouter un créateur factice
      smartlinkData.createdBy = new mongoose.Types.ObjectId();
      
      const smartlink = new SmartLinkHTML(smartlinkData);
      await smartlink.save();
      
      console.log(`✅ Créé: ${smartlink.slug}`);
      console.log(`   URL: https://www.mdmcmusicads.com/#/smartlinks/${smartlink.slug}`);
      console.log(`   SEO: https://www.mdmcmusicads.com/smartlinks/${smartlink.slug}`);
      
    } catch (error) {
      console.error(`❌ Erreur création ${smartlinkData.artist} - ${smartlinkData.title}:`, error.message);
    }
  }
}

/**
 * 🔍 Test des requêtes API
 */
async function testAPI() {
  console.log('\n🧪 Test des requêtes API...');
  
  try {
    // Test: Liste tous les SmartLinks
    const allSmartLinks = await SmartLinkHTML.find({ isPublished: true })
      .select('slug artist title')
      .lean();
    
    console.log(`📋 Total SmartLinks: ${allSmartLinks.length}`);
    
    if (allSmartLinks.length > 0) {
      // Test: Récupération d'un SmartLink spécifique
      const testSlug = allSmartLinks[0].slug;
      const smartlink = await SmartLinkHTML.findOne({ slug: testSlug }).lean();
      
      if (smartlink) {
        console.log(`✅ Récupération réussie: ${smartlink.artist} - ${smartlink.title}`);
        console.log(`   Plateformes disponibles: ${smartlink.getAvailablePlatforms ? smartlink.getAvailablePlatforms().length : 'N/A'}`);
        
        // Test: Incrément des statistiques
        await SmartLinkHTML.findByIdAndUpdate(smartlink._id, {
          $inc: { 
            viewCount: 1,
            'platformClicks.spotify': 1
          }
        });
        console.log(`📊 Statistiques mises à jour`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test API:', error);
  }
}

/**
 * 📊 Affichage des statistiques
 */
async function showStats() {
  console.log('\n📊 Statistiques des SmartLinks...');
  
  try {
    const stats = await SmartLinkHTML.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: null,
          totalSmartLinks: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalClicks: { $sum: '$clickCount' },
          avgViews: { $avg: '$viewCount' }
        }
      }
    ]);
    
    if (stats.length > 0) {
      const s = stats[0];
      console.log(`   📈 Total SmartLinks: ${s.totalSmartLinks}`);
      console.log(`   👀 Total vues: ${s.totalViews}`);
      console.log(`   🖱️ Total clics: ${s.totalClicks}`);
      console.log(`   📊 Moyenne vues: ${Math.round(s.avgViews * 100) / 100}`);
    }
    
    // Top 3 SmartLinks les plus vus
    const topSmartLinks = await SmartLinkHTML.find({ isPublished: true })
      .select('slug artist title viewCount clickCount')
      .sort({ viewCount: -1 })
      .limit(3)
      .lean();
    
    if (topSmartLinks.length > 0) {
      console.log('\n🏆 Top SmartLinks:');
      topSmartLinks.forEach((sl, i) => {
        console.log(`   ${i + 1}. ${sl.artist} - ${sl.title} (${sl.viewCount} vues, ${sl.clickCount} clics)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur statistiques:', error);
  }
}

/**
 * 🧪 Script principal de test
 */
async function main() {
  console.log('🚀 Test SmartLinks HTML - Architecture simplifiée\n');
  
  try {
    await connectDB();
    
    // Nettoyage optionnel (décommenter si besoin)
    // await cleanupTestData();
    
    await createTestSmartLinks();
    await testAPI();
    await showStats();
    
    console.log('\n✅ Tests terminés avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnexion MongoDB');
  }
}

// Exécution si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  createTestSmartLinks,
  testAPI,
  showStats,
  cleanupTestData
};