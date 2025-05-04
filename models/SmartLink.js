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
    // match: [/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/, 'Veuillez fournir une URL valide.'] // Validation optionnelle
  }
}, { _id: false });

// Schéma principal pour le SmartLink (anciennement LandingPage pour la musique)
const smartLinkSchema = new mongoose.Schema( // Renommé ici
  {
    trackTitle: {
      type: String,
      required: [true, 'Le titre de la musique (track title) est obligatoire.'],
      trim: true,
      maxlength: [150, 'Le titre ne peut pas dépasser 150 caractères.']
    },
    trackSlug: {
      type: String
      // Généré automatiquement, unicité via index composé
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist', // Référence au modèle Artist
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
      // Ajouter validation URL si besoin
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères.']
    },
    platformLinks: [platformLinkSchema], // Tableau de liens
    trackingIds: { // IDs de suivi spécifiques au client/lien
      ga4Id: { type: String, trim: true },
      gtmId: { type: String, trim: true },
      metaPixelId: { type: String, trim: true },
      tiktokPixelId: { type: String, trim: true },
      googleAdsId: { type: String, trim: true }
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true // Ajoute createdAt et updatedAt
  }
);

// Middleware pre-save pour générer le trackSlug
smartLinkSchema.pre('save', function(next) {
  if (this.isModified('trackTitle') || this.isNew) {
    this.trackSlug = slugify(this.trackTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Index composé pour unicité de trackSlug par artistId
smartLinkSchema.index({ artistId: 1, trackSlug: 1 }, { unique: true });

// Création et exportation du modèle sous le nom 'SmartLink'
const SmartLink = mongoose.model('SmartLink', smartLinkSchema); // Nom changé ici

module.exports = SmartLink; // Export changé ici