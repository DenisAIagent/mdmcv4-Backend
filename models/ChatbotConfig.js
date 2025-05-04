const mongoose = require('mongoose');

const ChatbotConfigSchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: [true, 'Veuillez fournir une clé API Gemini'],
    select: false
  },
  contextData: {
    type: Object,
    default: {}
  },
  documentationVersion: {
    type: String,
    default: '1.0.0'
  },
  active: {
    type: Boolean,
    default: true
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
ChatbotConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ChatbotConfig', ChatbotConfigSchema);
