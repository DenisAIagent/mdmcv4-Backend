// scripts/update-smartlinks-subtitle.js
// Script pour ajouter les nouveaux champs subtitle aux smartlinks existants

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const SmartLink = require('../models/SmartLink');

const updateSmartLinksWithSubtitle = async () => {
  try {
    // Connexion à MongoDB
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI non définie');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Trouver tous les smartlinks qui n'ont pas les nouveaux champs
    const smartlinksToUpdate = await SmartLink.find({
      $or: [
        { customSubtitle: { $exists: false } },
        { useDescriptionAsSubtitle: { $exists: false } }
      ]
    });
    
    console.log(`📊 Trouvé ${smartlinksToUpdate.length} smartlinks à mettre à jour`);
    
    if (smartlinksToUpdate.length === 0) {
      console.log('✅ Tous les smartlinks sont déjà à jour');
      process.exit(0);
    }
    
    // Mettre à jour chaque smartlink
    let updateCount = 0;
    for (const smartlink of smartlinksToUpdate) {
      try {
        await SmartLink.updateOne(
          { _id: smartlink._id },
          {
            $set: {
              customSubtitle: smartlink.customSubtitle || "Choose music service",
              useDescriptionAsSubtitle: smartlink.useDescriptionAsSubtitle || false
            }
          }
        );
        updateCount++;
        console.log(`✅ Mis à jour: ${smartlink.trackTitle} (${smartlink._id})`);
      } catch (error) {
        console.error(`❌ Erreur mise à jour ${smartlink.trackTitle}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Mise à jour terminée: ${updateCount}/${smartlinksToUpdate.length} smartlinks mis à jour`);
    
    // Vérification
    const verification = await SmartLink.findOne({ 
      _id: smartlinksToUpdate[0]._id 
    }).select('trackTitle customSubtitle useDescriptionAsSubtitle');
    
    console.log('\n📋 Vérification (premier smartlink):');
    console.log(`   Titre: ${verification.trackTitle}`);
    console.log(`   Custom Subtitle: "${verification.customSubtitle}"`);
    console.log(`   Use Description: ${verification.useDescriptionAsSubtitle}`);
    
  } catch (error) {
    console.error('❌ Erreur script:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Déconnecté de MongoDB');
    process.exit(0);
  }
};

// Exécuter le script
if (require.main === module) {
  updateSmartLinksWithSubtitle();
}

module.exports = { updateSmartLinksWithSubtitle };