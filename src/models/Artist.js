// models/Artist.js

const mongoose = require('mongoose');
const slugify = require('slugify'); // Vous devrez installer cette dépendance : npm install slugify

const ArtistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom'],
    unique: true,
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  bio: {
    type: String,
    required: [true, 'Veuillez ajouter une biographie'],
    maxlength: [500, 'La biographie ne peut pas dépasser 500 caractères']
  },
  artistImageUrl: {
    type: String,
    default: 'no-photo.jpg'
  },
  websiteUrl: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_.~#?&/=]*)/,
      'Veuillez utiliser une URL valide avec HTTP ou HTTPS'
    ]
  },
  socialLinks: {
    spotify: String,
    soundcloud: String,
    youtube: String,
    instagram: String,
    twitter: String,
    facebook: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Créer le slug à partir du nom
ArtistSchema.pre('save', function(next) {
  if (!this.isModified('name')) {
    return next();
  }
  
  this.slug = slugify(this.name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
  next();
});

// Cascade delete des smartlinks quand un artiste est supprimé
ArtistSchema.pre('remove', async function(next) {
  await this.model('SmartLink').deleteMany({ artist: this._id });
  next();
});

// Inverser populate avec virtuals
ArtistSchema.virtual('smartlinks', {
  ref: 'SmartLink',
  localField: '_id',
  foreignField: 'artist',
  justOne: false
});

module.exports = mongoose.model('Artist', ArtistSchema);
