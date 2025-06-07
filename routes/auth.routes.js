// backend/routes/auth.routes.js

const express = require("express");

// Importer les fonctions du contrôleur d'authentification
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} = require("../controllers/authController"); // Assurez-vous que ce chemin est correct

const router = express.Router();

// Importer le middleware de protection
// Assurez-vous que ce chemin est correct
const { protect } = require("../middleware/auth");

// --- Routes Publiques ---
// Enregistrement d'un nouvel utilisateur
router.post("/register", register);

// Connexion d'un utilisateur existant
router.post("/login", login);

// Demande de réinitialisation de mot de passe
router.post("/forgotpassword", forgotPassword);

// Réinitialisation effective du mot de passe via le token reçu par email
router.put("/resetpassword/:resettoken", resetPassword);

// --- Routes Protégées (Nécessitent un token JWT valide) ---

// Déconnexion de l'utilisateur (efface le cookie)
// Le middleware 'protect' vérifie d'abord que l'utilisateur est connecté
router.get("/logout", protect, logout);

// Obtenir les informations de l'utilisateur actuellement connecté
// Le middleware 'protect' vérifie le token et attache l'utilisateur à req.user
router.get("/me", protect, getMe);

// Mettre à jour le mot de passe de l'utilisateur connecté
// Le middleware 'protect' vérifie l'identité de l'utilisateur
router.put("/updatepassword", protect, updatePassword);

module.exports = router;
