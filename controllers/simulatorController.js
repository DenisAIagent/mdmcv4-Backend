const asyncHandler = require("express-async-handler");
const sendEmail = require("../utils/sendEmail");

const submitSimulatorResults = asyncHandler(async (req, res) => {
  const { artistName, email, platform, campaignType, budget, country, views, cpv, reach } = req.body;

  if (!artistName || !email || !platform || !campaignType || !budget || !country || !views || !cpv || !reach) {
    res.status(400);
    throw new Error("Veuillez inclure tous les champs requis.");
  }

  const message = `
    <h2>Nouveaux résultats de simulation de campagne</h2>
    <p>Un utilisateur a soumis de nouveaux résultats de simulation via le simulateur de campagnes :</p>
    <ul>
      <li><b>Nom de l'artiste:</b> ${artistName}</li>
      <li><b>Email:</b> ${email}</li>
      <li><b>Plateforme:</b> ${platform}</li>
      <li><b>Type de campagne:</b> ${campaignType}</li>
      <li><b>Budget:</b> ${budget}</li>
      <li><b>Pays:</b> ${country}</li>
      <li><b>Vues estimées:</b> ${views}</li>
      <li><b>Coût par vue/impression (CPV/CPM):</b> ${cpv}</li>
      <li><b>Portée estimée:</b> ${reach}</li>
    </ul>
    <p>Veuillez contacter l'utilisateur pour discuter de ces résultats.</p>
  `;

  const subject = "Nouveaux résultats de simulation de campagne";
  const send_to = process.env.EMAIL_USER; // L'adresse email où envoyer les résultats

  try {
    await sendEmail({
      email: send_to,
      subject,
      html: message,
    });
    res.status(200).json({ success: true, message: "Résultats de simulation soumis et email envoyé." });
  } catch (error) {
    res.status(500);
    throw new Error("L'email n'a pas pu être envoyé, veuillez réessayer.");
  }
});

module.exports = { submitSimulatorResults };

