// backend/test-odesli.js
// Script de test pour valider l'intégration API Odesli

const odesliService = require('./services/odesliService');

// URLs de test variées
const TEST_URLS = [
  {
    name: 'Spotify - Bohemian Rhapsody',
    url: 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    expected: 'Queen'
  },
  {
    name: 'Apple Music - The Weeknd',
    url: 'https://music.apple.com/us/album/blinding-lights/1499378108?i=1499378112',
    expected: 'The Weeknd'
  },
  {
    name: 'YouTube Music - Daft Punk',
    url: 'https://music.youtube.com/watch?v=5NV6Rdv1a3I',
    expected: 'Daft Punk'
  },
  {
    name: 'ISRC - Sample',
    url: 'USRC17607839',
    expected: 'ISRC'
  }
];

async function runTests() {
  console.log('🧪 === TEST INTÉGRATION ODESLI API ===\n');

  // Test de santé de l'API
  console.log('1️⃣ Test de santé API...');
  try {
    const healthCheck = await odesliService.healthCheck();
    console.log(`   Status: ${healthCheck.status}`);
    console.log(`   Message: ${healthCheck.message}\n`);
  } catch (error) {
    console.error(`   ❌ Santé API: ${error.message}\n`);
  }

  // Tests avec URLs réelles
  for (const test of TEST_URLS) {
    console.log(`🔍 Test: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const startTime = Date.now();
      const result = await odesliService.fetchPlatformLinks(test.url, 'FR');
      const duration = Date.now() - startTime;
      
      if (result.success) {
        console.log(`   ✅ Succès (${duration}ms)`);
        console.log(`   Titre: ${result.data.title}`);
        console.log(`   Artiste: ${result.data.artist}`);
        console.log(`   Plateformes: ${Object.keys(result.data.linksByPlatform).length}`);
        console.log(`   ISRC: ${result.data.isrc || 'N/A'}`);
        console.log(`   Artwork: ${result.data.artwork ? '✅' : '❌'}`);
        
        // Détail des plateformes
        const platforms = Object.keys(result.data.linksByPlatform);
        console.log(`   🔗 Plateformes détectées: ${platforms.join(', ')}`);
        
        // Test validation des URLs
        let validUrls = 0;
        for (const [platform, linkData] of Object.entries(result.data.linksByPlatform)) {
          const url = typeof linkData === 'string' ? linkData : linkData.url;
          if (url && url.startsWith('http')) {
            validUrls++;
          }
        }
        console.log(`   🔗 URLs valides: ${validUrls}/${platforms.length}`);
        
      } else {
        console.log(`   ❌ Échec: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
    
    console.log(''); // Ligne vide pour séparation
  }

  // Test formats d'entrée
  console.log('2️⃣ Test validation formats...');
  const testInputs = [
    'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    'USRC17607839',
    '050087246235',
    'invalid-input',
    ''
  ];

  for (const input of testInputs) {
    try {
      const validation = odesliService.validateInput(input);
      console.log(`   "${input}" -> ${validation.type} ✅`);
    } catch (error) {
      console.log(`   "${input}" -> ❌ ${error.message}`);
    }
  }

  console.log('\n3️⃣ Test cache...');
  
  // Test même URL deux fois pour vérifier le cache
  const testUrl = 'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh';
  
  console.log('   Premier appel (API):');
  const start1 = Date.now();
  await odesliService.fetchPlatformLinks(testUrl, 'FR');
  const duration1 = Date.now() - start1;
  console.log(`   Durée: ${duration1}ms`);
  
  console.log('   Deuxième appel (cache):');
  const start2 = Date.now();
  await odesliService.fetchPlatformLinks(testUrl, 'FR');
  const duration2 = Date.now() - start2;
  console.log(`   Durée: ${duration2}ms`);
  
  if (duration2 < duration1 / 2) {
    console.log('   ✅ Cache fonctionne (gain de performance détecté)');
  } else {
    console.log('   ⚠️ Cache non détecté ou peu efficace');
  }

  console.log('\n🎉 Tests terminés !');
}

// Test avec gestion d'erreurs globale
runTests().catch(error => {
  console.error('💥 Erreur globale dans les tests:', error);
  process.exit(1);
});