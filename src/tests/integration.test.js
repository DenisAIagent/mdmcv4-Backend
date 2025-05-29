/**
 * Tests d'intégration pour MDMC Music Ads v4
 * Fichier simplifié pour les tests de base
 */

const app = require('../app');
const request = require('supertest');
const mongoose = require('mongoose');

// Mock de mongoose pour éviter la connexion à la base de données
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    on: jest.fn()
  }
}));

describe('Tests d\'intégration de base', () => {
  test('La route racine devrait retourner un message de bienvenue', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Bienvenue');
  });

  test('Une route inexistante devrait retourner 404', async () => {
    const response = await request(app).get('/route-inexistante');
    expect(response.status).toBe(404);
  });
});
