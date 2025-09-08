// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { uploadImage, uploadAudio } = require('../controllers/uploadController'); // Adaptez le chemin si nécessaire
const { protect, authorize } = require('../middleware/auth'); // Adaptez le chemin si nécessaire

// Pour gérer l'upload de fichiers avec multer (si ce n'est pas déjà géré globalement ou dans le contrôleur)
// Si votre uploadController s'attend à ce que multer soit un middleware sur la route, ajoutez-le ici.
// Sinon, si multer est utilisé directement dans le contrôleur, pas besoin ici.
// Exemple avec multer (à installer: npm install multer)
const multer = require('multer');
const storage = multer.memoryStorage(); // Stocke le fichier en mémoire (buffer)

// Configuration pour les images
const uploadImageFile = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB par exemple
  fileFilter: function (req, file, cb) {
    // Accepter seulement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  }
});

// Configuration pour les fichiers audio
const uploadAudioFile = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB pour l'audio
  fileFilter: function (req, file, cb) {
    // Accepter seulement les fichiers audio
    const allowedMimes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-wav'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers audio MP3 et WAV sont autorisés!'), false);
    }
  }
});

// Route pour l'upload d'image (sans auth pour interface admin)
// POST /api/upload/image (le préfixe /api/upload sera ajouté dans app.js)
router.post(
  '/image',
  uploadImageFile.single('image'), // Middleware multer pour traiter un seul fichier nommé 'image'
  uploadImage
);

// Route pour l'upload d'audio (sans auth pour interface admin)
// POST /api/upload/audio
router.post(
  '/audio',
  uploadAudioFile.single('audio'), // Middleware multer pour traiter un seul fichier nommé 'audio'
  uploadAudio
);

module.exports = router;
