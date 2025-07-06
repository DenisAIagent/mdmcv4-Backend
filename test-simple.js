// backend/test-simple.js
// Test simple avec une seule URL

const odesliService = require('./services/odesliService');

async function testSingle() {
  console.log('🧪 Test simple Odesli\n');

  // URL de test récente et populaire
  const testUrl = 'https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr'; // "Cruel Summer" - Taylor Swift
  
  try {
    console.log(`🔍 Test: ${testUrl}`);
    const result = await odesliService.fetchPlatformLinks(testUrl, 'FR');
    
    if (result.success) {
      console.log('\n✅ SUCCÈS !');
      console.log('📋 Métadonnées:');
      console.log(`   Titre: ${result.data.title}`);
      console.log(`   Artiste: ${result.data.artist}`);
      console.log(`   Album: ${result.data.album}`);
      console.log(`   ISRC: ${result.data.isrc}`);
      console.log(`   Artwork: ${result.data.artwork ? '✅' : '❌'}`);
      
      console.log('\n🔗 Plateformes détectées:');
      Object.entries(result.data.linksByPlatform).forEach(([platform, linkData]) => {
        const url = typeof linkData === 'string' ? linkData : linkData.url;
        console.log(`   ${platform}: ${url.substring(0, 50)}...`);
      });
      
      console.log(`\n📊 Total: ${Object.keys(result.data.linksByPlatform).length} plateformes`);
      
    } else {
      console.log('❌ Échec:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erreur:', error.message);
  }
}

testSingle();