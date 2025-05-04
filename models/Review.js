const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Veuillez ajouter un nom'], // Champ requis basé sur le formulaire
    trim: true, // Enlève les espaces superflus
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'Veuillez ajouter un email'], // Champ requis basé sur le formulaire
    match: [ // Validation simple du format email
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez ajouter un email valide'
    ]
  },
  rating: {
    type: Number,
    required: [true, 'Veuillez ajouter une note entre 1 et 5'], // Requis basé sur le formulaire
    min: 1,
    max: 5
  },
  message: {
    type: String,
    required: [true, 'Veuillez ajouter un message'], // Requis basé sur le formulaire
    maxlength: [1000, 'Le message ne peut pas dépasser 1000 caractères'] // Limite de longueur
  },
  // Nouveau champ basé sur les témoignages affichés (ex: "Artiste indépendant")
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Le titre/affiliation ne peut pas dépasser 100 caractères'],
    // Ce champ n'est pas dans le formulaire public, donc il n'est pas 'required'
    // Il pourrait être ajouté par un admin lors de l'approbation, ou laissé vide.
  },
  status: {
    type: String,
    required: true,
    enum: [ // Définit les valeurs possibles pour le statut
      'pending',  // En attente de modération
      'approved', // Approuvé et potentiellement affiché
      'rejected'  // Rejeté
    ],
    default: 'pending' // Statut par défaut lors de la création
  },
  // Pas besoin de déclarer createdAt explicitement si on utilise timestamps
  // La date affichée sur le front ("15/03/2025") pourrait être le createdAt formaté,
  // ou une date d'approbation spécifique si besoin. Commençons simple.

}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

module.exports = mongoose.model('Review', ReviewSchema);
