const MarketingIntegration = require('../models/MarketingIntegration');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Obtenir toutes les intégrations marketing
// @route   GET /api/marketing
// @access  Private/Admin
exports.getIntegrations = asyncHandler(async (req, res, next) => {
  const integrations = await MarketingIntegration.find();
  
  res.status(200).json({
    success: true,
    count: integrations.length,
    data: integrations
  });
});

// @desc    Obtenir une intégration marketing spécifique
// @route   GET /api/marketing/:id
// @access  Private/Admin
exports.getIntegration = asyncHandler(async (req, res, next) => {
  const integration = await MarketingIntegration.findById(req.params.id);

  if (!integration) {
    return next(
      new ErrorResponse(`Intégration non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: integration
  });
});

// @desc    Créer une intégration marketing
// @route   POST /api/marketing
// @access  Private/Admin
exports.createIntegration = asyncHandler(async (req, res, next) => {
  // Vérifier si une intégration de ce type existe déjà
  const existingIntegration = await MarketingIntegration.findOne({ type: req.body.type });
  
  if (existingIntegration) {
    return next(
      new ErrorResponse(`Une intégration de type ${req.body.type} existe déjà`, 400)
    );
  }

  const integration = await MarketingIntegration.create(req.body);

  res.status(201).json({
    success: true,
    data: integration
  });
});

// @desc    Mettre à jour une intégration marketing
// @route   PUT /api/marketing/:id
// @access  Private/Admin
exports.updateIntegration = asyncHandler(async (req, res, next) => {
  let integration = await MarketingIntegration.findById(req.params.id);

  if (!integration) {
    return next(
      new ErrorResponse(`Intégration non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  integration = await MarketingIntegration.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: integration
  });
});

// @desc    Supprimer une intégration marketing
// @route   DELETE /api/marketing/:id
// @access  Private/Admin
exports.deleteIntegration = asyncHandler(async (req, res, next) => {
  const integration = await MarketingIntegration.findById(req.params.id);

  if (!integration) {
    return next(
      new ErrorResponse(`Intégration non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  await integration.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Tester une intégration marketing
// @route   POST /api/marketing/:id/test
// @access  Private/Admin
exports.testIntegration = asyncHandler(async (req, res, next) => {
  const integration = await MarketingIntegration.findById(req.params.id);

  if (!integration) {
    return next(
      new ErrorResponse(`Intégration non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  // Simuler un test d'intégration
  // Dans une implémentation réelle, cela pourrait faire une requête à l'API correspondante
  const testResult = {
    success: true,
    type: integration.type,
    message: `Test réussi pour l'intégration ${integration.type}`,
    timestamp: new Date()
  };

  res.status(200).json({
    success: true,
    data: testResult
  });
});
