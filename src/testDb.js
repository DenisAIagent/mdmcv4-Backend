const dotenv = require('dotenv');
const testConnection = require('./utils/testConnection');
const logger = require('./utils/logger');

// Charger les variables d'environnement
dotenv.config();

// Fonction principale pour tester la connexion
const main = async () => {
  logger.info('Démarrage du test de connexion à MongoDB...');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    logger.info('Test de connexion réussi. La base de données est accessible.');
  } else {
    logger.error('Test de connexion échoué. Vérifiez les paramètres de connexion.');
  }
  
  // Fermer la connexion
  process.exit(isConnected ? 0 : 1);
};

// Exécuter la fonction principale
main();
