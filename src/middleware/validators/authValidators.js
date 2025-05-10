const { body } = require('express-validator');

// Validation pour l'inscription
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Le nom ne doit contenir que des lettres, chiffres, espaces, tirets et underscores'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial'),

  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Le rôle doit être "user" ou "admin"')
];

// Validation pour la connexion
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Validation pour la mise à jour du mot de passe
exports.updatePasswordValidation = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),

  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('Le nouveau mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

// Validation pour la réinitialisation du mot de passe
exports.resetPasswordValidation = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Le mot de passe est requis')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

// Validation pour la demande de réinitialisation du mot de passe
exports.forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('L\'email est requis')
    .isEmail()
    .withMessage('Format d\'email invalide')
    .normalizeEmail()
]; 