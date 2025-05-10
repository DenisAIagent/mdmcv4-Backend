// ----- Début du code COMPLET pour controllers/reviews.js (BACKEND) -----

const Review = require('../models/Review'); // Importer le modèle Mongoose
const asyncHandler = require("../middleware/asyncHandler"); // Ton middleware pour gérer les erreurs async
const ErrorResponse = require('../utils/errorResponse'); // Ton utilitaire pour formater les erreurs

// @desc    Créer un nouvel avis
// @route   POST /api/reviews (ou /api/v1/reviews selon ton préfixe)
// @access  Public
exports.createReview = asyncHandler(async (req, res, next) => {
  const reviewData = req.body;
  const review = await Review.create(reviewData);
  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Récupérer les avis (filtré par statut via req.query.status)
// @route   GET /api/reviews
// @access  Variable (Public par défaut, pourrait être restreint selon les filtres)
exports.getReviews = asyncHandler(async (req, res, next) => {
  let queryFilter = {};
  if (req.query.status) {
    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (allowedStatuses.includes(req.query.status)) {
      queryFilter.status = req.query.status;
      // Si seuls les admins peuvent voir 'pending' ou 'rejected',
      // il faudrait ajouter une vérification de rôle ici si la route GET n'est pas déjà protégée.
      // Exemple simple (nécessite que req.user soit peuplé par le middleware protect):
      // if ((req.query.status === 'pending' || req.query.status === 'rejected') && (!req.user || req.user.role !== 'admin')) {
      //   return next(new ErrorResponse(`Non autorisé à voir les avis avec le statut ${req.query.status}`, 403));
      // }
    } else {
      console.warn(`Statut invalide ignoré: ${req.query.status}`);
      // Optionnel: return next(new ErrorResponse(`Statut invalide: ${req.query.status}`, 400));
    }
  }
  // Optionnel : Si on veut que par défaut ça retourne seulement les 'approved' pour les non-admins ou public
  // if (!req.query.status && (!req.user || req.user.role !== 'admin')) {
  //   queryFilter.status = 'approved';
  // }

  console.log('Filtre appliqué pour getReviews:', queryFilter);
  const reviews = await Review.find(queryFilter).sort({ createdAt: -1 }); // Trie par date de création, plus récent d'abord

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Mettre à jour le statut d'un avis (approuver/rejeter)
// @route   PUT /api/reviews/:id
// @access  Privé/Admin (Nécessite middleware d'authentification et d'autorisation admin sur la route)
exports.updateReviewStatus = asyncHandler(async (req, res, next) => {
  const reviewId = req.params.id; // Récupère l'ID de l'avis depuis l'URL
  const { status } = req.body; // Récupère le nouveau statut ('approved' ou 'rejected') depuis le corps de la requête

  // 1. Valider le nouveau statut
  if (!status || !['approved', 'rejected'].includes(status)) {
    return next(new ErrorResponse(`Statut invalide fourni: ${status}. Doit être 'approved' ou 'rejected'.`, 400));
  }

  // 2. Trouver l'avis par ID
  let review = await Review.findById(reviewId);

  // 3. Gérer si l'avis n'est pas trouvé
  if (!review) {
    return next(new ErrorResponse(`Avis non trouvé avec l'ID ${reviewId}`, 404));
  }

  // 4. Mettre à jour le statut
  review.status = status;

  // 5. Sauvegarder l'avis mis à jour
  await review.save();

  // 6. Renvoyer une réponse de succès avec l'avis mis à jour
  console.log(`Statut de l'avis ${reviewId} mis à jour à: ${status}`);
  res.status(200).json({
    success: true,
    data: review // Renvoyer l'avis complet mis à jour
  });
});

// @desc    Supprimer un avis
// @route   DELETE /api/reviews/:id
// @access  Privé/Admin (Nécessite middleware d'authentification et d'autorisation admin sur la route)
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const reviewId = req.params.id; // Récupère l'ID de l'avis depuis l'URL

  // 1. Essayer de trouver et supprimer l'avis par ID
  const review = await Review.findByIdAndDelete(reviewId);

  // 2. Gérer si l'avis n'est pas trouvé
  if (!review) {
    // Si findByIdAndDelete ne trouve rien, il retourne null
    return next(new ErrorResponse(`Avis non trouvé avec l'ID ${reviewId}`, 404));
  }

  // 3. Renvoyer une réponse de succès
  console.log(`Avis ${reviewId} supprimé avec succès.`);
  res.status(200).json({
    success: true,
    data: {} // On renvoie un objet vide pour signifier la réussite de la suppression
             // Alternativement: res.status(204).send(); si le frontend gère bien l'absence de corps
  });
});

// ----- Fin du code COMPLET pour controllers/reviews.js (BACKEND) -----
