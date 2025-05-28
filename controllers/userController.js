const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Obtenir un utilisateur spécifique
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`Utilisateur non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Créer un utilisateur
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Mettre à jour un utilisateur
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(
      new ErrorResponse(`Utilisateur non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`Utilisateur non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  await user.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
