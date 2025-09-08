// routes/newsletter.routes.js
// Route pour la gestion de la newsletter Brevo
const express = require('express');
const router = express.Router();

// Debug log pour vérifier la présence de la variable d'environnement
console.log('🔧 Newsletter Route - BREVO_API_KEY présent ?', Boolean(process.env.BREVO_API_KEY));

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  try {
    console.log('📧 Newsletter: Tentative d\'inscription', { 
      email: req.body.email, 
      source: req.body.source,
      hasApiKey: Boolean(process.env.BREVO_API_KEY)
    });

    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Newsletter: BREVO_API_KEY manquant dans process.env');
      console.error('❌ Variables disponibles:', Object.keys(process.env).filter(k => k.includes('BREVO')));
      return res.status(500).json({
        success: false,
        message: 'Configuration serveur manquante'
      });
    }

    const { email, source = 'Website', attributes = {} } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Adresse email invalide'
      });
    }

    // Appel API Brevo
    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        listIds: [2], // ID de votre liste Brevo
        attributes: {
          SOURCE: source,
          DATE_INSCRIPTION: new Date().toISOString(),
          ...attributes
        },
        updateEnabled: true
      }),
    });

    console.log('📧 Brevo API Response Status:', response.status);

    // Gérer les réponses Brevo
    if (response.ok) {
      console.log('✅ Newsletter: Inscription réussie via Brevo');
      return res.json({
        success: true,
        message: 'Inscription réussie !'
      });
    } else if (response.status === 400) {
      // Email potentiellement déjà existant
      const errorData = await response.json().catch(() => ({}));
      if (errorData.code === 'duplicate_contact') {
        console.log('ℹ️ Newsletter: Email déjà existant');
        return res.json({
          success: true,
          message: 'Vous êtes déjà inscrit(e) à notre newsletter'
        });
      }
    }

    // Autres erreurs Brevo
    const errorText = await response.text().catch(() => 'Erreur inconnue');
    console.error('❌ Newsletter: Erreur Brevo', response.status, errorText);
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });

  } catch (error) {
    console.error('❌ Newsletter: Erreur serveur', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur interne'
    });
  }
});

// GET /api/newsletter/test - Route de test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Newsletter service disponible',
    hasApiKey: Boolean(process.env.BREVO_API_KEY),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;