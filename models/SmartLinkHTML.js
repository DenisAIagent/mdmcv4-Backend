// models/SmartLinkHTML.js
// Modèle optimisé pour l'architecture HTML simplifiée

const mongoose = require("mongoose");
const slugify = require("slugify");

const smartLinkHTMLSchema = new mongoose.Schema(
  {
    // 🎯 Identifiants uniques
    slug: {
      type: String,
      required: [true, "Le slug est obligatoire"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres, chiffres et tirets"]
    },
    artistSlug: {
      type: String,
      required: [true, "Le slug artiste est obligatoire"],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Le slug artiste ne peut contenir que des lettres, chiffres et tirets"]
    },
    trackSlug: {
      type: String,
      required: [true, "Le slug track est obligatoire"],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, "Le slug track ne peut contenir que des lettres, chiffres et tirets"]
    },
    
    // 🎵 Métadonnées musicales
    artist: {
      type: String,
      required: [true, "Le nom d'artiste est obligatoire"],
      trim: true,
      maxlength: [100, "Le nom d'artiste ne peut pas dépasser 100 caractères"]
    },
    title: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
      maxlength: [150, "Le titre ne peut pas dépasser 150 caractères"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "La description ne peut pas dépasser 300 caractères"],
      default: function() {
        return `Écoutez ${this.title} de ${this.artist} sur toutes les plateformes de streaming`;
      }
    },
    imageUrl: {
      type: String,
      required: [true, "L'URL de l'image est obligatoire"],
      trim: true,
      match: [/^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i, "L'URL de l'image doit être valide"]
    },
    releaseDate: {
      type: Date
    },
    
    // 🔗 Liens vers plateformes
    spotifyUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/open\.spotify\.com\/.+/, "URL Spotify invalide"]
    },
    appleUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/music\.apple\.com\/.+/, "URL Apple Music invalide"]
    },
    youtubeUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/, "URL YouTube invalide"]
    },
    deezerUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/www\.deezer\.com\/.+/, "URL Deezer invalide"]
    },
    amazonUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/music\.amazon\..+/, "URL Amazon Music invalide"]
    },
    tidalUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/tidal\.com\/.+/, "URL Tidal invalide"]
    },
    soundcloudUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/soundcloud\.com\/.+/, "URL SoundCloud invalide"]
    },
    bandcampUrl: {
      type: String,
      trim: true,
      match: [/^https:\/\/.+\.bandcamp\.com\/.+/, "URL Bandcamp invalide"]
    },
    
    // 📊 Analytics et tracking
    trackingIds: {
      ga4Id: { type: String, trim: true },
      gtmId: { type: String, trim: true },
      metaPixelId: { type: String, trim: true },
      tiktokPixelId: { type: String, trim: true },
      googleAdsId: { type: String, trim: true }
    },
    
    // 📈 Statistiques
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0
    },
    platformClicks: {
      spotify: { type: Number, default: 0 },
      apple: { type: Number, default: 0 },
      youtube: { type: Number, default: 0 },
      deezer: { type: Number, default: 0 },
      amazon: { type: Number, default: 0 },
      tidal: { type: Number, default: 0 },
      soundcloud: { type: Number, default: 0 },
      bandcamp: { type: Number, default: 0 }
    },
    
    // 🚀 Statut et métadonnées
    isPublished: {
      type: Boolean,
      default: true
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: [60, "Le titre SEO ne peut pas dépasser 60 caractères"]
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: [160, "La description SEO ne peut pas dépasser 160 caractères"]
    },
    
    // 🎨 Personnalisation (optionnel)
    primaryColor: {
      type: String,
      default: "#FF6B35",
      match: [/^#[0-9A-F]{6}$/i, "Couleur hex invalide"]
    },
    template: {
      type: String,
      enum: ["default", "minimal", "dark", "gradient"],
      default: "default"
    },
    
    // 👤 Créateur
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// 🔄 Middleware pour génération automatique des slugs
smartLinkHTMLSchema.pre("save", function(next) {
  if (this.isNew || this.isModified("artist") || this.isModified("title")) {
    // Générer artistSlug
    this.artistSlug = slugify(this.artist, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g
    });
    
    // Générer trackSlug
    this.trackSlug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g
    });
    
    // Générer slug principal (artist/track)
    this.slug = `${this.artistSlug}/${this.trackSlug}`;
  }
  
  // Générer seoTitle et seoDescription si vides
  if (!this.seoTitle) {
    this.seoTitle = `${this.title} - ${this.artist} | MDMC SmartLink`;
  }
  if (!this.seoDescription) {
    this.seoDescription = `Écoutez ${this.title} de ${this.artist} sur Spotify, Apple Music, YouTube et toutes les plateformes de streaming.`;
  }
  
  next();
});

// 📊 Méthodes utilitaires
smartLinkHTMLSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

smartLinkHTMLSchema.methods.incrementClick = function(platform) {
  this.clickCount += 1;
  if (platform && this.platformClicks[platform] !== undefined) {
    this.platformClicks[platform] += 1;
  }
  return this.save();
};

smartLinkHTMLSchema.methods.getAvailablePlatforms = function() {
  const platforms = [];
  if (this.spotifyUrl) platforms.push({ name: 'Spotify', url: this.spotifyUrl, icon: 'spotify' });
  if (this.appleUrl) platforms.push({ name: 'Apple Music', url: this.appleUrl, icon: 'apple' });
  if (this.youtubeUrl) platforms.push({ name: 'YouTube Music', url: this.youtubeUrl, icon: 'youtube' });
  if (this.deezerUrl) platforms.push({ name: 'Deezer', url: this.deezerUrl, icon: 'deezer' });
  if (this.amazonUrl) platforms.push({ name: 'Amazon Music', url: this.amazonUrl, icon: 'amazon' });
  if (this.tidalUrl) platforms.push({ name: 'Tidal', url: this.tidalUrl, icon: 'tidal' });
  if (this.soundcloudUrl) platforms.push({ name: 'SoundCloud', url: this.soundcloudUrl, icon: 'soundcloud' });
  if (this.bandcampUrl) platforms.push({ name: 'Bandcamp', url: this.bandcampUrl, icon: 'bandcamp' });
  return platforms;
};

// 🔍 Index pour optimiser les recherches
smartLinkHTMLSchema.index({ slug: 1 }, { unique: true });
smartLinkHTMLSchema.index({ artistSlug: 1, trackSlug: 1 });
smartLinkHTMLSchema.index({ isPublished: 1 });
smartLinkHTMLSchema.index({ createdAt: -1 });

const SmartLinkHTML = mongoose.model("SmartLinkHTML", smartLinkHTMLSchema);

module.exports = SmartLinkHTML;