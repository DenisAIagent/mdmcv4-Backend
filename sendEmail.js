const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Créer un transporteur SMTP réutilisable
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Définir les options de l'email
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Envoyer l'email
  const info = await transporter.sendMail(mailOptions);

  console.log(`Email envoyé: ${info.messageId}`);
};

module.exports = sendEmail;
