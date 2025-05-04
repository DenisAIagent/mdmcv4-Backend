const ChatbotConfig = require('../models/ChatbotConfig');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require("../middleware/asyncHandler");
const crypto = require('crypto');

// @desc    Obtenir la configuration du chatbot
// @route   GET /api/chatbot/config
// @access  Private/Admin
exports.getConfig = asyncHandler(async (req, res, next) => {
  let config = await ChatbotConfig.findOne();
  
  if (!config) {
    // Créer une configuration par défaut si elle n'existe pas
    config = await ChatbotConfig.create({
      apiKey: process.env.GEMINI_API_KEY || '',
      contextData: {
        documentation: 'Documentation de base du panneau d\'administration MDMC'
      },
      documentationVersion: '1.0.0',
      active: true
    });
  }

  // Ne pas renvoyer la clé API dans la réponse
  const configResponse = {
    ...config.toObject(),
    apiKey: config.apiKey ? '••••••••••••••••' : ''
  };

  res.status(200).json({
    success: true,
    data: configResponse
  });
});

// @desc    Mettre à jour la configuration du chatbot
// @route   PUT /api/chatbot/config
// @access  Private/Admin
exports.updateConfig = asyncHandler(async (req, res, next) => {
  let config = await ChatbotConfig.findOne();
  
  if (!config) {
    // Créer une configuration si elle n'existe pas
    config = await ChatbotConfig.create({
      apiKey: req.body.apiKey || process.env.GEMINI_API_KEY || '',
      contextData: req.body.contextData || {},
      documentationVersion: req.body.documentationVersion || '1.0.0',
      active: req.body.hasOwnProperty('active') ? req.body.active : true
    });
  } else {
    // Mettre à jour la configuration existante
    if (req.body.apiKey) {
      config.apiKey = req.body.apiKey;
    }
    
    if (req.body.contextData) {
      config.contextData = req.body.contextData;
    }
    
    if (req.body.documentationVersion) {
      config.documentationVersion = req.body.documentationVersion;
    }
    
    if (req.body.hasOwnProperty('active')) {
      config.active = req.body.active;
    }
    
    config.updatedAt = Date.now();
    await config.save();
  }

  // Ne pas renvoyer la clé API dans la réponse
  const configResponse = {
    ...config.toObject(),
    apiKey: config.apiKey ? '••••••••••••••••' : ''
  };

  res.status(200).json({
    success: true,
    data: configResponse
  });
});

// @desc    Envoyer un message au chatbot
// @route   POST /api/chatbot/message
// @access  Private/Admin
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { message } = req.body;
  
  if (!message) {
    return next(new ErrorResponse('Veuillez fournir un message', 400));
  }
  
  const config = await ChatbotConfig.findOne().select('+apiKey');
  
  if (!config || !config.active) {
    return next(new ErrorResponse('Le chatbot n\'est pas configuré ou est désactivé', 400));
  }
  
  if (!config.apiKey) {
    return next(new ErrorResponse('Clé API Gemini non configurée', 400));
  }
  
  // Dans une implémentation réelle, nous ferions un appel à l'API Gemini ici
  // Pour cette démonstration, nous simulons une réponse
  
  // Simuler un délai de traitement
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Générer une réponse simulée basée sur le message
  let response;
  
  if (message.toLowerCase().includes('wordpress')) {
    response = "Pour connecter votre blog WordPress, accédez à la section 'Connecteur WordPress' dans le panneau d'administration. Vous devrez fournir l'URL de votre site WordPress, votre nom d'utilisateur et un mot de passe d'application. Vous pouvez générer un mot de passe d'application dans les paramètres de sécurité de votre compte WordPress.";
  } else if (message.toLowerCase().includes('google') || message.toLowerCase().includes('analytics') || message.toLowerCase().includes('gtm')) {
    response = "Pour configurer Google Analytics, GTM ou Google Ads, accédez à la section 'Intégrations Marketing' dans le panneau d'administration. Vous pourrez y entrer vos identifiants pour chaque service sans avoir à modifier le code.";
  } else if (message.toLowerCase().includes('landing') || message.toLowerCase().includes('page')) {
    response = "Le générateur de landing pages vous permet de créer facilement des pages d'atterrissage optimisées pour vos campagnes marketing. Accédez à la section 'Générateur de Landing Pages' dans le panneau d'administration pour commencer. Vous pouvez choisir parmi plusieurs templates, personnaliser le contenu et publier votre page en quelques clics.";
  } else if (message.toLowerCase().includes('pixel') || message.toLowerCase().includes('meta') || message.toLowerCase().includes('facebook') || message.toLowerCase().includes('tiktok')) {
    response = "Pour configurer le pixel Meta (Facebook) ou TikTok, accédez à la section 'Intégrations Marketing' dans le panneau d'administration. Vous pourrez y entrer vos identifiants pour chaque service sans avoir à modifier le code.";
  } else {
    response = "Je suis le chatbot d'assistance du panneau d'administration MDMC Music Ads. Je peux vous aider avec les intégrations marketing, le connecteur WordPress, le générateur de landing pages et d'autres fonctionnalités. N'hésitez pas à me poser des questions spécifiques sur ces sujets.";
  }

  res.status(200).json({
    success: true,
    data: {
      message: response,
      timestamp: Date.now()
    }
  });
});

// @desc    Obtenir la documentation
// @route   GET /api/chatbot/documentation
// @access  Private/Admin
exports.getDocumentation = asyncHandler(async (req, res, next) => {
  const config = await ChatbotConfig.findOne();
  
  if (!config) {
    return next(new ErrorResponse('Configuration du chatbot non trouvée', 404));
  }
  
  // Dans une implémentation réelle, nous récupérerions la documentation complète
  // Pour cette démonstration, nous renvoyons une documentation simplifiée
  
  const documentation = {
    version: config.documentationVersion,
    sections: [
      {
        title: "Intégrations Marketing",
        content: "Guide pour configurer Google Analytics, GTM, Google Ads, Meta Pixel et TikTok Pixel."
      },
      {
        title: "Connecteur WordPress",
        content: "Instructions pour connecter et synchroniser votre blog WordPress."
      },
      {
        title: "Générateur de Landing Pages",
        content: "Guide pour créer et publier des landing pages optimisées."
      },
      {
        title: "Authentification",
        content: "Informations sur la gestion des utilisateurs et des paramètres d'authentification."
      }
    ]
  };

  res.status(200).json({
    success: true,
    data: documentation
  });
});
