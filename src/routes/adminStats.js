const express = require('express');
const router = express.Router();
const SmartLink = require('../models/SmartLink');
const Click = require('../models/Click');

router.get('/stats', async (req, res) => {
  try {
    const totalSmartLinks = await SmartLink.countDocuments();
    const totalClicks = await Click.countDocuments();

    // Clics par plateforme
    const clicksByPlatformAgg = await Click.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);
    const clicksByPlatform = {};
    clicksByPlatformAgg.forEach(item => {
      clicksByPlatform[item._id] = item.count;
    });

    // Conversion et CTR (à calculer selon ta logique métier)
    const conversion = 2.4; // % fictif
    const ctr = 3.8; // % fictif

    // Évolutions (à calculer dynamiquement si besoin)
    const smartLinksTrend = '+12% ce mois';
    const clicksTrend = '+8% cette semaine';
    const conversionTrend = '-0.3% ce mois';
    const ctrTrend = '+0.5% cette semaine';

    res.json({
      totalSmartLinks,
      totalClicks,
      clicksByPlatform,
      conversion,
      ctr,
      smartLinksTrend,
      clicksTrend,
      conversionTrend,
      ctrTrend
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 