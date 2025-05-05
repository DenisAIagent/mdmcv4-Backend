// backend/controllers/uploadController.js (Commentaire @route mis à jour)

const asyncHandler = require("../middleware/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");
const cloudinary = require('cloudinary').v2; // Importer Cloudinary SDK v2
const streamifier = require('streamifier'); // Pour transformer le buffer en stream lisible

// --- Configurer Cloudinary ---
// Lit les variables depuis process.env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Utiliser HTTPS par défaut
});
// -------------------------------------

/**
 * @desc    Téléverser un fichier image vers Cloudinary
 * @route   POST /api/upload/image  <--- COMMENTAIRE MIS À JOUR (sans /v1/)
 * @access  Private (Admin)
 */
exports.uploadImage = asyncHandler(async (req, res, next) => {
  // Vérifier si un fichier est présent dans la requête
  if (!req.file) {
    return next(new ErrorResponse("Veuillez télécharger un fichier image.", 400));
  }

  // Vérifier que la configuration Cloudinary est bien chargée
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Configuration Cloudinary incomplète. Vérifiez les variables d'environnement.");
      return next(new ErrorResponse("Erreur de configuration serveur pour l'upload.", 500));
  }

  // Le buffer du fichier est dans req.file.buffer grâce à multer.memoryStorage()
  const fileBuffer = req.file.buffer;

  // --- Logique d'upload vers Cloudinary via un stream ---
  const uploadPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "smartlink_images", // Nom du dossier dans Cloudinary
      },
      (error, result) => {
        if (error) {
          console.error('Erreur Cloudinary:', error);
          return reject(new ErrorResponse(`Erreur lors de l'upload vers Cloudinary: ${error.message}`, 500));
        }
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });

  try {
    // Attendre que la promesse d'upload se termine
    const uploadResult = await uploadPromise;

    // Vérifier la réponse de Cloudinary
    if (!uploadResult || !uploadResult.secure_url) {
        console.error('Réponse invalide de Cloudinary:', uploadResult);
        return next(new ErrorResponse("Réponse invalide reçue de Cloudinary après l'upload.", 500));
    }

    console.log(`Image téléversée sur Cloudinary : ${uploadResult.secure_url}`);

    // Renvoyer la réponse succès avec l'URL sécurisée
    res.status(200).json({
      success: true,
      data: { imageUrl: uploadResult.secure_url }, // URL HTTPS fournie par Cloudinary
    });

  } catch (err) {
    // Gérer les erreurs
    next(err);
  }
  // --- Fin de la logique Cloudinary ---

}); // Fin de exports.uploadImage
