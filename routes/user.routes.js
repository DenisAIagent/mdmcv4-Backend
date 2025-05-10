<<<<<<< HEAD
// routes/user.routes.js (CORRIGÉ pour le dépôt mdmcv4-Backend)

const express = require('express');

// *** Assurez-vous que la correction est bien appliquée ici ***
=======
const express = require('express');
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
<<<<<<< HEAD
} = require('../controllers/userController'); // <--- VÉRIFIEZ/CORRIGEZ CE CHEMIN

const router = express.Router();

// Importer les middleware (Vérifiez que ce chemin est correct dans CE dépôt)
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation
router.use(protect);
router.use(authorize('admin'));

// --- Routes Utilisateurs ---
=======
} = require('../controllers/users');

const router = express.Router();

// Importer les middleware de protection et d'autorisation
const { protect, authorize } = require('../middleware/auth');

// Appliquer la protection et l'autorisation à toutes les routes
router.use(protect);
router.use(authorize('admin'));

// Routes utilisateurs (réservées aux administrateurs)
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
