const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Test d'intégration pour valider le fonctionnement du backoffice
 * Ce script teste les principales fonctionnalités :
 * - Authentification (inscription, connexion, refresh token)
 * - Gestion des SmartLinks (création, récupération, mise à jour, suppression)
 * - Intégration Odesli (détection des liens)
 */

// Variables pour stocker les données de test
let testUser = {
  name: 'Utilisateur Test',
  email: 'test@mdmcmusicads.com',
  password: 'Password123!'
};

let tokens = {
  token: null,
  refreshToken: null
};

let testSmartLink = {
  id: null
};

// Fonction principale de test
const runIntegrationTests = async () => {
  try {
    logger.info('Démarrage des tests d\'intégration...');

    // Test d'inscription
    logger.info('Test d\'inscription...');
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    if (registerResponse.status === 201) {
      logger.info('✅ Inscription réussie');
      tokens.token = registerResponse.body.token;
      tokens.refreshToken = registerResponse.body.refreshToken;
    } else {
      // Si l'utilisateur existe déjà, tester la connexion
      logger.info('⚠️ Utilisateur déjà existant, test de connexion...');
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      if (loginResponse.status === 200) {
        logger.info('✅ Connexion réussie');
        tokens.token = loginResponse.body.token;
        tokens.refreshToken = loginResponse.body.refreshToken;
      } else {
        throw new Error(`Échec de la connexion: ${loginResponse.body.error}`);
      }
    }

    // Test de récupération du profil
    logger.info('Test de récupération du profil...');
    const profileResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.token}`);

    if (profileResponse.status === 200) {
      logger.info('✅ Récupération du profil réussie');
      testUser.id = profileResponse.body.data._id;
    } else {
      throw new Error(`Échec de la récupération du profil: ${profileResponse.body.error}`);
    }

    // Test de détection de liens Odesli
    logger.info('Test de détection de liens Odesli...');
    const detectResponse = await request(app)
      .post('/api/v1/smartlinks/detect')
      .set('Authorization', `Bearer ${tokens.token}`)
      .send({
        url: 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
      });

    if (detectResponse.status === 200) {
      logger.info('✅ Détection de liens Odesli réussie');
      const smartLinkData = detectResponse.body.data;
      
      // Test de création d'un SmartLink
      logger.info('Test de création d\'un SmartLink...');
      const createResponse = await request(app)
        .post('/api/v1/smartlinks')
        .set('Authorization', `Bearer ${tokens.token}`)
        .send({
          title: smartLinkData.title,
          artistName: smartLinkData.artistName,
          coverImage: smartLinkData.coverImage,
          platforms: smartLinkData.platforms,
          type: smartLinkData.type,
          slug: smartLinkData.slug,
          user: testUser.id
        });

      if (createResponse.status === 201) {
        logger.info('✅ Création de SmartLink réussie');
        testSmartLink.id = createResponse.body.data._id;
        
        // Test de récupération d'un SmartLink
        logger.info('Test de récupération d\'un SmartLink...');
        const getResponse = await request(app)
          .get(`/api/v1/smartlinks/${testSmartLink.id}`)
          .set('Authorization', `Bearer ${tokens.token}`);

        if (getResponse.status === 200) {
          logger.info('✅ Récupération de SmartLink réussie');
        } else {
          throw new Error(`Échec de la récupération de SmartLink: ${getResponse.body.error}`);
        }
        
        // Test de mise à jour d'un SmartLink
        logger.info('Test de mise à jour d\'un SmartLink...');
        const updateResponse = await request(app)
          .put(`/api/v1/smartlinks/${testSmartLink.id}`)
          .set('Authorization', `Bearer ${tokens.token}`)
          .send({
            title: `${smartLinkData.title} (Updated)`
          });

        if (updateResponse.status === 200) {
          logger.info('✅ Mise à jour de SmartLink réussie');
        } else {
          throw new Error(`Échec de la mise à jour de SmartLink: ${updateResponse.body.error}`);
        }
        
        // Test de suppression d'un SmartLink
        logger.info('Test de suppression d\'un SmartLink...');
        const deleteResponse = await request(app)
          .delete(`/api/v1/smartlinks/${testSmartLink.id}`)
          .set('Authorization', `Bearer ${tokens.token}`);

        if (deleteResponse.status === 200) {
          logger.info('✅ Suppression de SmartLink réussie');
        } else {
          throw new Error(`Échec de la suppression de SmartLink: ${deleteResponse.body.error}`);
        }
      } else {
        throw new Error(`Échec de la création de SmartLink: ${createResponse.body.error}`);
      }
    } else {
      throw new Error(`Échec de la détection de liens Odesli: ${detectResponse.body.error}`);
    }
    
    // Test de rafraîchissement du token
    logger.info('Test de rafraîchissement du token...');
    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({
        refreshToken: tokens.refreshToken
      });

    if (refreshResponse.status === 200) {
      logger.info('✅ Rafraîchissement du token réussi');
    } else {
      throw new Error(`Échec du rafraîchissement du token: ${refreshResponse.body.error}`);
    }
    
    // Test de déconnexion
    logger.info('Test de déconnexion...');
    const logoutResponse = await request(app)
      .get('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${tokens.token}`);

    if (logoutResponse.status === 200) {
      logger.info('✅ Déconnexion réussie');
    } else {
      throw new Error(`Échec de la déconnexion: ${logoutResponse.body.error}`);
    }
    
    logger.info('✅✅✅ Tous les tests d\'intégration ont réussi!');
    return true;
  } catch (error) {
    logger.error(`❌ Échec des tests d'intégration: ${error.message}`);
    return false;
  }
};

module.exports = runIntegrationTests;
