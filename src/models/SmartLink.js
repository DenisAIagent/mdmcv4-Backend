<<<<<<< HEAD
// backend/models/SmartLink.js
const mongoose = require("mongoose");
const slugify = require("slugify"); // Assurez-vous que slugify est une dépendance : npm install slugify

const platformLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, "Le nom de la plateforme est requis."],
=======
// models/SmartLink.js

const mongoose = require('mongoose');
const slugify = require('slugify');

// Sous-schéma pour les liens vers les plateformes
const platformLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, 'Le nom de la plateforme est requis.'],
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
    trim: true
  },
  url: {
    type: String,
<<<<<<< HEAD
    required: [true, "L'URL de la plateforme est requise."],
    trim: true
    // match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Veuillez fournir une URL valide."]
  }
}, { _id: false });

const smartLinkSchema = new mongoose.Schema(
  {
    trackTitle: {
      type: String,
      required: [true, "Le titre de la musique est obligatoire."],
      trim: true,
      maxlength: [150, "Le titre ne peut pas dépasser 150 caractères."]
    },
    slug: {
      type: String,
      trim: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist",
      required: [true, "Une référence à l'artiste est obligatoire."],
=======
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
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
      index: true
    },
    releaseDate: {
      type: Date
    },
    coverImageUrl: {
      type: String,
<<<<<<< HEAD
      trim: true
=======
      required: [true, 'Une URL pour l\'image de couverture est obligatoire.'],
      trim: true
      // Ajouter validation URL si besoin
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
    },
    description: {
      type: String,
      trim: true,
<<<<<<< HEAD
      maxlength: [500, "La description ne peut pas dépasser 500 caractères."]
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
    viewCount: { // Ancien clickCount, pour les vues de la page SmartLink
      type: Number,
      default: 0
    },
    platformClickCount: { // Pour les clics sur les liens de plateforme spécifiques
      type: Number,
      default: 0
=======
      maxlength: [500, 'La description ne peut pas dépasser 500 caractères.']
    },
    platformLinks: [platformLinkSchema], // Tableau de liens
    trackingIds: { // IDs de suivi spécifiques au client/lien
      ga4Id: { type: String, trim: true },
      gtmId: { type: String, trim: true },
      metaPixelId: { type: String, trim: true },
      tiktokPixelId: { type: String, trim: true },
      googleAdsId: { type: String, trim: true }
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
<<<<<<< HEAD
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true, // Si obligatoire
    }
  },
  {
    timestamps: true
  }
);

smartLinkSchema.pre("save", function(next) {
  if ((this.isModified("trackTitle") || this.isNew) && this.trackTitle && !this.slug) {
    this.slug = slugify(this.trackTitle, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g
=======
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
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
    });
  }
  next();
});

<<<<<<< HEAD
smartLinkSchema.index({ artistId: 1, slug: 1 }, { unique: true, sparse: true });

const SmartLink = mongoose.model("SmartLink", smartLinkSchema);

module.exports = SmartLink;
=======
// Index composé pour unicité de trackSlug par artistId
smartLinkSchema.index({ artistId: 1, trackSlug: 1 }, { unique: true });

// Création et exportation du modèle sous le nom 'SmartLink'
const SmartLink = mongoose.model('SmartLink', smartLinkSchema); // Nom changé ici

module.exports = SmartLink; // Export changé ici
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
