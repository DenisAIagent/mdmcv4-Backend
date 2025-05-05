// routes/user.routes.js (Nettoyé et Sécurisé)

const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require("../controllers/users"); // Assurez-vous que ce chemin est correct

const router = express.Router();

// --- IMPORTANT : Middleware de Sécurité ---
// Le middleware est maintenant réactivé.
// Assurez-vous que le fichier '../middleware/auth.js' existe et exporte
// correctement les fonctions 'protect' et 'authorize'.
// Si ce fichier manque ou contient des erreurs, le serveur backend PLANTERA au démarrage.
const { protect, authorize } = require("../middleware/auth");

// Appliquer la protection à toutes les routes de ce fichier
// 'protect' vérifie si l'utilisateur est connecté (token JWT valide)
// 'authorize('admin')' vérifie si l'utilisateur connecté a le rôle 'admin'
router.use(protect);
router.use(authorize("admin"));

// --- Routes Utilisateurs (maintenant protégées) ---

// Route pour la racine (/api/users/ ou /api/v1/users/ selon votre app.js)
router.route("/")
  .get(getUsers)   // Seuls les admins peuvent lister les utilisateurs
  .post(createUser); // Seuls les admins peuvent créer des utilisateurs

// Route pour un ID spécifique (/api/users/:id ou /api/v1/users/:id)
router.route("/:id")
  .get(getUser)      // Seuls les admins peuvent voir un utilisateur spécifique
  .put(updateUser)   // Seuls les admins peuvent mettre à jour un utilisateur
  .delete(deleteUser); // Seuls les admins peuvent supprimer un utilisateur

module.exports = router;
