const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  logout, 
  getMe, 
  refreshToken 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Routes protégées
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
