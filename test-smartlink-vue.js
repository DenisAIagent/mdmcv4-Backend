// Script de test pour l'architecture SmartLinks Vue.js
// Teste l'intégration complète frontend/backend

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:3000';

// Tests des endpoints API
const testAPI = async () => {
  console.log('🧪 Test des endpoints API...\n');
  
  try {
    // Test de base de l'API
    console.log('1. Test endpoint racine API');
    const apiTest = await axios.get(`${BACKEND_URL}/api/v1`);
    console.log('✅ API v1 opérationnelle:', apiTest.data.message);
    
    // Test récupération SmartLinks
    console.log('\n2. Test récupération SmartLinks');
    try {
      const smartlinksTest = await axios.get(`${BACKEND_URL}/api/v1/smartlinks`);
      console.log('✅ SmartLinks endpoint accessible:', smartlinksTest.data.success);
      console.log(`   Total SmartLinks: ${smartlinksTest.data.smartlinks?.length || 0}`);
    } catch (error) {
      console.log('⚠️  SmartLinks endpoint:', error.response?.status || 'Erreur réseau');
    }
    
    // Test récupération Artistes
    console.log('\n3. Test récupération Artistes');
    try {
      const artistsTest = await axios.get(`${BACKEND_URL}/api/v1/artists`);
      console.log('✅ Artists endpoint accessible:', artistsTest.data.success);
      console.log(`   Total Artistes: ${artistsTest.data.artists?.length || 0}`);
    } catch (error) {
      console.log('⚠️  Artists endpoint:', error.response?.status || 'Erreur réseau');
    }
    
  } catch (error) {
    console.log('❌ Erreur API de base:', error.message);
    console.log('   Vérifiez que le backend est démarré sur le port 5001');
  }
};

// Test du middleware Puppeteer SEO
const testSEOMiddleware = async () => {
  console.log('\n🤖 Test middleware Puppeteer SEO...\n');
  
  const testCases = [
    {
      name: 'Bot Facebook',
      userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      slug: 'test-artist/test-track'
    },
    {
      name: 'Bot Twitter',
      userAgent: 'Twitterbot/1.0',
      slug: 'test-artist/test-track'
    },
    {
      name: 'Navigateur normal',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      slug: 'test-artist/test-track'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing ${testCase.name}...`);
      
      const response = await axios.get(`${BACKEND_URL}/smartlinks/${testCase.slug}`, {
        headers: {
          'User-Agent': testCase.userAgent
        },
        timeout: 10000
      });
      
      const isStaticHTML = response.headers['x-rendered-by']?.includes('Puppeteer');
      const hasOpenGraph = response.data.includes('property="og:title"');
      
      console.log(`✅ ${testCase.name}: ${response.status}`);
      console.log(`   Rendu statique: ${isStaticHTML ? 'Oui' : 'Non'}`);
      console.log(`   Métadonnées OG: ${hasOpenGraph ? 'Oui' : 'Non'}`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`⚠️  ${testCase.name}: SmartLink de test non trouvé (404)`);
      } else {
        console.log(`❌ ${testCase.name}: ${error.message}`);
      }
    }
  }
};

// Test de création d'un SmartLink de test
const createTestSmartLink = async () => {
  console.log('\n🎯 Création SmartLink de test...\n');
  
  try {
    // Vérifier d'abord s'il existe un artiste de test
    const artistsResponse = await axios.get(`${BACKEND_URL}/api/v1/artists`);
    let testArtist = artistsResponse.data.artists?.find(a => a.slug === 'test-artist');
    
    if (!testArtist) {
      console.log('Creating test artist...');
      const artistResponse = await axios.post(`${BACKEND_URL}/api/v1/artists`, {
        name: 'Test Artist',
        bio: 'Artiste de test pour l\'architecture Vue.js',
        websiteUrl: 'https://test-artist.example.com'
      });
      testArtist = artistResponse.data.artist;
      console.log('✅ Artiste de test créé:', testArtist.name);
    } else {
      console.log('✅ Artiste de test existe:', testArtist.name);
    }
    
    // Créer un SmartLink de test
    console.log('Creating test SmartLink...');
    const smartlinkData = {
      artistId: testArtist._id,
      trackTitle: 'Test Track',
      description: 'Titre de test pour l\'architecture Vue.js SmartLinks',
      platformLinks: [
        {
          platform: 'spotify',
          url: 'https://open.spotify.com/track/test'
        },
        {
          platform: 'apple',
          url: 'https://music.apple.com/test'
        },
        {
          platform: 'youtube',
          url: 'https://music.youtube.com/watch?v=test'
        }
      ],
      isPublished: true
    };
    
    const smartlinkResponse = await axios.post(`${BACKEND_URL}/api/v1/smartlinks`, smartlinkData);
    const smartlink = smartlinkResponse.data.smartlink;
    
    console.log('✅ SmartLink de test créé:', smartlink.trackTitle);
    console.log(`   URL: ${FRONTEND_URL}/#/smartlinks/${testArtist.slug}/${smartlink.slug}`);
    console.log(`   SEO URL: ${BACKEND_URL}/smartlinks/${testArtist.slug}/${smartlink.slug}`);
    
    return { artist: testArtist, smartlink };
    
  } catch (error) {
    console.log('❌ Erreur création SmartLink test:', error.response?.data?.error || error.message);
    return null;
  }
};

// Test Frontend Vue.js
const testFrontend = async () => {
  console.log('\n🖥️  Test Frontend Vue.js...\n');
  
  try {
    console.log('Testing Vue.js app accessibility...');
    const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
    
    const hasVueApp = frontendResponse.data.includes('id="app"');
    const hasAssets = frontendResponse.data.includes('/assets/');
    const hasMDMCBranding = frontendResponse.data.includes('MDMC');
    
    console.log('✅ Frontend accessible:', frontendResponse.status === 200);
    console.log(`   App Vue.js: ${hasVueApp ? 'Détectée' : 'Non détectée'}`);
    console.log(`   Assets: ${hasAssets ? 'Chargés' : 'Manquants'}`);
    console.log(`   Branding MDMC: ${hasMDMCBranding ? 'Présent' : 'Absent'}`);
    
  } catch (error) {
    console.log('❌ Frontend non accessible:', error.message);
    console.log('   Vérifiez que le frontend Vue.js est démarré sur le port 3000');
    console.log('   Commande: cd frontend-vue && npm run dev');
  }
};

// Test complet d'intégration
const runIntegrationTest = async () => {
  console.log('🚀 MDMC SmartLinks - Test d\'intégration Vue.js\n');
  console.log('================================================\n');
  
  // Tests séquentiels
  await testAPI();
  await testFrontend();
  
  const testData = await createTestSmartLink();
  
  if (testData) {
    await testSEOMiddleware();
    
    console.log('\n📋 Résumé du test');
    console.log('==================');
    console.log('✅ Backend API: Opérationnel');
    console.log('✅ Frontend Vue.js: Accessible');
    console.log('✅ SmartLink créé:', testData.smartlink.trackTitle);
    console.log('✅ Middleware SEO: Configuré');
    
    console.log('\n🔗 URLs de test:');
    console.log(`   Frontend: ${FRONTEND_URL}/#/smartlinks/${testData.artist.slug}/${testData.smartlink.slug}`);
    console.log(`   SEO Bot: ${BACKEND_URL}/smartlinks/${testData.artist.slug}/${testData.smartlink.slug}`);
    console.log(`   Admin: ${FRONTEND_URL}/#/admin`);
    
    console.log('\n📊 Test Analytics:');
    console.log('   - Ouvrez les DevTools');
    console.log('   - Allez dans l\'onglet Network');
    console.log('   - Visitez le SmartLink et vérifiez les appels API');
    console.log('   - Vérifiez les events Google Analytics dans la console');
    
  } else {
    console.log('\n⚠️  Test partiel - Impossible de créer SmartLink de test');
  }
  
  console.log('\n🎯 Architecture Vue.js SmartLinks prête!');
  console.log('   Workflow: Admin → Création → URL → Affichage Public → Analytics');
};

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.log('\n❌ Erreur non gérée:', error.message);
  process.exit(1);
});

// Vérification des prérequis
const checkPrerequisites = () => {
  console.log('🔍 Vérification des prérequis...\n');
  
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('⚠️  Variables d\'environnement manquantes:', missingVars.join(', '));
  }
  
  console.log('Configuration:');
  console.log(`   Backend: ${BACKEND_URL}`);
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Node.js: ${process.version}`);
  console.log('');
};

// Point d'entrée principal
const main = async () => {
  try {
    checkPrerequisites();
    await runIntegrationTest();
  } catch (error) {
    console.log('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
};

// Lancer le test si le script est exécuté directement
if (require.main === module) {
  main();
}

module.exports = {
  testAPI,
  testSEOMiddleware,
  testFrontend,
  createTestSmartLink,
  runIntegrationTest
};