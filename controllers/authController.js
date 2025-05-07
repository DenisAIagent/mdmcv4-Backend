// Dans mdmcv4-Backend/controllers/authController.js

// ... autres imports (User, ErrorResponse, asyncHandler, crypto, sendEmail) ...

// --- Fonction Utilitaire pour envoyer Token et Cookie (appelée par login, register, resetPassword) ---
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken(); // Méthode de ton modèle User.js
  
  // Log pour le débogage du token généré
  console.log('[sendTokenResponse] Generated Token:', token ? 'Token généré (longueur: ' + token.length + ')' : 'Aucun token généré');

  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS || '30', 10);
  const options = {
    // Convertit les jours en millisecondes pour l'attribut 'expires'
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true, // Le cookie n'est pas accessible via JavaScript côté client
    path: '/',      // Important : rend le cookie accessible sur tous les chemins du domaine
  };

  // En production, ajoute les attributs 'secure' et 'sameSite=None'
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;    // Le cookie ne sera envoyé que sur HTTPS
    options.sameSite = 'None';  // Nécessaire pour les cookies inter-sites (si frontend et backend sont sur des domaines/ports différents perçus par le navigateur)
  } else {
    // En développement, 'Lax' est souvent un bon défaut.
    // Si ton frontend et backend sont sur des ports différents (ex: localhost:5173 et localhost:5000),
    // tu pourrais aussi avoir besoin de 'None' et secure:true (en utilisant un proxy HTTPS local ou mkcert)
    // mais 'Lax' est généralement plus simple pour commencer en dev si même domaine.
    options.sameSite = 'Lax';
  }

  console.log('[sendTokenResponse] Cookie options:', options);

  res
    .status(statusCode)
    .cookie('token', token, options) // Définit le cookie 'token'
    .json({
      success: true,
      // Il est courant de renvoyer aussi le token et/ou les données utilisateur dans le JSON,
      // même si l'authentification se base sur le cookie.
      // Adapte selon ce que ton frontend attend après le login.
      token: token, // Le frontend n'a PAS besoin de stocker ce token si on utilise les cookies HttpOnly
      // data: { id: user._id, username: user.username, email: user.email, role: user.role } // Exemple
    });
};

// ... (tes fonctions register, login, getMe, updatePassword, forgotPassword, resetPassword) ...
// Assure-toi que login, register, et resetPassword appellent bien sendTokenResponse à la fin.
// Par exemple, dans login :
// exports.login = asyncHandler(async (req, res, next) => {
//   ...
//   sendTokenResponse(user, 200, res);
// });


/**
 * @desc     Déconnexion utilisateur / effacer le cookie
 * @route    GET /api/auth/logout
 * @access   Privé (nécessite 'protect' sur la route)
 */
exports.logout = asyncHandler(async (req, res, next) => {
  // Pour effacer un cookie, on le renvoie avec une date d'expiration passée
  // et les MÊMES options (path, domain, secure, sameSite) que lors de sa création.
  const cookieOptions = {
    expires: new Date(Date.now() - 10 * 1000), // Date d'expiration dans le passé immédiat
    httpOnly: true,
    path: '/', // ESSENTIEL : Doit correspondre au 'path' utilisé lors de la création du cookie
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'None'; // ESSENTIEL : Doit correspondre
  } else {
    cookieOptions.sameSite = 'Lax'; // ESSENTIEL : Doit correspondre
  }

  console.log('[logout] Clearing cookie with options:', cookieOptions);

  res.status(200)
     .cookie('token', 'none', cookieOptions) // La valeur 'none' est arbitraire, l'expiration est la clé
     .json({
       success: true,
       data: {} // Aucune donnée à renvoyer
     });
});

// Assure-toi que tes autres fonctions (register, getMe, updatePassword, etc.) sont correctes.
// Par exemple, getMe devrait ressembler à ça :
/**
 * @desc     Obtenir l'utilisateur actuel (basé sur le token)
 * @route    GET /api/auth/me
 * @access   Privé (nécessite 'protect')
 */
// exports.getMe = asyncHandler(async (req, res, next) => {
//   // req.user est attaché par le middleware 'protect' après validation du token
//   if (!req.user || !req.user.id) {
//       return next(new ErrorResponse('Utilisateur non authentifié ou non trouvé dans la requête', 401));
//   }
//   res.status(200).json({
//     success: true,
//     data: req.user 
//   });
// });
