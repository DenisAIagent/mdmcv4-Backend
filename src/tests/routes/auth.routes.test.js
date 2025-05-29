/**
 * Tests d'intégration pour les routes d'authentification
 * MDMC Music Ads v4
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const db = require('../../models');
const jwt = require('jsonwebtoken');
const config = require('../../config/auth.config');
const bcrypt = require('bcrypt');

// Mock des modèles
jest.mock('../../models', () => ({
  user: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    prototype: {
      save: jest.fn().mockResolvedValue(true)
    }
  },
  role: {
    findOne: jest.fn(),
    find: jest.fn()
  },
  refreshToken: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndDelete: jest.fn()
  }
}));

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true)
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ id: 'user-id' })
}));

describe('Routes d\'authentification', () => {
  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signin', () => {
    it('devrait retourner un token JWT et les informations utilisateur lors d\'une connexion réussie', async () => {
      // Configurer les mocks
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        roles: ['role-id'],
        status: 'active',
        lastLogin: new Date(),
        save: jest.fn().mockResolvedValue(true),
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      
      db.user.findOne.mockResolvedValue(mockUser);
      db.role.find.mockResolvedValue([{ name: 'user' }]);
      db.refreshToken.create.mockResolvedValue({ token: 'refresh-token' });
      
      // Effectuer la requête
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Connexion réussie');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      
      // Vérifier que les méthodes ont été appelées
      expect(db.user.findOne).toHaveBeenCalledWith({ username: 'testuser' });
    });

    it('devrait retourner 401 si le nom d\'utilisateur est incorrect', async () => {
      // Configurer les mocks
      db.user.findOne.mockResolvedValue(null);
      
      // Effectuer la requête
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          username: 'wronguser',
          password: 'password123'
        });
      
      // Vérifier les résultats
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Nom d\'utilisateur ou mot de passe incorrect');
      
      // Vérifier que les méthodes ont été appelées
      expect(db.user.findOne).toHaveBeenCalledWith({ username: 'wronguser' });
    });

    it('devrait retourner 401 si le mot de passe est incorrect', async () => {
      // Configurer les mocks
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      db.user.findOne.mockResolvedValue(mockUser);
      
      // Effectuer la requête
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });
      
      // Vérifier les résultats
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Nom d\'utilisateur ou mot de passe incorrect');
      
      // Vérifier que les méthodes ont été appelées
      expect(db.user.findOne).toHaveBeenCalledWith({ username: 'testuser' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
    });

    it('devrait retourner 403 si le compte utilisateur est inactif', async () => {
      // Configurer les mocks
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        roles: ['role-id'],
        status: 'inactive',
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      
      db.user.findOne.mockResolvedValue(mockUser);
      
      // Effectuer la requête
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      
      // Vérifier les résultats
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Compte inactif. Veuillez contacter un administrateur.');
      
      // Vérifier que les méthodes ont été appelées
      expect(db.user.findOne).toHaveBeenCalledWith({ username: 'testuser' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
    });
  });

  describe('POST /api/auth/signup', () => {
    it('devrait créer un nouvel utilisateur avec succès', async () => {
      // Configurer les mocks
      db.user.findOne.mockResolvedValue(null); // Aucun utilisateur existant
      db.role.findOne.mockResolvedValue({ _id: 'role-id', name: 'user' });
      
      const mockCreatedUser = {
        _id: 'new-user-id',
        username: 'newuser',
        email: 'newuser@example.com',
        fullName: 'New User',
        roles: ['role-id']
      };
      
      db.user.create.mockResolvedValue(mockCreatedUser);
      
      // Effectuer la requête
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
          fullName: 'New User'
        });
      
      // Vérifier les résultats
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Utilisateur créé avec succès');
      expect(response.body).toHaveProperty('user');
      
      // Vérifier que les méthodes ont été appelées
      expect(db.user.findOne).toHaveBeenCalled();
      expect(db.role.findOne).toHaveBeenCalledWith({ name: 'user' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.user.create).toHaveBeenCalled();
    });

    it('devrait retourner 400 si le nom d\'utilisateur ou l\'email existe déjà', async () => {
      // Configurer les mocks
      db.user.findOne.mockResolvedValue({
        _id: 'existing-user-id',
        username: 'existinguser',
        email: 'existing@example.com'
      });
      
      // Effectuer la requête
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'password123',
          fullName: 'Existing User'
        });
      
      // Vérifier les résultats
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Le nom d\'utilisateur ou l\'email est déjà utilisé');
      
      // Vérifier que les méthodes ont été appelées
      expect(db.user.findOne).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/signout', () => {
    it('devrait déconnecter l\'utilisateur avec succès', async () => {
      // Configurer les mocks
      db.refreshToken.findOneAndDelete.mockResolvedValue({ token: 'refresh-token' });
      
      // Effectuer la requête
      const response = await request(app)
        .post('/api/auth/signout')
        .send({ refreshToken: 'refresh-token' });
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Déconnexion réussie');
      
      // Vérifier que les méthodes ont été appelées
      expect(db.refreshToken.findOneAndDelete).toHaveBeenCalledWith({ token: 'refresh-token' });
    });
  });

  describe('GET /api/auth/profile', () => {
    it('devrait retourner le profil de l\'utilisateur connecté', async () => {
      // Configurer les mocks
      const mockUser = {
        _id: 'user-id',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        roles: ['role-id'],
        status: 'active',
        lastLogin: new Date(),
        createdAt: new Date()
      };
      
      db.user.findById.mockResolvedValue(mockUser);
      db.role.find.mockResolvedValue([{ name: 'user' }]);
      
      // Effectuer la requête
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');
      
      // Vérifier les résultats
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      
      // Vérifier que les méthodes ont été appelées
      expect(jwt.verify).toHaveBeenCalled();
      expect(db.user.findById).toHaveBeenCalledWith('user-id');
    });
  });
});
