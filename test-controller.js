// backend/test-controller.js
// Test du controller SmartLink avec vraie requête HTTP

const axios = require('axios');

async function testController() {
  console.log('🧪 Test Controller SmartLink\n');

  // Données de test
  const testData = {
    sourceUrl: 'https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr',
    userCountry: 'FR'
  };

  console.log('📤 Test POST /api/smartlinks/fetch-platform-links');
  console.log('Data:', testData);

  try {
    // Note: Remplacer par l'URL de votre serveur local si différent
    const response = await axios.post('http://localhost:5001/api/smartlinks/fetch-platform-links', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-bypass-token'
      },
      timeout: 30000
    });

    console.log('\n✅ Réponse Controller:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    
    if (response.data.success && response.data.data) {
      const data = response.data.data;
      console.log('\n📋 Métadonnées:');
      console.log(`   Titre: ${data.title}`);
      console.log(`   Artiste: ${data.artistName}`);
      console.log(`   Type: ${data.type}`);
      console.log(`   Input Type: ${data.inputType}`);
      console.log(`   Pays: ${data.userCountry}`);
      
      console.log('\n🔗 Liens plateformes:');
      const links = data.links || {};
      Object.entries(links).forEach(([platform, linkData]) => {
        const url = typeof linkData === 'string' ? linkData : linkData.url;
        console.log(`   ${platform}: ${url.substring(0, 60)}...`);
      });
      
      console.log(`\n📊 Total: ${Object.keys(links).length} plateformes détectées`);
      
      if (data.alternativeArtworks && data.alternativeArtworks.length > 0) {
        console.log(`\n🎨 Artworks alternatifs: ${data.alternativeArtworks.length}`);
      }
      
    } else {
      console.log('❌ Pas de données dans la réponse');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Serveur non démarré. Lancez le backend avec: npm run dev');
    } else if (error.response) {
      console.log('❌ Erreur HTTP:', error.response.status);
      console.log('Message:', error.response.data);
    } else {
      console.log('❌ Erreur:', error.message);
    }
  }
}

testController();