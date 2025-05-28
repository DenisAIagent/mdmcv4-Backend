const express = require('express');
const cors = require('cors');
const smartLinkRoutes = require('./api/smartlink');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/smartlinks', smartLinkRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'API MDMC Music Ads opérationnelle' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
