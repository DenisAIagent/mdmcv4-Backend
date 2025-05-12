const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  confirmEmail
} = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Importer le middleware de protection
const { protect } = require('../middleware/auth');

// Routes publiques
router.post('/register', async (req, res, next) => {
  try {
    await register(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    await login(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/confirm-email/:token', async (req, res, next) => {
  try {
    await confirmEmail(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.post('/forgotpassword', async (req, res, next) => {
  try {
    await forgotPassword(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.put('/resetpassword/:resettoken', async (req, res, next) => {
  try {
    await resetPassword(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Routes protégées
router.get('/logout', protect, async (req, res, next) => {
  try {
    await logout(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get('/me', protect, async (req, res, next) => {
  try {
    await getMe(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.put('/updatepassword', protect, async (req, res, next) => {
  try {
    await updatePassword(req, res, next);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
