/**
 * Configuration des tests unitaires et d'intégration pour MDMC Music Ads v4
 * Utilise Jest comme framework de test
 */

module.exports = {
  // Répertoire racine pour la recherche des tests
  roots: ['<rootDir>/src/tests'],
  
  // Motifs de fichiers pour les tests
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Transformations pour les fichiers
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Modules à mocker automatiquement
  automock: false,
  
  // Répertoires de modules à rechercher
  moduleDirectories: ['node_modules', 'src'],
  
  // Mappages de modules pour les tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Configuration de la couverture de code
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/tests/**',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Environnement de test
  testEnvironment: 'node',
  
  // Timeout pour les tests
  testTimeout: 10000,
  
  // Hooks de configuration
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  
  // Reporter personnalisé
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'jest-junit.xml'
      }
    ]
  ],
  
  // Verbose output
  verbose: true
};
