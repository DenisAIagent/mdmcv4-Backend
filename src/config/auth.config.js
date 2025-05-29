/**
 * Configuration de l'authentification pour MDMC Music Ads v4
 */

module.exports = {
  // Clé secrète pour la signature des tokens JWT
  secret: "mdmc-music-ads-v4-secret-key",
  
  // Durée de validité du token d'accès (en secondes)
  jwtExpiration: 3600, // 1 heure
  
  // Durée de validité du token de rafraîchissement (en secondes)
  jwtRefreshExpiration: 86400, // 24 heures
  
  // Options de cookie pour le token de rafraîchissement
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
};
