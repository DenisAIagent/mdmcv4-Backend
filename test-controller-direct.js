// backend/test-controller-direct.js
// Test direct du controller sans HTTP

const { fetchPlatformLinks } = require('./controllers/smartLinkController');
const odesliService = require('./services/odesliService');

async function testControllerDirect() {
  console.log('🧪 Test Controller Direct\n');

  // Mock request et response
  const req = {
    body: {
      sourceUrl: 'https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr',
      userCountry: 'FR'
    }
  };

  const res = {
    status: (code) => {
      console.log(`📤 Response Status: ${code}`);
      return res;
    },
    json: (data) => {
      console.log('📋 Response Data:');
      if (data.success && data.data) {
        console.log(`✅ Succès`);
        console.log(`   Titre: ${data.data.title}`);
        console.log(`   Artiste: ${data.data.artistName}`);
        console.log(`   Type Input: ${data.data.inputType}`);
        console.log(`   Plateformes: ${Object.keys(data.data.links).length}`);
        
        // Afficher quelques plateformes
        const platforms = Object.keys(data.data.links).slice(0, 5);
        console.log(`   Exemples: ${platforms.join(', ')}`);
      } else {
        console.log('❌ Échec:', data.error || 'Pas de données');
      }
      return res;
    }
  };

  const next = (error) => {
    if (error) {
      console.log('❌ Erreur Controller:', error.message);
    }
  };

  try {
    console.log('🔍 Appel fetchPlatformLinks...');
    await fetchPlatformLinks(req, res, next);
  } catch (error) {
    console.error('💥 Erreur globale:', error.message);
  }
}

testControllerDirect();