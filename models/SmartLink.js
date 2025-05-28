// backend/models/SmartLink.js
const mongoose = require("mongoose");
const slugify = require("slugify"); // Assurez-vous que slugify est une dépendance : npm install slugify

const platformLinkSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, "Le nom de la plateforme est requis."],
    trim: true
  },
  url: {
    type: String,
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
      index: true
    },
    releaseDate: {
      type: Date
    },
    coverImageUrl: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
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
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
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
    });
  }
  next();
});

smartLinkSchema.index({ artistId: 1, slug: 1 }, { unique: true, sparse: true });

const SmartLink = mongoose.model("SmartLink", smartLinkSchema);

module.exports = SmartLink;
