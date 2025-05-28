const dotenv = require('dotenv');
const runIntegrationTests = require('./tests/integration.test');
const logger = require('./utils/logger');

// Charger les variables d'environnement
dotenv.config();

// Fonction principale pour valider le backoffice
const main = async () => {
  logger.info('Démarrage de la validation du backoffice en conditions réelles...');
  
  // Exécuter les tests d'intégration
  const testResult = await runIntegrationTests();
  
  if (testResult) {
    logger.info('✅ Validation du backoffice réussie!');
    logger.info('Le backoffice est prêt pour la production.');
  } else {
    logger.error('❌ Validation du backoffice échouée!');
    logger.error('Veuillez corriger les erreurs avant le déploiement en production.');
  }
  
  // Terminer le processus
  process.exit(testResult ? 0 : 1);
};

// Exécuter la fonction principale
main();
