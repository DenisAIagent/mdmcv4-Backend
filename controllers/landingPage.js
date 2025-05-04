const LandingPage = require('../models/LandingPage');
const LandingPageTemplate = require('../models/LandingPageTemplate');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require("../middleware/asyncHandler");

// @desc    Obtenir tous les templates de landing page
// @route   GET /api/landing-pages/templates
// @access  Private/Admin
exports.getTemplates = asyncHandler(async (req, res, next) => {
  const templates = await LandingPageTemplate.find();
  
  res.status(200).json({
    success: true,
    count: templates.length,
    data: templates
  });
});

// @desc    Obtenir un template de landing page spécifique
// @route   GET /api/landing-pages/templates/:id
// @access  Private/Admin
exports.getTemplate = asyncHandler(async (req, res, next) => {
  const template = await LandingPageTemplate.findById(req.params.id);

  if (!template) {
    return next(
      new ErrorResponse(`Template non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: template
  });
});

// @desc    Obtenir toutes les landing pages
// @route   GET /api/landing-pages
// @access  Private/Admin
exports.getLandingPages = asyncHandler(async (req, res, next) => {
  const landingPages = await LandingPage.find();
  
  res.status(200).json({
    success: true,
    count: landingPages.length,
    data: landingPages
  });
});

// @desc    Obtenir une landing page spécifique
// @route   GET /api/landing-pages/:id
// @access  Private/Admin
exports.getLandingPage = asyncHandler(async (req, res, next) => {
  const landingPage = await LandingPage.findById(req.params.id);

  if (!landingPage) {
    return next(
      new ErrorResponse(`Landing page non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: landingPage
  });
});

// @desc    Créer une landing page
// @route   POST /api/landing-pages
// @access  Private/Admin
exports.createLandingPage = asyncHandler(async (req, res, next) => {
  // Vérifier si le template existe
  const template = await LandingPageTemplate.findById(req.body.template);
  
  if (!template) {
    return next(
      new ErrorResponse(`Template non trouvé avec l'id ${req.body.template}`, 404)
    );
  }
  
  // Vérifier si le slug est unique
  const existingPage = await LandingPage.findOne({ slug: req.body.slug });
  
  if (existingPage) {
    return next(
      new ErrorResponse(`Une landing page avec le slug '${req.body.slug}' existe déjà`, 400)
    );
  }

  const landingPage = await LandingPage.create(req.body);

  res.status(201).json({
    success: true,
    data: landingPage
  });
});

// @desc    Mettre à jour une landing page
// @route   PUT /api/landing-pages/:id
// @access  Private/Admin
exports.updateLandingPage = asyncHandler(async (req, res, next) => {
  let landingPage = await LandingPage.findById(req.params.id);

  if (!landingPage) {
    return next(
      new ErrorResponse(`Landing page non trouvée avec l'id ${req.params.id}`, 404)
    );
  }
  
  // Si le slug est modifié, vérifier qu'il est unique
  if (req.body.slug && req.body.slug !== landingPage.slug) {
    const existingPage = await LandingPage.findOne({ slug: req.body.slug });
    
    if (existingPage) {
      return next(
        new ErrorResponse(`Une landing page avec le slug '${req.body.slug}' existe déjà`, 400)
      );
    }
  }

  landingPage = await LandingPage.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: landingPage
  });
});

// @desc    Publier une landing page
// @route   POST /api/landing-pages/:id/publish
// @access  Private/Admin
exports.publishLandingPage = asyncHandler(async (req, res, next) => {
  let landingPage = await LandingPage.findById(req.params.id);

  if (!landingPage) {
    return next(
      new ErrorResponse(`Landing page non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  landingPage.status = 'published';
  landingPage.publishedAt = Date.now();
  await landingPage.save();

  res.status(200).json({
    success: true,
    data: landingPage
  });
});

// @desc    Dépublier une landing page
// @route   POST /api/landing-pages/:id/unpublish
// @access  Private/Admin
exports.unpublishLandingPage = asyncHandler(async (req, res, next) => {
  let landingPage = await LandingPage.findById(req.params.id);

  if (!landingPage) {
    return next(
      new ErrorResponse(`Landing page non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  landingPage.status = 'draft';
  await landingPage.save();

  res.status(200).json({
    success: true,
    data: landingPage
  });
});

// @desc    Supprimer une landing page
// @route   DELETE /api/landing-pages/:id
// @access  Private/Admin
exports.deleteLandingPage = asyncHandler(async (req, res, next) => {
  const landingPage = await LandingPage.findById(req.params.id);

  if (!landingPage) {
    return next(
      new ErrorResponse(`Landing page non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  await landingPage.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Prévisualiser une landing page
// @route   GET /api/landing-pages/:id/preview
// @access  Private/Admin
exports.previewLandingPage = asyncHandler(async (req, res, next) => {
  const landingPage = await LandingPage.findById(req.params.id);

  if (!landingPage) {
    return next(
      new ErrorResponse(`Landing page non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  // Dans une implémentation réelle, on pourrait générer un HTML complet ici
  // Pour cette démonstration, on renvoie simplement les données
  
  res.status(200).json({
    success: true,
    data: {
      ...landingPage.toObject(),
      previewMode: true
    }
  });
});
