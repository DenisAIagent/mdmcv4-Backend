const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma pour le modèle Artist
 */
const ArtistSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  bio: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  socialLinks: {
    instagram: String,
    twitter: String,
    facebook: String,
    youtube: String,
    spotify: String,
    appleMusic: String,
    website: String
  },
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

const Artist = mongoose.model('Artist', ArtistSchema);

module.exports = Artist;
