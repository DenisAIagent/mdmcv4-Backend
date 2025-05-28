const express = require('express');
const router = express.Router();

// Base de données simulée pour les SmartLinks
let smartLinks = [];
let nextId = 1;

// Middleware pour parser le JSON
router.use(express.json());

/**
 * Récupérer tous les SmartLinks
 */
router.get('/', (req, res) => {
  // Filtrage optionnel par artiste ou tags
  const { artist, tag } = req.query;
  
  let filteredLinks = [...smartLinks];
  
  if (artist) {
    filteredLinks = filteredLinks.filter(link => 
      link.artist.toLowerCase().includes(artist.toLowerCase())
    );
  }
  
  if (tag) {
    filteredLinks = filteredLinks.filter(link => 
      link.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }
  
  res.json(filteredLinks);
});

/**
 * Récupérer un SmartLink par son ID
 */
router.get('/:id', (req, res) => {
  const link = smartLinks.find(link => link.id === parseInt(req.params.id));
  
  if (!link) {
    return res.status(404).json({ message: 'SmartLink non trouvé' });
  }
  
  res.json(link);
});

/**
 * Créer un nouveau SmartLink
 */
router.post('/', (req, res) => {
  const { title, artist, coverUrl, platforms, utmParams, tags, notes } = req.body;
  
  // Validation basique
  if (!title || !artist || !platforms || platforms.length === 0) {
    return res.status(400).json({ message: 'Données incomplètes' });
  }
  
  // Création du nouveau SmartLink
  const newLink = {
    id: nextId++,
    title,
    artist,
    coverUrl,
    platforms: platforms.map((p, index) => ({
      ...p,
      order: index + 1
    })),
    utmParams: utmParams || {},
    tags: tags || [],
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalClicks: 0,
      platformClicks: {},
      countries: {}
    }
  };
  
  // Génération de l'URL et du QR code
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  newLink.url = `https://mdmcmusicads.com/s/${slug}`;
  newLink.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(newLink.url)}`;
  
  // Ajout à la base de données
  smartLinks.push(newLink);
  
  res.status(201).json(newLink);
});

/**
 * Mettre à jour un SmartLink existant
 */
router.put('/:id', (req, res) => {
  const linkId = parseInt(req.params.id);
  const linkIndex = smartLinks.findIndex(link => link.id === linkId);
  
  if (linkIndex === -1) {
    return res.status(404).json({ message: 'SmartLink non trouvé' });
  }
  
  const { title, artist, coverUrl, platforms, utmParams, tags, notes } = req.body;
  
  // Mise à jour des champs
  const updatedLink = {
    ...smartLinks[linkIndex],
    title: title || smartLinks[linkIndex].title,
    artist: artist || smartLinks[linkIndex].artist,
    coverUrl: coverUrl || smartLinks[linkIndex].coverUrl,
    platforms: platforms ? platforms.map((p, index) => ({
      ...p,
      order: index + 1
    })) : smartLinks[linkIndex].platforms,
    utmParams: utmParams || smartLinks[linkIndex].utmParams,
    tags: tags || smartLinks[linkIndex].tags,
    notes: notes || smartLinks[linkIndex].notes,
    updatedAt: new Date().toISOString()
  };
  
  // Mise à jour de l'URL si le titre a changé
  if (title && title !== smartLinks[linkIndex].title) {
    const slug = title.toLowerCase().replace(/\s+/g, '-');
    updatedLink.url = `https://mdmcmusicads.com/s/${slug}`;
    updatedLink.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(updatedLink.url)}`;
  }
  
  // Mise à jour dans la base de données
  smartLinks[linkIndex] = updatedLink;
  
  res.json(updatedLink);
});

/**
 * Supprimer un SmartLink
 */
router.delete('/:id', (req, res) => {
  const linkId = parseInt(req.params.id);
  const linkIndex = smartLinks.findIndex(link => link.id === linkId);
  
  if (linkIndex === -1) {
    return res.status(404).json({ message: 'SmartLink non trouvé' });
  }
  
  // Suppression du SmartLink
  smartLinks.splice(linkIndex, 1);
  
  res.status(204).send();
});

/**
 * Enregistrer un clic sur un SmartLink
 */
router.post('/:id/click', (req, res) => {
  const linkId = parseInt(req.params.id);
  const linkIndex = smartLinks.findIndex(link => link.id === linkId);
  
  if (linkIndex === -1) {
    return res.status(404).json({ message: 'SmartLink non trouvé' });
  }
  
  const { platform, country } = req.body;
  
  // Mise à jour des statistiques
  smartLinks[linkIndex].stats.totalClicks++;
  
  if (platform) {
    if (!smartLinks[linkIndex].stats.platformClicks[platform]) {
      smartLinks[linkIndex].stats.platformClicks[platform] = 0;
    }
    smartLinks[linkIndex].stats.platformClicks[platform]++;
  }
  
  if (country) {
    if (!smartLinks[linkIndex].stats.countries[country]) {
      smartLinks[linkIndex].stats.countries[country] = 0;
    }
    smartLinks[linkIndex].stats.countries[country]++;
  }
  
  res.status(200).json({ success: true });
});

/**
 * Récupérer les statistiques d'un SmartLink
 */
router.get('/:id/stats', (req, res) => {
  const linkId = parseInt(req.params.id);
  const link = smartLinks.find(link => link.id === linkId);
  
  if (!link) {
    return res.status(404).json({ message: 'SmartLink non trouvé' });
  }
  
  res.json(link.stats);
});

/**
 * Simuler la détection Odesli
 */
router.post('/detect', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ message: 'URL requise' });
  }
  
  // Simulation de délai pour l'API Odesli
  setTimeout(() => {
    // Données fictives pour la démonstration
    const result = {
      title: "Titre du single détecté",
      artist: "Artiste détecté",
      coverUrl: "https://via.placeholder.com/300",
      platforms: [
        { id: 1, name: 'Spotify', url: url, order: 1 },
        { id: 2, name: 'Apple Music', url: 'https://music.apple.com/example', order: 2 },
        { id: 3, name: 'Deezer', url: 'https://deezer.com/example', order: 3 },
        { id: 4, name: 'YouTube Music', url: 'https://music.youtube.com/example', order: 4 }
      ]
    };
    
    res.json(result);
  }, 1500);
});

module.exports = router;
