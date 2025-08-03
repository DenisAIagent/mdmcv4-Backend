// Script pour créer un SmartLink de test et activer l'architecture HTML statique
// Reproduit le SmartLink Slipknot existant en version HTML statique

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const StaticHtmlGenerator = require('../services/staticHtmlGenerator');

async function createTestSmartLink() {
  console.log('🧪 CRÉATION SMARTLINK DE TEST - SLIPKNOT\n');
  
  try {
    // Connexion à MongoDB
    console.log('1. Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Recherche du modèle disponible
    let SmartLinkModel;
    try {
      SmartLinkModel = require('../models/SmartLinkHTML');
      console.log('✅ Utilisation du modèle SmartLinkHTML');
    } catch (error) {
      console.log('⚠️  Modèle SmartLinkHTML non trouvé');
      return;
    }

    // Création du SmartLink Slipknot "Wait and Bleed"
    console.log('\n2. Création SmartLink Slipknot...');
    
    const smartlinkData = {
      artist: 'Slipknot',
      title: 'Wait and Bleed',
      description: 'Écoutez "Wait and Bleed" de Slipknot, un titre iconique de metal alternatif. Disponible sur toutes les plateformes de streaming.',
      imageUrl: 'https://i.scdn.co/image/ab67616d0000b273d76b279a3709e50b6e8ac3d3',
      spotifyUrl: 'https://open.spotify.com/track/2DlHlPMa4M17kufBvbOT4r',
      appleUrl: 'https://music.apple.com/us/album/wait-and-bleed/1440890531?i=1440890910',
      youtubeUrl: 'https://music.youtube.com/watch?v=B1zCN0YhW1s',
      deezerUrl: 'https://www.deezer.com/track/125506',
      amazonUrl: 'https://music.amazon.com/albums/B002FVNXGA?marketplaceId=ATVPDKIKX0DER&musicTerritory=US&ref=dm_sh_9b4b-6c9c-dmcp-8f50-c4f2',
      tidalUrl: 'https://tidal.com/browse/track/624466',
      isPublished: true,
      template: 'default',
      primaryColor: '#E50914'
    };

    // Vérifier si le SmartLink existe déjà
    const existingSmartLink = await SmartLinkModel.findOne({ 
      artist: 'Slipknot',
      title: 'Wait and Bleed'
    });

    let smartlink;
    if (existingSmartLink) {
      console.log('✅ SmartLink Slipknot existe déjà, mise à jour...');
      smartlink = await SmartLinkModel.findByIdAndUpdate(
        existingSmartLink._id,
        smartlinkData,
        { new: true }
      );
    } else {
      console.log('✅ Création nouveau SmartLink Slipknot...');
      smartlink = new SmartLinkModel(smartlinkData);
      await smartlink.save();
    }

    console.log(`✅ SmartLink créé: ${smartlink.slug}`);
    console.log(`   Artist Slug: ${smartlink.artistSlug}`);
    console.log(`   Track Slug: ${smartlink.trackSlug}`);

    // Génération du fichier HTML statique
    console.log('\n3. Génération fichier HTML statique...');
    
    const htmlGenerator = new StaticHtmlGenerator();
    
    // Formatage des données pour le générateur
    const htmlData = {
      trackTitle: smartlink.title,
      slug: smartlink.trackSlug,
      description: smartlink.description,
      subtitle: smartlink.subtitle || '',
      coverImageUrl: smartlink.imageUrl,
      platformLinks: [
        { platform: 'spotify', url: smartlink.spotifyUrl },
        { platform: 'apple', url: smartlink.appleUrl },
        { platform: 'youtube', url: smartlink.youtubeUrl },
        { platform: 'deezer', url: smartlink.deezerUrl },
        { platform: 'amazon', url: smartlink.amazonUrl },
        { platform: 'tidal', url: smartlink.tidalUrl }
      ].filter(link => link.url),
      artist: {
        name: smartlink.artist,
        slug: smartlink.artistSlug
      }
    };

    // Génération du fichier HTML
    const filePath = await htmlGenerator.generateSmartLinkHtml(htmlData);
    console.log(`✅ Fichier HTML généré: ${filePath}`);

    // Vérification du fichier
    const fileExists = await htmlGenerator.htmlFileExists(
      smartlink.artistSlug,
      smartlink.trackSlug
    );
    
    if (fileExists) {
      console.log('✅ Fichier HTML accessible');
    }

    // URLs générées
    console.log('\n🔗 URLS GÉNÉRÉES:');
    console.log(`   Ancienne (hash): https://www.mdmcmusicads.com/#/smartlinks/${smartlink.artistSlug}/${smartlink.trackSlug}`);
    console.log(`   Nouvelle (HTML): https://www.mdmcmusicads.com/smartlinks/${smartlink.artistSlug}/${smartlink.trackSlug}`);
    
    // Statistiques
    console.log('\n📊 Statistiques:');
    const stats = await htmlGenerator.getStats();
    console.log(`   Fichiers HTML: ${stats.totalFiles}`);
    console.log(`   Artistes: ${stats.totalArtists}`);
    console.log(`   Taille: ${Math.round(stats.totalSize / 1024)} KB`);

    console.log('\n🎯 SMARTLINK DE TEST CRÉÉ ET ACTIVÉ !');
    console.log('\n📋 Test à effectuer:');
    console.log(`   1. Visiter: https://www.mdmcmusicads.com/smartlinks/${smartlink.artistSlug}/${smartlink.trackSlug}`);
    console.log('   2. Vérifier métadonnées avec Facebook Debugger');
    console.log('   3. Comparer avec ancienne URL hash');

    return {
      smartlink,
      htmlData,
      filePath,
      urls: {
        old: `https://www.mdmcmusicads.com/#/smartlinks/${smartlink.artistSlug}/${smartlink.trackSlug}`,
        new: `https://www.mdmcmusicads.com/smartlinks/${smartlink.artistSlug}/${smartlink.trackSlug}`
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Lancement du script
if (require.main === module) {
  createTestSmartLink().catch(console.error);
}

module.exports = { createTestSmartLink };