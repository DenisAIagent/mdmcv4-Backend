const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Fonction pour tester la connexion à MongoDB avec une base en mémoire
const testConnectionWithMemoryDB = async () => {
  try {
    logger.info('Démarrage du serveur MongoDB en mémoire...');
    
    // Créer une instance MongoDB en mémoire
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    logger.info(`MongoDB en mémoire démarré avec l'URI: ${mongoUri}`);
    
    // Se connecter à la base en mémoire
    await mongoose.connect(mongoUri);
    
    logger.info('Connexion à MongoDB en mémoire établie avec succès');
    
    // Tester les modèles
    const User = require('../models/User');
    const Artist = require('../models/Artist');
    const SmartLink = require('../models/SmartLink');
    
    // Créer un utilisateur de test
    const testUser = new User({
      name: 'Utilisateur Test',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin'
    });
    
    await testUser.save();
    logger.info(`Utilisateur de test créé avec l'ID: ${testUser._id}`);
    
    // Créer un artiste de test
    const testArtist = new Artist({
      name: 'Artiste Test',
      biography: 'Biographie de test',
      slug: 'artiste-test',
      user: testUser._id
    });
    
    await testArtist.save();
    logger.info(`Artiste de test créé avec l'ID: ${testArtist._id}`);
    
    // Créer un SmartLink de test
    const testSmartLink = new SmartLink({
      title: 'Titre Test',
      artist: testArtist._id,
      coverImage: 'test-cover.jpg',
      slug: 'titre-test',
      type: 'single',
      platforms: [
        {
          name: 'Spotify',
          url: 'https://spotify.com/test'
        }
      ],
      user: testUser._id
    });
    
    await testSmartLink.save();
    logger.info(`SmartLink de test créé avec l'ID: ${testSmartLink._id}`);
    
    // Récupérer les données pour vérifier
    const users = await User.find();
    const artists = await Artist.find();
    const smartLinks = await SmartLink.find();
    
    logger.info(`Nombre d'utilisateurs: ${users.length}`);
    logger.info(`Nombre d'artistes: ${artists.length}`);
    logger.info(`Nombre de SmartLinks: ${smartLinks.length}`);
    
    // Fermer la connexion
    await mongoose.disconnect();
    await mongoServer.stop();
    
    logger.info('Test des modèles terminé avec succès');
    return true;
  } catch (error) {
    logger.error(`Erreur lors du test des modèles: ${error.message}`);
    return false;
  }
};

module.exports = testConnectionWithMemoryDB;
