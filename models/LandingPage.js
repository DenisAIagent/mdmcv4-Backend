const mongoose = require('mongoose');

const LandingPageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Veuillez fournir un titre'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Veuillez fournir un slug'],
    unique: true,
    trim: true
  },
  template: {
    type: String,
    required: [true, 'Veuillez sélectionner un template']
  },
  sections: {
    type: Array,
    default: []
  },
  styles: {
    type: Object,
    default: {}
  },
  seo: {
    type: Object,
    default: {
      title: '',
      description: '',
      keywords: ''
    }
  },
  marketingPixels: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: {
    type: Date,
    default: null
  }
});

// Middleware pour mettre à jour la date de modification
LandingPageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Mettre à jour publishedAt si le statut passe à published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  next();
});

module.exports = mongoose.model('LandingPage', LandingPageSchema);
