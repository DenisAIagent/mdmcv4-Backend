const mongoose = require('mongoose');

const ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom d\'artiste'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  biography: {
    type: String,
    maxlength: [2000, 'La biographie ne peut pas dépasser 2000 caractères']
  },
  image: {
    type: String,
    default: 'default-artist.jpg'
  },
  socialLinks: {
    spotify: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Veuillez utiliser une URL valide'
      ]
    },
    instagram: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Veuillez utiliser une URL valide'
      ]
    },
    twitter: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Veuillez utiliser une URL valide'
      ]
    },
    facebook: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Veuillez utiliser une URL valide'
      ]
    },
    youtube: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Veuillez utiliser une URL valide'
      ]
    }
  },
  slug: {
    type: String,
    required: [true, 'Veuillez spécifier un slug'],
    unique: true,
    trim: true,
    maxlength: [100, 'Le slug ne peut pas dépasser 100 caractères']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Veuillez spécifier un utilisateur']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour le champ updatedAt avant la sauvegarde
ArtistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Middleware pour cascade delete les SmartLinks associés à l'artiste
ArtistSchema.pre('remove', async function(next) {
  await this.model('SmartLink').deleteMany({ artist: this._id });
  next();
});

module.exports = mongoose.model('Artist', ArtistSchema);
