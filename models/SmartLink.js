// backend/models/SmartLink.js
// (Adaptez le chemin si votre structure est différente, par exemple src/models/SmartLink.js)

const mongoose = require("mongoose");
const slugify = require("slugify"); // Assurez-vous que slugify est une dépendance : npm install slugify ou yarn add slugify

// Sous-schéma pour les liens vers les plateformes
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
    // Vous pouvez ajouter une validation d'URL plus stricte si besoin :
    // match: [/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, "Veuillez fournir une URL valide."]
  }
}, { _id: false }); // _id: false car ces sous-documents n'ont pas besoin de leur propre ID unique.

// Schéma principal pour le SmartLink
const smartLinkSchema = new mongoose.Schema(
  {
    trackTitle: {
      type: String,
      required: [true, "Le titre de la musique est obligatoire."],
      trim: true,
      maxlength: [150, "Le titre ne peut pas dépasser 150 caractères."]
    },
    slug: { // Slug du morceau, sera utilisé en combinaison avec le slug de l'artiste pour l'URL publique
      type: String,
      trim: true,
      // Sera généré automatiquement si non fourni. L'unicité est assurée par l'index composé (artistId + slug).
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artist", // Assurez-vous que ce nom correspond à votre modèle Artist (ex: mongoose.model("Artist", ...))
      required: [true, "Une référence à l'artiste est obligatoire."],
      index: true // Bon pour les performances des requêtes filtrant par artiste
    },
    releaseDate: {
      type: Date
      // Pas de valeur par défaut ici, car une date de sortie est spécifique.
    },
    coverImageUrl: {
      type: String,
      trim: true
      // Optionnel: Décommentez si une image de couverture est toujours requise.
      // required: [true, "Une URL pour l'image de couverture est obligatoire."],
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
            // Doit être un tableau, avoir au moins un élément, et chaque élément doit avoir platform et url.
            return Array.isArray(value) && value.length > 0 && value.every(link => link.platform && link.url);
          },
          message: 'Au moins un lien de plateforme complet (avec nom et URL) est requis.',
        },
      ],
    },
    trackingIds: { // Objet pour stocker les différents IDs de tracking
      ga4Id: { type: String, trim: true, sparse: true },       // Google Analytics 4
      gtmId: { type: String, trim: true, sparse: true },       // Google Tag Manager
      metaPixelId: { type: String, trim: true, sparse: true }, // Meta (Facebook/Instagram) Pixel
      tiktokPixelId: { type: String, trim: true, sparse: true },// TikTok Pixel
      googleAdsId: { type: String, trim: true, sparse: true }  // Google Ads ID (de votre version)
      // Ajoutez d'autres IDs ici si nécessaire
    },
    // Compteur pour les vues de la page SmartLink publique (le "PageView" qui vaut 1€)
    viewCount: {
      type: Number,
      default: 0
    },
    // Compteur pour les clics sur les liens de plateforme spécifiques (la "conversion" qui vaut 100€)
    platformClickCount: {
      type: Number,
      default: 0
    },
    // Optionnel, pour une analyse plus fine des clics par plateforme à l'avenir :
    // platformClicksDetailed: {
    //   type: Map,
    //   of: Number, // ex: { "Spotify": 120, "Deezer": 55 }
    //   default: () => new Map()
    // },
    isPublished: { // Pour contrôler la visibilité publique du SmartLink
      type: Boolean,
      default: false,
      index: true // Utile si vous filtrez souvent les SmartLinks publiés
    },
    userId: { // Optionnel: Référence à l'utilisateur (admin) qui a créé/gère ce SmartLink
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assurez-vous que ce nom correspond à votre modèle User
        // required: true, // Si la liaison à un utilisateur est obligatoire pour la création
    }
    // Vous pourriez ajouter d'autres champs ici, par exemple :
    // - `tags: [String]`
    // - `genre: String`
    // - `customOgTags: { title: String, description: String, imageUrl: String }`
  },
  {
    timestamps: true // Ajoute automatiquement les champs `createdAt` et `updatedAt`
  }
);

// Middleware Mongoose "pre-save" pour générer le slug à partir de `trackTitle`
// Ce hook s'exécute avant qu'un document SmartLink ne soit sauvegardé.
smartLinkSchema.pre("save", function(next) {
  // Générer le slug seulement si :
  // 1. Le champ `trackTitle` a été modifié (pour les mises à jour) OU c'est un nouveau document (`this.isNew`)
  // 2. `trackTitle` a une valeur
  // 3. Le champ `slug` n'est pas déjà défini (pour permettre une modification manuelle du slug via le formulaire si souhaité)
  if ((this.isModified("trackTitle") || this.isNew) && this.trackTitle && !this.slug) {
    this.slug = slugify(this.trackTitle, {
      lower: true,      // Convertit en minuscules
      strict: true,     // Supprime les caractères non autorisés au lieu de les remplacer
      remove: /[*+~.()'"!:@#%$^&={}|[\]\\;\/?]/g // Expression régulière pour supprimer les caractères spéciaux
    });
  }
  // Note : La logique pour assurer l'unicité du slug *par artiste* (ex: "mon-titre", puis "mon-titre-2")
  // est plus complexe et se gère généralement au niveau du contrôleur, juste avant la sauvegarde,
  // car elle nécessite une requête à la base de données pour vérifier les slugs existants pour cet artiste.
  next();
});

// Index composé pour garantir l'unicité de la combinaison `artistId` et `slug`.
// Cela signifie qu'un artiste ne peut pas avoir deux SmartLinks avec le même slug,
// mais deux artistes différents peuvent avoir des SmartLinks avec le même slug (ex: "Intro").
// `sparse: true` permet à l'index unique de fonctionner même si certains documents n'ont pas de slug
// (ce qui ne devrait pas arriver si le slug est toujours généré, mais c'est une bonne pratique pour la robustesse).
smartLinkSchema.index({ artistId: 1, slug: 1 }, { unique: true, sparse: true });

// Création du modèle Mongoose à partir du schéma
const SmartLink = mongoose.model("SmartLink", smartLinkSchema);

// Exportation du modèle pour pouvoir l'utiliser ailleurs dans l'application backend
module.exports = SmartLink;
