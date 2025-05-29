/**
 * Configuration de Jest pour les tests
 * Ce fichier est utilisé pour configurer l'environnement de test
 */

// Augmenter le timeout pour les tests qui nécessitent plus de temps
jest.setTimeout(30000);

// Supprimer les avertissements de dépréciation de MongoDB
jest.spyOn(console, 'warn').mockImplementation((message) => {
  if (!message.includes('deprecated')) {
    // Afficher les avertissements non liés à la dépréciation
    console.warn(message);
  }
});

// Configuration globale pour les tests
beforeAll(() => {
  // Code à exécuter avant tous les tests
  console.log('Démarrage des tests...');
});

afterAll(() => {
  // Code à exécuter après tous les tests
  console.log('Fin des tests');
});
