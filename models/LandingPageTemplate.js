const mongoose = require('mongoose');

const LandingPageTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez fournir un nom de template'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Veuillez fournir une description'],
    trim: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  sections: {
    type: Array,
    default: []
  },
  defaultStyles: {
    type: Object,
    default: {}
  },
  category: {
    type: String,
    required: [true, 'Veuillez fournir une catégorie'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LandingPageTemplate', LandingPageTemplateSchema);
