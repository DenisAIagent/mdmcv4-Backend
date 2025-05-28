// Configuration adaptée pour permettre le développement local
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Déterminer l'URI à utiliser selon l'environnement
    let dbUri;
    
    if (process.env.NODE_ENV === 'production') {
      // En production, utiliser l'URI Railway
      dbUri = process.env.MONGO_URI;
    } else {
      // En développement, utiliser MongoDB local ou une base de test
      dbUri = process.env.MONGO_URI_DEV || 'mongodb://localhost:27017/mdmc_dev';
    }
    
    logger.info(`Tentative de connexion à MongoDB (${process.env.NODE_ENV})...`);
    
    // Connexion à MongoDB avec options mises à jour (sans options dépréciées)
    const conn = await mongoose.connect(dbUri);

    logger.info(`MongoDB connecté: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
