// configure-smartlink-tracking.js
// Script pour configurer les trackingIds des SmartLinks existants

const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Models
const SmartLink = require('./models/SmartLink');
const Artist = require('./models/Artist');

// Interface utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour poser une question
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function configureSmartLinkTracking() {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Afficher les SmartLinks existants
    console.log('\n🔍 === SMARTLINKS EXISTANTS ===');
    const smartLinks = await SmartLink.find({}).populate('artistId').sort({ createdAt: -1 });
    
    console.log(`📊 ${smartLinks.length} SmartLinks trouvés:\n`);
    
    const smartLinksWithoutAnalytics = [];
    
    smartLinks.forEach((smartLink, index) => {
      const hasAnalytics = smartLink.trackingIds && (
        smartLink.trackingIds.ga4Id ||
        smartLink.trackingIds.gtmId ||
        smartLink.trackingIds.metaPixelId ||
        smartLink.trackingIds.tiktokPixelId
      );
      
      const status = hasAnalytics ? '✅ Analytics configurés' : '❌ Pas d\'analytics';
      const artistName = smartLink.artistId?.name || 'Artiste inconnu';
      
      console.log(`${index + 1}. ${smartLink.trackTitle} - ${artistName}`);
      console.log(`   📋 ID: ${smartLink._id}`);
      console.log(`   🔗 URL: /s/${smartLink.artistId?.slug || 'unknown'}/${smartLink.slug}`);
      console.log(`   🎯 Status: ${status}`);
      console.log(`   📅 Créé: ${smartLink.createdAt?.toLocaleDateString() || 'N/A'}`);
      
      if (hasAnalytics) {
        console.log(`   🎯 Analytics actuels:`);
        if (smartLink.trackingIds.ga4Id) console.log(`      - GA4: ${smartLink.trackingIds.ga4Id}`);
        if (smartLink.trackingIds.gtmId) console.log(`      - GTM: ${smartLink.trackingIds.gtmId}`);
        if (smartLink.trackingIds.metaPixelId) console.log(`      - Meta: ${smartLink.trackingIds.metaPixelId}`);
        if (smartLink.trackingIds.tiktokPixelId) console.log(`      - TikTok: ${smartLink.trackingIds.tiktokPixelId}`);
      } else {
        smartLinksWithoutAnalytics.push(smartLink);
      }
      
      console.log('');
    });

    if (smartLinksWithoutAnalytics.length === 0) {
      console.log('🎉 Tous les SmartLinks ont déjà des analytics configurés !');
      return;
    }

    console.log(`\n⚠️  ${smartLinksWithoutAnalytics.length} SmartLinks n'ont pas d'analytics configurés.\n`);

    // 2. Demander le mode de configuration
    console.log('🎯 === MODES DE CONFIGURATION ===');
    console.log('1. Configuration globale (mêmes IDs pour tous les SmartLinks)');
    console.log('2. Configuration individuelle (différents IDs par SmartLink)');
    console.log('3. Configuration par artiste (mêmes IDs par artiste)');
    console.log('4. Annuler');
    
    const mode = await askQuestion('\nChoisissez un mode (1-4): ');
    
    switch(mode) {
      case '1':
        await configureGlobal(smartLinksWithoutAnalytics);
        break;
      case '2':
        await configureIndividual(smartLinksWithoutAnalytics);
        break;
      case '3':
        await configureByArtist(smartLinksWithoutAnalytics);
        break;
      case '4':
        console.log('❌ Configuration annulée');
        return;
      default:
        console.log('❌ Mode invalide');
        return;
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('✅ Déconnecté de MongoDB');
  }
}

// Configuration globale
async function configureGlobal(smartLinks) {
  console.log('\n🌍 === CONFIGURATION GLOBALE ===');
  console.log('Ces IDs seront appliqués à tous les SmartLinks sélectionnés.\n');
  
  const trackingIds = await askTrackingIds();
  
  console.log('\n📋 === RÉCAPITULATIF ===');
  console.log(`SmartLinks à configurer: ${smartLinks.length}`);
  console.log('IDs Analytics:');
  if (trackingIds.ga4Id) console.log(`  - GA4: ${trackingIds.ga4Id}`);
  if (trackingIds.gtmId) console.log(`  - GTM: ${trackingIds.gtmId}`);
  if (trackingIds.metaPixelId) console.log(`  - Meta Pixel: ${trackingIds.metaPixelId}`);
  if (trackingIds.tiktokPixelId) console.log(`  - TikTok Pixel: ${trackingIds.tiktokPixelId}`);
  
  const confirm = await askQuestion('\nConfirmer cette configuration ? (o/n): ');
  
  if (confirm.toLowerCase() === 'o' || confirm.toLowerCase() === 'oui') {
    console.log('\n⏳ Configuration en cours...');
    
    for (const smartLink of smartLinks) {
      smartLink.trackingIds = trackingIds;
      await smartLink.save();
      console.log(`✅ ${smartLink.trackTitle} - Analytics configurés`);
    }
    
    console.log(`\n🎉 ${smartLinks.length} SmartLinks configurés avec succès !`);
  } else {
    console.log('❌ Configuration annulée');
  }
}

// Configuration individuelle
async function configureIndividual(smartLinks) {
  console.log('\n👤 === CONFIGURATION INDIVIDUELLE ===');
  console.log('Vous allez configurer chaque SmartLink individuellement.\n');
  
  for (const smartLink of smartLinks) {
    console.log(`\n🎵 Configuration pour: ${smartLink.trackTitle} - ${smartLink.artistId?.name || 'Artiste inconnu'}`);
    console.log(`📋 ID: ${smartLink._id}`);
    console.log(`🔗 URL: /s/${smartLink.artistId?.slug || 'unknown'}/${smartLink.slug}`);
    
    const configure = await askQuestion('Configurer ce SmartLink ? (o/n/q pour quitter): ');
    
    if (configure.toLowerCase() === 'q') {
      console.log('❌ Configuration interrompue');
      break;
    }
    
    if (configure.toLowerCase() === 'o' || configure.toLowerCase() === 'oui') {
      const trackingIds = await askTrackingIds();
      
      smartLink.trackingIds = trackingIds;
      await smartLink.save();
      
      console.log('✅ SmartLink configuré avec succès !');
    } else {
      console.log('⏭️  SmartLink ignoré');
    }
  }
}

// Configuration par artiste
async function configureByArtist(smartLinks) {
  console.log('\n🎭 === CONFIGURATION PAR ARTISTE ===');
  
  // Grouper par artiste
  const byArtist = {};
  smartLinks.forEach(smartLink => {
    const artistId = smartLink.artistId?._id?.toString() || 'unknown';
    const artistName = smartLink.artistId?.name || 'Artiste inconnu';
    
    if (!byArtist[artistId]) {
      byArtist[artistId] = {
        name: artistName,
        slug: smartLink.artistId?.slug || 'unknown',
        smartLinks: []
      };
    }
    
    byArtist[artistId].smartLinks.push(smartLink);
  });
  
  console.log('SmartLinks groupés par artiste:\n');
  Object.values(byArtist).forEach((artist, index) => {
    console.log(`${index + 1}. ${artist.name} (${artist.smartLinks.length} SmartLinks)`);
    artist.smartLinks.forEach(sl => {
      console.log(`   - ${sl.trackTitle}`);
    });
    console.log('');
  });
  
  for (const [artistId, artist] of Object.entries(byArtist)) {
    console.log(`\n🎭 Configuration pour: ${artist.name}`);
    console.log(`📊 ${artist.smartLinks.length} SmartLinks à configurer`);
    
    const configure = await askQuestion('Configurer cet artiste ? (o/n/q pour quitter): ');
    
    if (configure.toLowerCase() === 'q') {
      console.log('❌ Configuration interrompue');
      break;
    }
    
    if (configure.toLowerCase() === 'o' || configure.toLowerCase() === 'oui') {
      const trackingIds = await askTrackingIds();
      
      console.log('\n⏳ Configuration en cours...');
      
      for (const smartLink of artist.smartLinks) {
        smartLink.trackingIds = trackingIds;
        await smartLink.save();
        console.log(`✅ ${smartLink.trackTitle} - Analytics configurés`);
      }
      
      console.log(`\n🎉 ${artist.smartLinks.length} SmartLinks configurés pour ${artist.name} !`);
    } else {
      console.log('⏭️  Artiste ignoré');
    }
  }
}

// Fonction pour demander les IDs de tracking
async function askTrackingIds() {
  console.log('\n🎯 === CONFIGURATION DES ANALYTICS ===');
  console.log('Laissez vide pour ignorer un type d\'analytics.\n');
  
  const ga4Id = await askQuestion('Google Analytics 4 ID (G-XXXXXXXXXX): ');
  const gtmId = await askQuestion('Google Tag Manager ID (GTM-XXXXXXX): ');
  const metaPixelId = await askQuestion('Meta Pixel ID (123456789012345): ');
  const tiktokPixelId = await askQuestion('TikTok Pixel ID (CXXXXXXXXXXXXXXX): ');
  
  const trackingIds = {};
  
  if (ga4Id.trim()) trackingIds.ga4Id = ga4Id.trim();
  if (gtmId.trim()) trackingIds.gtmId = gtmId.trim();
  if (metaPixelId.trim()) trackingIds.metaPixelId = metaPixelId.trim();
  if (tiktokPixelId.trim()) trackingIds.tiktokPixelId = tiktokPixelId.trim();
  
  return trackingIds;
}

// Fonction pour tester un SmartLink configuré
async function testSmartLink(smartLinkId) {
  try {
    const smartLink = await SmartLink.findById(smartLinkId).populate('artistId');
    
    if (!smartLink) {
      console.log('❌ SmartLink non trouvé');
      return;
    }
    
    console.log('\n🧪 === TEST DU SMARTLINK ===');
    console.log(`📋 SmartLink: ${smartLink.trackTitle} - ${smartLink.artistId?.name}`);
    console.log(`🔗 URL: /s/${smartLink.artistId?.slug}/${smartLink.slug}`);
    
    const hasAnalytics = smartLink.trackingIds && (
      smartLink.trackingIds.ga4Id ||
      smartLink.trackingIds.gtmId ||
      smartLink.trackingIds.metaPixelId ||
      smartLink.trackingIds.tiktokPixelId
    );
    
    if (hasAnalytics) {
      console.log('✅ Analytics configurés:');
      if (smartLink.trackingIds.ga4Id) console.log(`  - GA4: ${smartLink.trackingIds.ga4Id}`);
      if (smartLink.trackingIds.gtmId) console.log(`  - GTM: ${smartLink.trackingIds.gtmId}`);
      if (smartLink.trackingIds.metaPixelId) console.log(`  - Meta: ${smartLink.trackingIds.metaPixelId}`);
      if (smartLink.trackingIds.tiktokPixelId) console.log(`  - TikTok: ${smartLink.trackingIds.tiktokPixelId}`);
      
      console.log('\n🎯 Instructions de test:');
      console.log('1. Redémarrez votre serveur backend');
      console.log(`2. Visitez: http://localhost:5001/s/${smartLink.artistId?.slug}/${smartLink.slug}`);
      console.log('3. Ouvrez les outils de développement (F12)');
      console.log('4. Vérifiez la console pour les messages d\'initialisation');
      console.log('5. Utilisez Google Tag Assistant pour vérifier la détection');
    } else {
      console.log('❌ Aucun analytics configuré');
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

// Démarrage du script
console.log('🎯 === CONFIGURATION DES ANALYTICS SMARTLINKS ===');
console.log('Ce script vous aide à configurer les trackingIds pour vos SmartLinks existants.\n');

configureSmartLinkTracking().catch(console.error);