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
const User = require('../models/User');

const router = express.Router();

// Importer le middleware de protection
const { protect } = require('../middleware/auth');

// Route temporaire pour mettre à jour le rôle en admin
router.get('/make-admin/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      success: true,
      message: 'Rôle mis à jour avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

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
