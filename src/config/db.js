const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI n\'est pas défini dans les variables d\'environnement');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion MongoDB: ${error.message}`);
    // Attendre 5 secondes avant de réessayer
    setTimeout(() => {
      console.log('Tentative de reconnexion à MongoDB...');
      connectDB();
    }, 5000);
  }
};

module.exports = connectDB; 