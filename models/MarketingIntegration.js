const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MarketingIntegrationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Veuillez spécifier le type d\'intégration'],
    enum: ['google_analytics', 'gtm', 'google_ads', 'meta_pixel', 'tiktok_pixel'],
  },
  accountId: {
    type: String,
    required: [true, 'Veuillez fournir un identifiant de compte'],
    trim: true
  },
  trackingId: {
    type: String,
    required: [true, 'Veuillez fournir un identifiant de suivi'],
    trim: true
  },
  active: {
    type: Boolean,
    default: true
  },
  configuration: {
    type: Object,
    default: {}
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
MarketingIntegrationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('MarketingIntegration', MarketingIntegrationSchema);
