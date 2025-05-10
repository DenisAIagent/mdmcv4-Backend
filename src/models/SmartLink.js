// models/SmartLink.js

const mongoose = require('mongoose');
const slugify = require('slugify');

// Sous-schéma pour les liens vers les plateformes
const platformLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, 'Le nom de la plateforme est requis.'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'L\'URL de la plateforme est requise.'],
    trim: true
  }
}, { _id: false });

// Schéma principal pour le SmartLink
const smartLinkSchema = new mongoose.Schema({
  trackTitle: {
    type: String,
    required: [true, 'Le titre de la musique est obligatoire.'],
    trim: true,
    maxlength: [150, 'Le titre ne peut pas dépasser 150 caractères.']
  },
  slug: {
    type: String,
    trim: true
  },
  artistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'Une référence à l\'artiste est obligatoire.'],
    index: true
  },
  releaseDate: {
    type: Date
  },
  coverImageUrl: {
    type: String,
    required: [true, 'Une URL pour l\'image de couverture est obligatoire.'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères.']
  },
  platformLinks: {
    type: [platformLinkSchema],
    validate: [
      {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0 && value.every(link => link.platform && link.url);
        },
        message: 'Au moins un lien de plateforme complet (avec nom et URL) est requis.',
      },
    ],
  },
  trackingIds: {
    ga4Id: { type: String, trim: true, sparse: true },
    gtmId: { type: String, trim: true, sparse: true },
    metaPixelId: { type: String, trim: true, sparse: true },
    tiktokPixelId: { type: String, trim: true, sparse: true },
    googleAdsId: { type: String, trim: true, sparse: true }
  },
  viewCount: {
    type: Number,
    default: 0
  },
  platformClickCount: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Middleware pre-save pour générer le slug
smartLinkSchema.pre('save', function(next) {
  if (this.isModified('trackTitle') || this.isNew) {
    this.slug = slugify(this.trackTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@#%$^&={}|[\]\\;/?]/g
    });
  }
  next();
});

// Index composé pour unicité de slug par artistId
smartLinkSchema.index({ artistId: 1, slug: 1 }, { unique: true });

const SmartLink = mongoose.model('SmartLink', smartLinkSchema);

module.exports = SmartLink;
