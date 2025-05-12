const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Utiliser l'IP du client ou un identifiant unique
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.connection.socket?.remoteAddress || 
           'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    });
  }
});

module.exports = {
  loginLimiter
}; 