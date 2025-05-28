const mongoose = require('mongoose');

const SmartLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Veuillez ajouter un titre'],
    trim: true,
    maxlength: [100, 'Le titre ne peut pas dépasser 100 caractères']
  },
  artist: {
    type: mongoose.Schema.ObjectId,
    ref: 'Artist',
    required: [true, 'Veuillez spécifier un artiste']
  },
  coverImage: {
    type: String,
    required: [true, 'Veuillez ajouter une image de couverture']
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  platforms: [
    {
      name: {
        type: String,
        required: [true, 'Veuillez spécifier le nom de la plateforme'],
        enum: ['Spotify', 'Apple Music', 'Deezer', 'YouTube Music', 'Amazon Music', 'Tidal', 'SoundCloud', 'Bandcamp']
      },
      url: {
        type: String,
        required: [true, 'Veuillez spécifier l\'URL de la plateforme'],
        match: [
          /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
          'Veuillez utiliser une URL valide'
        ]
      },
      utmSource: {
        type: String,
        default: ''
      },
      utmMedium: {
        type: String,
        default: ''
      },
      utmCampaign: {
        type: String,
        default: ''
      }
    }
  ],
  isPublished: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    required: [true, 'Veuillez spécifier un slug'],
    unique: true,
    trim: true,
    maxlength: [100, 'Le slug ne peut pas dépasser 100 caractères']
  },
  type: {
    type: String,
    required: [true, 'Veuillez spécifier le type de sortie'],
    enum: ['single', 'ep', 'album']
  },
  clicks: {
    type: Number,
    default: 0
  },
  analytics: [
    {
      platform: {
        type: String,
        required: true
      },
      clicks: {
        type: Number,
        default: 0
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Veuillez spécifier un utilisateur']
  }
});

// Middleware pour mettre à jour le champ updatedAt avant la sauvegarde
SmartLinkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour incrémenter le compteur de clics
SmartLinkSchema.methods.incrementClicks = async function(platform) {
  this.clicks += 1;
  
  // Si une plateforme est spécifiée, incrémenter les clics pour cette plateforme
  if (platform) {
    const platformAnalytics = this.analytics.find(
      item => item.platform === platform
    );
    
    if (platformAnalytics) {
      platformAnalytics.clicks += 1;
    } else {
      this.analytics.push({
        platform,
        clicks: 1,
        date: Date.now()
      });
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('SmartLink', SmartLinkSchema);
