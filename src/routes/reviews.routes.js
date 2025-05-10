<<<<<<< HEAD
// routes/reviews.routes.js (Middleware Réactivé pour PUT/DELETE)

const express = require("express");

=======
// ----- Code COMPLET et SÉCURISÉ pour routes/reviews.routes.js -----

const express = require('express');
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
const {
  createReview,
  getReviews,
  updateReviewStatus,
<<<<<<< HEAD
  deleteReview
} = require("../controllers/reviewsController.js"); // Chemin contrôleur OK

// Importation Middleware DÉCOMMENTÉE
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// --- Routes PUBLIQUES ---
// Laisser ces routes accessibles sans authentification/autorisation

router.route("/")
  .post(createReview) // Tout le monde peut poster un avis (il sera 'pending')
  .get(getReviews);   // Tout le monde peut lister les avis (le contrôleur filtre peut-être par statut 'approved' pour les non-admins)

// --- Routes PROTÉGÉES (Admin seulement) ---
// Appliquer le middleware uniquement à ces routes spécifiques

router.route("/:id")
  // Seul un admin connecté peut mettre à jour le statut (approuver/rejeter)
  .put(protect, authorize('admin'), updateReviewStatus)
  // Seul un admin connecté peut supprimer un avis
  .delete(protect, authorize('admin'), deleteReview);

module.exports = router;
=======
  deleteReview // <-- 1. Importer la fonction deleteReview
} = require('../controllers/reviews'); // Assurez-vous que ce chemin est correct

// 2. Importer vos middlewares d'authentification et d'autorisation
// !! Assurez-vous que le chemin vers 'auth.js' est correct et que les noms 'protect'
// !! et 'authorize' correspondent à vos fonctions middleware. Adaptez si besoin.
const { protect, authorize } = require('../middleware/auth');

// Crée une instance du routeur Express
const router = express.Router();

// Définit les routes relatives au chemin de base (par exemple /api/reviews)

// Routes pour la racine ('/') :
router.route('/')
  .post(createReview) // POST /api/reviews (Public pour créer un avis)
  .get(getReviews);    // GET /api/reviews (Public pour lire les avis, potentiellement filtrés par statut)
                      // Note: Si la lecture des avis 'pending'/'rejected' doit être réservée aux admins,
                      // la logique de contrôle d'accès serait plutôt dans le controller getReviews
                      // ou en ajoutant un middleware ici si TOUS les GET nécessitent une authentification.

// Routes pour les opérations sur un avis spécifique via son ID ('/:id') :
// Ces opérations (mise à jour de statut, suppression) sont réservées aux administrateurs.
router.route('/:id')
  // 3. SÉCURISER la route PUT existante avec protect et authorize
  .put(protect, authorize('admin'), updateReviewStatus) // PUT /api/reviews/:id (Admin seulement)
  // 4. AJOUTER la route DELETE et la SÉCURISER de la même manière
  .delete(protect, authorize('admin'), deleteReview); // DELETE /api/reviews/:id (Admin seulement)

// Exporte le routeur pour qu'il puisse être utilisé dans votre fichier principal (app.js ou server.js)
module.exports = router;

// ----- Fin du code COMPLET et SÉCURISÉ -----
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
