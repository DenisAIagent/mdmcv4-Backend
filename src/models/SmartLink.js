const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma pour le modèle SmartLink
 */
const SmartLinkSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  platforms: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
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

const SmartLink = mongoose.model('SmartLink', SmartLinkSchema);

module.exports = SmartLink;
