const dotenv = require('dotenv');
const testMemoryDB = require('./utils/testMemoryDB');
const logger = require('./utils/logger');

// Charger les variables d'environnement
dotenv.config();

// Fonction principale pour tester les modèles avec une base en mémoire
const main = async () => {
  logger.info('Démarrage des tests avec MongoDB en mémoire...');
  
  const isSuccess = await testMemoryDB();
  
  if (isSuccess) {
    logger.info('Tests des modèles réussis. La structure de la base de données est valide.');
  } else {
    logger.error('Tests des modèles échoués. Vérifiez les schémas et les modèles.');
  }
  
  // Terminer le processus
  process.exit(isSuccess ? 0 : 1);
};

// Exécuter la fonction principale
main();
