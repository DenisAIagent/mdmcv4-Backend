// test-seo-middleware.js
// Script pour tester le middleware SEO des smartlinks

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5001'; // Ou votre URL de production
const BACKEND_URL = 'https://mdmcv4-backend-production-b615.up.railway.app';

// Test smartlink example
const TEST_SMARTLINK = {
  artistSlug: 'rise-against',
  trackSlug: 'savior'
};

// Différents User-Agents pour tester
const USER_AGENTS = {
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  twitter: 'Twitterbot/1.0',
  whatsapp: 'WhatsApp/2.21.4.18 A',
  normal: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  linkedin: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +https://www.linkedin.com/)',
  discord: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)'
};

async function testSEOMiddleware() {
  console.log('🧪 Test du middleware SEO pour smartlinks\n');
  
  for (const [platform, userAgent] of Object.entries(USER_AGENTS)) {
    console.log(`\n🤖 Test ${platform.toUpperCase()}: ${userAgent.substring(0, 50)}...`);
    
    try {
      const response = await axios.get(
        `${BACKEND_URL}/smartlinks/${TEST_SMARTLINK.artistSlug}/${TEST_SMARTLINK.trackSlug}`,
        {
          headers: {
            'User-Agent': userAgent
          },
          timeout: 10000
        }
      );
      
      if (response.status === 200) {
        console.log(`✅ Status: ${response.status}`);
        console.log(`📄 Content-Type: ${response.headers['content-type']}`);
        
        // Vérifier si c'est du HTML avec métadonnées
        if (response.data.includes('<meta property="og:title"')) {
          const titleMatch = response.data.match(/<meta property="og:title" content="([^"]+)"/);
          const imageMatch = response.data.match(/<meta property="og:image" content="([^"]+)"/);
          
          console.log(`🎵 Title: ${titleMatch ? titleMatch[1] : 'Non trouvé'}`);
          console.log(`🖼️ Image: ${imageMatch ? imageMatch[1] : 'Non trouvé'}`);
          console.log('✅ Métadonnées Open Graph détectées');
        } else {
          console.log('❌ Pas de métadonnées Open Graph trouvées');
        }
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ Status: ${error.response.status}`);
        console.log(`❌ Error: ${error.response.statusText}`);
      } else {
        console.log(`❌ Network Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n🔍 Test avec paramètre de debug...');
  try {
    const response = await axios.get(
      `${BACKEND_URL}/smartlinks/${TEST_SMARTLINK.artistSlug}/${TEST_SMARTLINK.trackSlug}?seo=true`,
      {
        headers: {
          'User-Agent': USER_AGENTS.normal
        }
      }
    );
    
    if (response.data.includes('<meta property="og:title"')) {
      console.log('✅ Debug mode fonctionne - métadonnées générées');
    } else {
      console.log('❌ Debug mode ne fonctionne pas');
    }
  } catch (error) {
    console.log(`❌ Debug test failed: ${error.message}`);
  }
}

// Test de validation de smartlink en base
async function testSmartlinkExists() {
  console.log('\n📊 Vérification de l\'existence du smartlink en base...');
  
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/v1/smartlinks/public/${TEST_SMARTLINK.artistSlug}/${TEST_SMARTLINK.trackSlug}`
    );
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Smartlink trouvé en base');
      console.log(`🎵 Titre: ${response.data.data.smartLink.trackTitle}`);
      console.log(`🎤 Artiste: ${response.data.data.artist.name}`);
      console.log(`🖼️ Cover: ${response.data.data.smartLink.coverImageUrl || 'Aucune'}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Smartlink non trouvé en base');
    console.log(`Error: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Test de connectivité backend
async function testBackendConnection() {
  console.log('🔗 Test de connectivité backend...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/v1`);
    if (response.status === 200) {
      console.log('✅ Backend accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Backend non accessible');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function runTests() {
  console.log('🚀 Début des tests SEO pour smartlinks\n');
  
  // Test connectivité
  const backendOk = await testBackendConnection();
  if (!backendOk) {
    console.log('❌ Impossible de continuer - backend non accessible');
    return;
  }
  
  // Test existence smartlink
  const smartlinkExists = await testSmartlinkExists();
  if (!smartlinkExists) {
    console.log('⚠️ Smartlink de test non trouvé - les tests SEO pourraient échouer');
  }
  
  // Test SEO middleware
  await testSEOMiddleware();
  
  console.log('\n📋 Résumé des tests terminé');
  console.log('Pour tester manuellement, utilisez:');
  console.log(`curl -H "User-Agent: facebookexternalhit/1.1" "${BACKEND_URL}/smartlinks/${TEST_SMARTLINK.artistSlug}/${TEST_SMARTLINK.trackSlug}"`);
}

// Exécuter les tests si ce script est lancé directement
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSEOMiddleware, testSmartlinkExists, testBackendConnection };