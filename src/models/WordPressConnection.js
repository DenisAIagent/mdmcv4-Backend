const mongoose = require('mongoose');
const crypto = require('crypto');

const WordPressConnectionSchema = new mongoose.Schema({
  siteUrl: {
    type: String,
    required: [true, 'Veuillez fournir l\'URL du site WordPress'],
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Veuillez fournir un nom d\'utilisateur WordPress'],
    trim: true
  },
  applicationPassword: {
    type: String,
    required: [true, 'Veuillez fournir un mot de passe d\'application'],
    select: false
  },
  lastSync: {
    type: Date,
    default: null
  },
  syncFrequency: {
    type: String,
    enum: ['manual', 'daily', 'weekly'],
    default: 'manual'
  },
  categories: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour la date de modification
WordPressConnectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WordPressConnection', WordPressConnectionSchema);
