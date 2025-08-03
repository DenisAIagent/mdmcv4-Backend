// backend/models/ShortLink.js
const mongoose = require("mongoose");

const shortLinkSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: [true, "Le code court est obligatoire."],
      unique: true,
      trim: true,
      maxlength: [10, "Le code court ne peut pas dépasser 10 caractères."],
      index: true
    },
    smartLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SmartLink",
      required: [true, "Une référence au SmartLink est obligatoire."],
      index: true
    },
    clickCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null // null = pas d'expiration
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    lastAccessedAt: {
      type: Date,
      default: null
    },
    // Statistiques d'accès
    accessStats: {
      totalClicks: { type: Number, default: 0 },
      uniqueVisitors: { type: Number, default: 0 },
      countries: { type: Map, of: Number, default: new Map() },
      referrers: { type: Map, of: Number, default: new Map() },
      devices: { type: Map, of: Number, default: new Map() }
    }
  },
  {
    timestamps: true
  }
);

// Index composé pour optimiser les requêtes
shortLinkSchema.index({ shortCode: 1, isActive: 1 });
shortLinkSchema.index({ smartLinkId: 1, isActive: 1 });

// Méthode pour générer un code court unique
shortLinkSchema.statics.generateShortCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let shortCode;
  let exists = true;
  
  // Générer jusqu'à trouver un code unique
  while (exists) {
    shortCode = '';
    for (let i = 0; i < 6; i++) {
      shortCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const existing = await this.findOne({ shortCode });
    exists = !!existing;
  }
  
  return shortCode;
};

// Méthode pour incrémenter les clics
shortLinkSchema.methods.incrementClick = async function(clientInfo = {}) {
  this.clickCount += 1;
  this.lastAccessedAt = new Date();
  
  // Incrémenter les stats détaillées
  if (!this.accessStats) {
    this.accessStats = {
      totalClicks: 0,
      uniqueVisitors: 0,
      countries: new Map(),
      referrers: new Map(),
      devices: new Map()
    };
  }
  
  this.accessStats.totalClicks = (this.accessStats.totalClicks || 0) + 1;
  
  // Tracking par pays
  if (clientInfo.country) {
    const countryCount = this.accessStats.countries.get(clientInfo.country) || 0;
    this.accessStats.countries.set(clientInfo.country, countryCount + 1);
  }
  
  // Tracking par referrer
  if (clientInfo.referrer) {
    const referrerCount = this.accessStats.referrers.get(clientInfo.referrer) || 0;
    this.accessStats.referrers.set(clientInfo.referrer, referrerCount + 1);
  }
  
  // Tracking par device
  if (clientInfo.device) {
    const deviceCount = this.accessStats.devices.get(clientInfo.device) || 0;
    this.accessStats.devices.set(clientInfo.device, deviceCount + 1);
  }
  
  await this.save({ validateBeforeSave: false });
  return this;
};

const ShortLink = mongoose.model("ShortLink", shortLinkSchema);

module.exports = ShortLink;