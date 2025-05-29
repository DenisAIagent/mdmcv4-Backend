/**
 * Tests unitaires pour le middleware d'authentification
 * MDMC Music Ads v4
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { authJwt } = require('../../middleware');
const config = require('../../config/auth.config');
const db = require('../../models');

// Mock des modèles et fonctions
jest.mock('../../models', () => ({
  user: {
    findById: jest.fn(),
    findOne: jest.fn()
  },
  role: {
    find: jest.fn()
  },
  accessLog: {
    create: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    
    // Configurer les objets req, res et next
    req = {
      headers: {
        'user-agent': 'Jest Test Agent'
      },
      cookies: {},
      ip: '127.0.0.1',
      method: 'GET',
      originalUrl: '/api/test'
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });

  describe('verifyToken', () => {
    it('devrait retourner 401 si aucun token n\'est fourni', () => {
      // Appeler le middleware
      authJwt.verifyToken(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Aucun token fourni. Authentification requise.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait appeler next() si le token est valide', () => {
      // Configurer le token
      req.headers['authorization'] = 'Bearer valid-token';
      
      // Configurer le mock de jwt.verify
      jwt.verify.mockImplementation((token, secret) => {
        return { id: 'user-id' };
      });
      
      // Appeler le middleware
      authJwt.verifyToken(req, res, next);
      
      // Vérifier les résultats
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', config.secret);
      expect(req.userId).toBe('user-id');
      expect(next).toHaveBeenCalled();
    });

    it('devrait retourner 401 si le token est expiré', () => {
      // Configurer le token
      req.headers['authorization'] = 'Bearer expired-token';
      
      // Configurer le mock de jwt.verify pour lancer une erreur
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });
      
      // Appeler le middleware
      authJwt.verifyToken(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.',
        expired: true
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait retourner 401 si le token est invalide', () => {
      // Configurer le token
      req.headers['authorization'] = 'Bearer invalid-token';
      
      // Configurer le mock de jwt.verify pour lancer une erreur
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Appeler le middleware
      authJwt.verifyToken(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token non valide. Authentification requise.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    beforeEach(() => {
      // Configurer l'ID utilisateur
      req.userId = 'admin-user-id';
    });

    it('devrait appeler next() si l\'utilisateur est admin', async () => {
      // Configurer le mock de User.findById
      db.user.findById.mockResolvedValue({
        roles: [{ name: 'admin' }, { name: 'user' }]
      });
      
      // Appeler le middleware
      await authJwt.isAdmin(req, res, next);
      
      // Vérifier les résultats
      expect(db.user.findById).toHaveBeenCalledWith('admin-user-id');
      expect(next).toHaveBeenCalled();
    });

    it('devrait retourner 403 si l\'utilisateur n\'est pas admin', async () => {
      // Configurer le mock de User.findById
      db.user.findById.mockResolvedValue({
        roles: [{ name: 'user' }]
      });
      
      // Appeler le middleware
      await authJwt.isAdmin(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Accès refusé. Rôle administrateur requis.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait retourner 404 si l\'utilisateur n\'existe pas', async () => {
      // Configurer le mock de User.findById
      db.user.findById.mockResolvedValue(null);
      
      // Appeler le middleware
      await authJwt.isAdmin(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('devrait retourner 500 en cas d\'erreur de base de données', async () => {
      // Configurer le mock de User.findById pour lancer une erreur
      db.user.findById.mockRejectedValue(new Error('Database error'));
      
      // Appeler le middleware
      await authJwt.isAdmin(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la vérification des rôles.',
        error: 'Database error'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('logAccess', () => {
    beforeEach(() => {
      // Configurer l'ID utilisateur
      req.userId = 'user-id';
    });

    it('devrait enregistrer l\'accès et appeler next()', async () => {
      // Appeler le middleware
      await authJwt.logAccess(req, res, next);
      
      // Vérifier les résultats
      expect(db.accessLog.create).toHaveBeenCalledWith({
        userId: 'user-id',
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        userAgent: 'Jest Test Agent'
      });
      expect(next).toHaveBeenCalled();
    });

    it('devrait appeler next() même en cas d\'erreur', async () => {
      // Configurer le mock pour lancer une erreur
      db.accessLog.create.mockRejectedValue(new Error('Database error'));
      
      // Espionner console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Appeler le middleware
      await authJwt.logAccess(req, res, next);
      
      // Vérifier les résultats
      expect(consoleSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
      
      // Restaurer console.error
      consoleSpy.mockRestore();
    });
  });

  // Note: Les tests pour hasRole et hasPermission sont simplifiés pour l'exemple
  describe('hasRole', () => {
    beforeEach(() => {
      req.userId = 'user-id';
    });

    it('devrait appeler next() si l\'utilisateur a le rôle requis', async () => {
      // Configurer le mock
      db.user.findById.mockResolvedValue({
        roles: [{ name: 'editor' }, { name: 'user' }]
      });
      
      // Créer le middleware avec les rôles requis
      const middleware = authJwt.hasRole(['editor']);
      
      // Appeler le middleware
      await middleware(req, res, next);
      
      // Vérifier les résultats
      expect(next).toHaveBeenCalled();
    });
  });

  describe('isActive', () => {
    beforeEach(() => {
      req.userId = 'user-id';
    });

    it('devrait appeler next() si l\'utilisateur est actif', async () => {
      // Configurer le mock
      db.user.findById.mockResolvedValue({
        status: 'active'
      });
      
      // Appeler le middleware
      await authJwt.isActive(req, res, next);
      
      // Vérifier les résultats
      expect(next).toHaveBeenCalled();
    });

    it('devrait retourner 403 si l\'utilisateur n\'est pas actif', async () => {
      // Configurer le mock
      db.user.findById.mockResolvedValue({
        status: 'inactive'
      });
      
      // Appeler le middleware
      await authJwt.isActive(req, res, next);
      
      // Vérifier les résultats
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Compte inactif. Veuillez contacter un administrateur.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
