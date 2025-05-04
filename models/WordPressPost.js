const mongoose = require('mongoose');

const WordPressPostSchema = new mongoose.Schema({
  wpId: {
    type: Number,
    required: [true, 'Veuillez fournir l\'ID WordPress du post'],
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Veuillez fournir un titre'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Veuillez fournir un contenu']
  },
  excerpt: {
    type: String,
    default: ''
  },
  slug: {
    type: String,
    required: [true, 'Veuillez fournir un slug'],
    trim: true
  },
  featuredImage: {
    type: String,
    default: null
  },
  categories: {
    type: Array,
    default: []
  },
  tags: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['publish', 'draft', 'pending', 'private'],
    default: 'publish'
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WordPressPost', WordPressPostSchema);
