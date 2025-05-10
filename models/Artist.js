// models/Artist.js

const mongoose = require('mongoose');
<<<<<<< HEAD
const slugify = require('slugify'); // Assurez-vous que c'est installé: npm install slugify
=======
const slugify = require('slugify'); // Vous devrez installer cette dépendance : npm install slugify
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'artiste est obligatoire."],
      unique: true, // Garantit que chaque nom d'artiste est unique dans la collection
      trim: true, // Supprime les espaces blancs au début et à la fin
      maxlength: [100, "Le nom de l'artiste ne peut pas dépasser 100 caractères."]
    },
    slug: {
      type: String,
      unique: true, // Garantit que chaque slug est unique
<<<<<<< HEAD
      index: true   // Ajout d'un index pour améliorer les performances de recherche par slug
=======
      // Le slug sera généré automatiquement, pas besoin de le rendre 'required' ici
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "La biographie ne peut pas dépasser 1000 caractères."] // Limite optionnelle
    },
    artistImageUrl: {
      type: String, // On stockera l'URL de l'image hébergée
      trim: true,
      // Vous pourriez ajouter une validation de format d'URL ici si nécessaire
      // match: [/https?:\/\/.+\..+/, 'Veuillez entrer une URL valide pour l\'image']
<<<<<<< HEAD
    },
    // CHAMP AJOUTÉ : Site web de l'artiste
    websiteUrl: {
        type: String,
        trim: true
        // Ajouter une validation de format URL si souhaité
    },
    // CHAMP AJOUTÉ : Liens sociaux (tableau d'objets)
    socialLinks: [
        {
            platform: {
                type: String,
                required: [true, "La plateforme sociale est requise (ex: spotify, instagram)."],
                trim: true
                // Optionnel: Utiliser un enum si la liste des plateformes est fixe
                // enum: ['spotify', 'instagram', 'facebook', 'youtube', 'soundcloud', 'tiktok', 'website', 'other']
            },
            url: {
                type: String,
                required: [true, "L'URL du lien social est requise."],
                trim: true
                // Ajouter une validation de format URL si souhaité
            },
             _id: false // Généralement pas besoin d'ID unique pour chaque lien social
        }
    ]
=======
    }
    // Pas besoin de déclarer createdAt et updatedAt explicitement
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
  },
  {
    timestamps: true, // Ajoute automatiquement les champs createdAt et updatedAt gérés par Mongoose
    toJSON: { virtuals: true }, // Optionnel: utile si vous définissez des propriétés virtuelles plus tard
    toObject: { virtuals: true } // Optionnel: utile si vous définissez des propriétés virtuelles plus tard
  }
);

// Middleware Mongoose (hook) pour générer le slug avant la sauvegarde ('save')
artistSchema.pre('save', function(next) {
  // Ne génère le slug que si le nom a été modifié (ou si c'est un nouveau document)
  if (!this.isModified('name')) {
    return next(); // Si le nom n'a pas changé, passe à l'étape suivante
  }

  // Génère le slug à partir du nom
  this.slug = slugify(this.name, {
    lower: true,      // Convertit en minuscules
    strict: true,     // Supprime les caractères spéciaux non autorisés dans les URL (!, @, #, etc.)
<<<<<<< HEAD
    remove: /[*+~.()'"!:@]/g // Conserve ta personnalisation si elle te convient
  });
  next(); // Passe au middleware ou à l'opération de sauvegarde suivante
});

// (Optionnel mais recommandé) Ajouter la validation d'URL via un hook pre('validate') si besoin

// Création du modèle à partir du schéma
const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist; // Exporte le modèle pour pouvoir l'utiliser dans les contrôleurs
=======
    remove: /[*+~.()'"!:@]/g // Vous pouvez personnaliser les caractères à supprimer si besoin
  });

  // Vous pourriez ajouter ici une logique pour gérer les collisions de slugs si nécessaire,
  // bien que le `unique: true` dans le schéma lèvera une erreur si une collision se produit
  // lors de la tentative de sauvegarde par MongoDB.

  next(); // Passe au middleware ou à l'opération de sauvegarde suivante
});

// Création du modèle à partir du schéma
const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist; // Exporte le modèle pour pouvoir l'utiliser dans les contrôleurs
>>>>>>> 7b8caee5 (Ajout des fichiers backend principaux : app.js, controllers, models, routes et évolutions SmartLink/Artistes/logs)
