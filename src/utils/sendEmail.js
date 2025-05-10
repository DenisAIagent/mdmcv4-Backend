const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Créer un transporteur
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Définir les options de l'email
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html || options.message
  };

  // Envoyer l'email
  const info = await transporter.sendMail(message);

  console.log('Message envoyé: %s', info.messageId);
};

module.exports = sendEmail;
