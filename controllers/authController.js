// Dans sendTokenResponse (fonction qui crée le cookie au login)
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS || '30', 10);
  const options = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    path: '/', // Assure que le cookie est accessible depuis tous les chemins
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    options.sameSite = 'None'; // Nécessaire pour cross-site avec Secure=true
  } else {
    options.sameSite = 'Lax'; // 'Lax' est un bon défaut pour le dev
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token }); // Token dans JSON est optionnel si on se base sur cookie
};

// Dans exports.logout (fonction qui supprime le cookie)
exports.logout = asyncHandler(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() - 10 * 1000), // Date d'expiration dans le passé
    httpOnly: true,
    path: '/', // DOIT CORRESPONDRE à celui du login
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
    cookieOptions.sameSite = 'None'; // DOIT CORRESPONDRE
  } else {
    cookieOptions.sameSite = 'Lax'; // DOIT CORRESPONDRE
  }

  res.status(200)
     .cookie('token', 'none', cookieOptions) // Envoie un cookie expiré avec le même nom et options
     .json({
       success: true,
       data: {}
     });
});
