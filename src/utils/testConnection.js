const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Fonction pour tester la connexion à MongoDB
const testConnection = async () => {
  try {
    // Vérifier si la variable d'environnement MONGO_URI est définie
    if (!process.env.MONGO_URI) {
      logger.error('Variable d\'environnement MONGO_URI non définie');
      return false;
    }

    // Tenter de se connecter à MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB connecté avec succès: ${conn.connection.host}`);
    
    // Vérifier les collections existantes
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`Collections existantes: ${collections.map(c => c.name).join(', ')}`);
    
    return true;
  } catch (error) {
    logger.error(`Erreur de connexion à MongoDB: ${error.message}`);
    return false;
  }
};

module.exports = testConnection;
