const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez fournir un nom'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez fournir un email'],
    unique: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Veuillez fournir un email valide'
    ],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailConfirmed: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  confirmEmailToken: String,
  confirmEmailExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Encrypter le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Générer et hasher le token de confirmation d'email
UserSchema.methods.getConfirmEmailToken = function() {
  // Générer le token
  const confirmToken = crypto.randomBytes(20).toString('hex');

  // Hasher le token et le définir sur confirmEmailToken
  this.confirmEmailToken = crypto
    .createHash('sha256')
    .update(confirmToken)
    .digest('hex');

  // Définir l'expiration
  this.confirmEmailExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 heures

  return confirmToken;
};

// Générer et hasher le token de réinitialisation de mot de passe
UserSchema.methods.getResetPasswordToken = function() {
  // Générer le token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hasher le token et le définir sur resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Définir l'expiration
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Méthode pour mettre à jour la date de dernière connexion
UserSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  await this.save({ validateBeforeSave: false });
};

// Méthode pour désactiver le compte
UserSchema.methods.deactivateAccount = async function() {
  this.isActive = false;
  await this.save({ validateBeforeSave: false });
};

// Méthode pour réactiver le compte
UserSchema.methods.reactivateAccount = async function() {
  this.isActive = true;
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', UserSchema);
