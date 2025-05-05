// routes/user.routes.js (CORRIGÉ pour le dépôt mdmcv4-Backend)

const express = require('express');

// *** Assurez-vous que la correction est bien appliquée ici ***
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController'); // <--- VÉRIFIEZ/CORRIGEZ CE CHEMIN

const router = express.Router();

// Importer les middleware (Vérifiez que ce chemin est correct dans CE dépôt)
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation
router.use(protect);
router.use(authorize('admin'));

// --- Routes Utilisateurs ---
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
