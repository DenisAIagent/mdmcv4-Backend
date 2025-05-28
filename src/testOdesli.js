const dotenv = require('dotenv');
const odesliService = require('./services/odesliService');
const logger = require('./utils/logger');

// Charger les variables d'environnement
dotenv.config();

// Fonction principale pour tester l'API Odesli
const main = async () => {
  try {
    logger.info('Démarrage du test de l\'API Odesli...');
    
    // URL de test (Spotify)
    const spotifyUrl = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT';
    
    logger.info(`Test avec l'URL Spotify: ${spotifyUrl}`);
    
    // Récupérer les liens via l'API Odesli
    const odesliData = await odesliService.getLinks(spotifyUrl);
    
    logger.info('Données brutes récupérées avec succès');
    
    // Formater les données pour un SmartLink
    const formattedData = odesliService.formatData(odesliData);
    
    logger.info('Données formatées avec succès:');
    logger.info(`Titre: ${formattedData.title}`);
    logger.info(`Artiste: ${formattedData.artistName}`);
    logger.info(`Type: ${formattedData.type}`);
    logger.info(`Slug: ${formattedData.slug}`);
    logger.info(`Image de couverture: ${formattedData.coverImage}`);
    logger.info(`Nombre de plateformes: ${formattedData.platforms.length}`);
    
    // Afficher les plateformes disponibles
    formattedData.platforms.forEach((platform, index) => {
      logger.info(`Plateforme ${index + 1}: ${platform.name} - ${platform.url}`);
    });
    
    logger.info('Test de l\'API Odesli terminé avec succès');
  } catch (error) {
    logger.error(`Erreur lors du test de l'API Odesli: ${error.message}`);
  }
};

// Exécuter la fonction principale
main();
