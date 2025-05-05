// routes/auth.routes.js (CORRIGÉ)

const express = require("express");

// *** LA CORRECTION EST ICI ***
// Le chemin pointe maintenant vers le fichier correct: authController.js
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} = require("../controllers/authController"); // <--- CORRIGÉ

const router = express.Router();

// Middleware de protection (chemin confirmé par la structure)
const { protect } = require("../middleware/auth");

// --- Routes Publiques ---
router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

// --- Routes Protégées ---
// Le middleware 'protect' est appliqué ici
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/updatepassword", protect, updatePassword);

module.exports = router;
