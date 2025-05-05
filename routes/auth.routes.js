// routes/auth.routes.js (Nettoyé et Sécurisé)

const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword
} = require("../controllers/auth"); // Assurez-vous que ce chemin est correct

const router = express.Router();

// --- IMPORTANT : Middleware de Sécurité ---
// Le middleware 'protect' est maintenant réactivé pour certaines routes.
// Assurez-vous que le fichier '../middleware/auth.js' existe et exporte
// correctement la fonction 'protect'.
// Si ce fichier manque ou contient des erreurs, le serveur backend PLANTERA au démarrage.
const { protect } = require("../middleware/auth");

// --- Routes Publiques ---
// Ces routes ne nécessitent pas d'être connecté
router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", resetPassword);

// --- Routes Protégées ---
// Ces routes nécessitent un utilisateur connecté (token JWT valide)

// Appliquer le middleware 'protect' spécifiquement à ces routes :
router.get("/logout", protect, logout); // Nécessite d'être connecté pour se déconnecter
router.get("/me", protect, getMe); // Nécessite d'être connecté pour obtenir ses propres infos
router.put("/updatepassword", protect, updatePassword); // Nécessite d'être connecté pour changer son mdp

module.exports = router;
