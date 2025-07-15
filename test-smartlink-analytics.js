// test-smartlink-analytics.js
// Test du système d'analytics statiques pour SmartLinks

const SmartLinkGenerator = require('./routes/smartlinks/smartlinkGenerator');

// Test données
const testSmartLinkData = {
  _id: '60f7b3b3b3b3b3b3b3b3b3b3',
  trackTitle: 'Test Track',
  slug: 'test-track',
  description: 'Une chanson de test incroyable',
  customSubtitle: 'Choisissez votre plateforme préférée',
  useDescriptionAsSubtitle: false,
  coverImageUrl: 'https://via.placeholder.com/400x400/ff6b6b/ffffff?text=TEST',
  platformLinks: [
    {
      platform: 'Spotify',
      url: 'https://open.spotify.com/track/test'
    },
    {
      platform: 'Apple Music',
      url: 'https://music.apple.com/test'
    },
    {
      platform: 'YouTube',
      url: 'https://www.youtube.com/watch?v=test'
    }
  ],
  trackingIds: {
    ga4Id: 'G-TEST123456',
    gtmId: 'GTM-TEST123',
    metaPixelId: '123456789012345',
    tiktokPixelId: 'CTEST123456789012345'
  },
  releaseDate: new Date('2025-01-01')
};

const testArtistData = {
  _id: '60f7b3b3b3b3b3b3b3b3b3b4',
  name: 'Test Artist',
  slug: 'test-artist'
};

const testOptions = {
  baseUrl: 'http://localhost:5001',
  userAgent: 'Mozilla/5.0 (Test Browser)',
  ip: '127.0.0.1'
};

async function testSmartLinkGeneration() {
  console.log('🧪 Test génération SmartLink avec analytics statiques\n');
  
  try {
    // Créer une instance du générateur
    const generator = new SmartLinkGenerator();
    
    // Générer le SmartLink
    console.log('📝 Génération du SmartLink...');
    const result = await generator.generateSmartLink(
      testSmartLinkData,
      testArtistData,
      testOptions
    );
    
    if (result.success) {
      console.log('✅ SmartLink généré avec succès!');
      console.log('📊 Métadonnées:');
      console.log(`   - Titre: ${result.meta.title}`);
      console.log(`   - Description: ${result.meta.description}`);
      console.log(`   - Image: ${result.meta.image}`);
      console.log(`   - URL: ${result.meta.url}`);
      
      // Vérifier la présence des scripts analytics
      console.log('\n🎯 Vérification des analytics:');
      const html = result.html;
      
      const checks = [
        { name: 'Google Analytics 4', test: /gtag.*G-TEST123456/s },
        { name: 'Google Tag Manager', test: /GTM-TEST123/s },
        { name: 'Meta Pixel', test: /fbq.*123456789012345/s },
        { name: 'TikTok Pixel', test: /ttq.*CTEST123456789012345/s },
        { name: 'Tracking Script', test: /trackPlatformClick/s },
        { name: 'Platform Data', test: /window\.SMARTLINK_DATA/s }
      ];
      
      checks.forEach(check => {
        const found = check.test.test(html);
        console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'PRÉSENT' : 'ABSENT'}`);
      });
      
      // Vérifier la structure HTML
      console.log('\n📋 Structure HTML:');
      const htmlChecks = [
        { name: 'DOCTYPE html', test: /<!DOCTYPE html>/i },
        { name: 'Meta charset', test: /<meta charset="UTF-8">/i },
        { name: 'Meta viewport', test: /<meta name="viewport"/i },
        { name: 'Open Graph title', test: /<meta property="og:title"/i },
        { name: 'Twitter Card', test: /<meta name="twitter:card"/i },
        { name: 'CSS inline', test: /<style>.*body.*font-family/s },
        { name: 'Container HTML', test: /<div class="smartlink-container">/i }
      ];
      
      htmlChecks.forEach(check => {
        const found = check.test.test(html);
        console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'OK' : 'MANQUANT'}`);
      });
      
      // Sauvegarder le HTML pour inspection
      const fs = require('fs');
      const path = require('path');
      const testHtmlPath = path.join(__dirname, 'test-smartlink-output.html');
      fs.writeFileSync(testHtmlPath, html);
      console.log(`\n💾 HTML sauvegardé: ${testHtmlPath}`);
      
      // Afficher les premières lignes du HTML
      console.log('\n📄 Aperçu HTML (200 premiers caractères):');
      console.log(html.substring(0, 200) + '...');
      
    } else {
      console.log('❌ Échec de la génération:', result.error);
      console.log('🔄 HTML de fallback disponible:', !!result.fallbackHtml);
    }
    
  } catch (error) {
    console.error('❌ Erreur de test:', error);
  }
}

// Test des fonctions utilitaires
function testUtilityFunctions() {
  console.log('\n🧪 Test des fonctions utilitaires\n');
  
  const generator = new SmartLinkGenerator();
  
  // Test escapeHtml
  console.log('🔐 Test escapeHtml:');
  const testHtml = '<script>alert("test")</script>';
  const escapedHtml = generator.escapeHtml(testHtml);
  console.log(`   Input: ${testHtml}`);
  console.log(`   Output: ${escapedHtml}`);
  console.log(`   ✅ Échappé: ${escapedHtml.includes('&lt;script&gt;')}`);
  
  // Test escapeJs
  console.log('\n🔐 Test escapeJs:');
  const testJs = `"Hello 'world'\nNew line`;
  const escapedJs = generator.escapeJs(testJs);
  console.log(`   Input: ${testJs}`);
  console.log(`   Output: ${escapedJs}`);
  console.log(`   ✅ Échappé: ${escapedJs.includes('\\"') && escapedJs.includes('\\n')}`);
  
  // Test generateFallbackHtml
  console.log('\n🔄 Test generateFallbackHtml:');
  const fallbackHtml = generator.generateFallbackHtml();
  console.log(`   ✅ Fallback généré: ${fallbackHtml.length > 0}`);
  console.log(`   ✅ Contient DOCTYPE: ${fallbackHtml.includes('<!DOCTYPE html>')}`);
  console.log(`   ✅ Contient message: ${fallbackHtml.includes('SmartLink Indisponible')}`);
}

// Fonction principale
async function runTests() {
  console.log('🎯 === TEST SMARTLINK ANALYTICS STATIQUES ===\n');
  
  await testSmartLinkGeneration();
  testUtilityFunctions();
  
  console.log('\n🎉 Tests terminés!');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Vérifier le fichier test-smartlink-output.html');
  console.log('   2. Tester avec Google Tag Assistant');
  console.log('   3. Tester avec Meta Pixel Helper');
  console.log('   4. Déployer et tester en production');
}

// Exécuter les tests
runTests().catch(console.error);