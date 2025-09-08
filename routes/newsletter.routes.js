const express = require('express');
const router = express.Router();
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Configuration Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

// Endpoint pour l'inscription newsletter
router.post('/subscribe', async (req, res) => {
  const { email, source = 'Website', attributes = {} } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email requis' 
    });
  }

  // Clé API Brevo depuis les variables d'environnement
  const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
  
  if (!BREVO_API_KEY) {
    console.error('❌ Newsletter Backend: Clé API Brevo manquante');
    return res.status(500).json({ 
      success: false, 
      message: 'Configuration serveur manquante' 
    });
  }

  // Configuration de la clé API
  apiKey.apiKey = BREVO_API_KEY;
  
  console.log('📧 Newsletter Backend: Tentative inscription', { email, source });
  
  try {
    // Créer une instance de l'API
    const apiInstance = new SibApiV3Sdk.ContactsApi();
    
    // Créer le contact
    const createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email;
    createContact.listIds = [2]; // ID de votre liste Brevo
    createContact.attributes = {
      SOURCE: source,
      DATE_INSCRIPTION: new Date().toISOString().split('T')[0], // Format YYYY-MM-DD
      ...attributes
    };
    createContact.updateEnabled = true;

    const result = await apiInstance.createContact(createContact);
    
    console.log('✅ Newsletter Backend: Inscription réussie', result);
    return res.status(200).json({ 
      success: true, 
      message: 'Inscription réussie' 
    });
    
  } catch (error) {
    console.log('📧 Newsletter Backend: Gestion erreur', error.response?.body);
    
    // Si l'email existe déjà (erreur 400 avec code duplicate_contact)
    if (error.response?.body?.code === 'duplicate_parameter') {
      console.log('ℹ️ Newsletter Backend: Email déjà inscrit');
      return res.status(200).json({ 
        success: true, 
        message: 'Vous êtes déjà inscrit(e)' 
      });
    }
    
    console.error('❌ Newsletter Backend: Erreur Brevo', error.response?.body || error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'inscription' 
    });
  }
});

module.exports = router;