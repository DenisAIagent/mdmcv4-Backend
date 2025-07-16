// debug-smartlink-tracking.js
// Script pour déboguer le problème de tracking des SmartLinks

const mongoose = require('mongoose');
require('dotenv').config();

// Models
const SmartLink = require('./models/SmartLink');
const Artist = require('./models/Artist');

async function debugSmartLinkTracking() {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Vérifier les SmartLinks existants
    console.log('\n🔍 === VÉRIFICATION DES SMARTLINKS ===');
    const smartLinks = await SmartLink.find({}).populate('artistId').limit(5);
    
    console.log(`📊 Nombre de SmartLinks trouvés: ${smartLinks.length}`);
    
    smartLinks.forEach((smartLink, index) => {
      console.log(`\n📋 SmartLink ${index + 1}:`);
      console.log(`   - ID: ${smartLink._id}`);
      console.log(`   - Titre: ${smartLink.trackTitle}`);
      console.log(`   - Slug: ${smartLink.slug}`);
      console.log(`   - Artiste: ${smartLink.artistId?.name || 'N/A'}`);
      console.log(`   - Artiste Slug: ${smartLink.artistId?.slug || 'N/A'}`);
      console.log(`   - Publié: ${smartLink.isPublished}`);
      console.log(`   - TrackingIds: ${JSON.stringify(smartLink.trackingIds || {}, null, 2)}`);
      
      // Vérifier si le SmartLink a des analytics
      const hasAnalytics = smartLink.trackingIds && (
        smartLink.trackingIds.ga4Id ||
        smartLink.trackingIds.gtmId ||
        smartLink.trackingIds.metaPixelId ||
        smartLink.trackingIds.tiktokPixelId
      );
      
      console.log(`   - A des analytics: ${hasAnalytics ? '✅ OUI' : '❌ NON'}`);
      
      if (smartLink.artistId) {
        console.log(`   - URL attendue: /s/${smartLink.artistId.slug}/${smartLink.slug}`);
      }
    });

    // 2. Vérifier les artistes
    console.log('\n🎭 === VÉRIFICATION DES ARTISTES ===');
    const artists = await Artist.find({}).limit(5);
    
    console.log(`📊 Nombre d'artistes trouvés: ${artists.length}`);
    
    artists.forEach((artist, index) => {
      console.log(`\n🎭 Artiste ${index + 1}:`);
      console.log(`   - ID: ${artist._id}`);
      console.log(`   - Nom: ${artist.name}`);
      console.log(`   - Slug: ${artist.slug}`);
    });

    // 3. Créer un SmartLink de test avec analytics
    console.log('\n🧪 === CRÉATION D\'UN SMARTLINK DE TEST ===');
    
    const testArtist = artists[0];
    if (testArtist) {
      // Vérifier s'il existe déjà
      const existingTestLink = await SmartLink.findOne({
        trackTitle: 'Test Analytics Track',
        artistId: testArtist._id
      });

      if (existingTestLink) {
        console.log('⚠️  SmartLink de test existe déjà, mise à jour...');
        
        existingTestLink.trackingIds = {
          ga4Id: 'G-TEST123456789',
          gtmId: 'GTM-TEST1234',
          metaPixelId: '123456789012345',
          tiktokPixelId: 'CTEST123456789012345'
        };
        
        await existingTestLink.save();
        console.log('✅ SmartLink de test mis à jour');
        console.log(`   - URL de test: /s/${testArtist.slug}/${existingTestLink.slug}`);
      } else {
        const testSmartLink = new SmartLink({
          trackTitle: 'Test Analytics Track',
          artistId: testArtist._id,
          description: 'SmartLink de test pour les analytics',
          customSubtitle: 'Test des analytics par SmartLink',
          platformLinks: [
            { platform: 'Spotify', url: 'https://open.spotify.com/track/test' },
            { platform: 'Apple Music', url: 'https://music.apple.com/test' }
          ],
          trackingIds: {
            ga4Id: 'G-TEST123456789',
            gtmId: 'GTM-TEST1234',
            metaPixelId: '123456789012345',
            tiktokPixelId: 'CTEST123456789012345'
          },
          isPublished: true
        });

        await testSmartLink.save();
        console.log('✅ SmartLink de test créé');
        console.log(`   - URL de test: /s/${testArtist.slug}/${testSmartLink.slug}`);
      }
    }

    // 4. Tester la génération HTML
    console.log('\n🎨 === TEST DE GÉNÉRATION HTML ===');
    const SmartLinkGenerator = require('./routes/smartlinks/smartlinkGenerator');
    const generator = new SmartLinkGenerator();

    const testSmartLink = await SmartLink.findOne({
      trackTitle: 'Test Analytics Track'
    }).populate('artistId');

    if (testSmartLink) {
      console.log('🎯 Test de génération avec analytics...');
      
      const result = await generator.generateSmartLink(
        testSmartLink.toObject(),
        testSmartLink.artistId.toObject(),
        { baseUrl: 'http://localhost:5001' }
      );

      if (result.success) {
        console.log('✅ Génération réussie');
        
        // Vérifier la présence des balises analytics
        const html = result.html;
        const checks = [
          { name: 'GA4 Script', test: /G-TEST123456789/ },
          { name: 'GTM Script', test: /GTM-TEST1234/ },
          { name: 'Meta Pixel', test: /123456789012345/ },
          { name: 'TikTok Pixel', test: /CTEST123456789012345/ }
        ];

        console.log('\n🎯 Vérification des balises injectées:');
        checks.forEach(check => {
          const found = check.test.test(html);
          console.log(`   ${found ? '✅' : '❌'} ${check.name}: ${found ? 'TROUVÉ' : 'ABSENT'}`);
        });

        // Sauvegarder le HTML pour inspection
        const fs = require('fs');
        fs.writeFileSync('./debug-smartlink-output.html', html);
        console.log('\n💾 HTML sauvegardé dans: debug-smartlink-output.html');
      } else {
        console.log('❌ Échec de la génération:', result.error);
      }
    }

    console.log('\n🎯 === INSTRUCTIONS DE TEST ===');
    console.log('1. Redémarrez votre serveur backend');
    console.log('2. Testez cette URL: http://localhost:5001/s/[artist-slug]/test-analytics-track');
    console.log('3. Vérifiez le HTML source pour les balises analytics');
    console.log('4. Utilisez Google Tag Assistant pour vérifier la détection');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
  }
}

debugSmartLinkTracking();