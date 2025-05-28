const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez ajouter un email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez ajouter un email valide'
    ]
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Veuillez ajouter un mot de passe'],
    minlength: [6, 'Le mot de passe doit faire au moins 6 caractères'],
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Crypter le mot de passe avant la sauvegarde
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Signer le JWT et le retourner
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Signer le refresh token et le retourner
UserSchema.methods.getSignedRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
};

// Vérifier si le mot de passe correspond
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
