/**
 * Contrôleur de Smart Links pour MDMC Music Ads v4
 */

const db = require('../models');
const SmartLink = db.smartLink;
const Artist = db.artist;
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Récupérer tous les Smart Links (avec pagination et filtres)
 */
exports.getAllSmartLinks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filtres
    const filter = {};
    if (req.query.artist) filter.artist = req.query.artist;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { slug: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Tri
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Par défaut, tri par date de création décroissante
    }
    
    const smartLinks = await SmartLink.find(filter)
      .populate('artist', 'name image')
      .populate('createdBy', 'username')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await SmartLink.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      smartLinks,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des Smart Links",
      error: error.message
    });
  }
};

/**
 * Créer un nouveau Smart Link
 */
exports.createSmartLink = async (req, res) => {
  try {
    // Vérifier si l'artiste existe
    const artist = await Artist.findById(req.body.artist);
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: "Artiste non trouvé"
      });
    }
    
    // Générer un slug unique
    let slug = req.body.slug || generateSlug(req.body.title);
    const existingSlug = await SmartLink.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${uuidv4().substring(0, 8)}`;
    }
    
    // Créer le Smart Link
    const smartLink = await SmartLink.create({
      title: req.body.title,
      artist: req.body.artist,
      slug,
      releaseDate: req.body.releaseDate,
      coverImage: req.body.coverImage,
      description: req.body.description || '',
      platforms: req.body.platforms || [],
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdBy: req.userId
    });
    
    res.status(201).json({
      success: true,
      message: "Smart Link créé avec succès",
      smartLink
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du Smart Link",
      error: error.message
    });
  }
};

/**
 * Récupérer un Smart Link par son ID
 */
exports.getSmartLinkById = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id)
      .populate('artist', 'name image socialLinks')
      .populate('createdBy', 'username');
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    res.status(200).json({
      success: true,
      smartLink
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du Smart Link",
      error: error.message
    });
  }
};

/**
 * Mettre à jour un Smart Link
 */
exports.updateSmartLink = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // Vérifier si l'artiste existe
    if (req.body.artist) {
      const artist = await Artist.findById(req.body.artist);
      if (!artist) {
        return res.status(404).json({
          success: false,
          message: "Artiste non trouvé"
        });
      }
      smartLink.artist = req.body.artist;
    }
    
    // Vérifier si le slug est unique
    if (req.body.slug && req.body.slug !== smartLink.slug) {
      const existingSlug = await SmartLink.findOne({ slug: req.body.slug });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Ce slug est déjà utilisé"
        });
      }
      smartLink.slug = req.body.slug;
    }
    
    // Mettre à jour les autres champs
    if (req.body.title) smartLink.title = req.body.title;
    if (req.body.releaseDate) smartLink.releaseDate = req.body.releaseDate;
    if (req.body.coverImage) smartLink.coverImage = req.body.coverImage;
    if (req.body.description !== undefined) smartLink.description = req.body.description;
    if (req.body.platforms) smartLink.platforms = req.body.platforms;
    if (req.body.isActive !== undefined) smartLink.isActive = req.body.isActive;
    
    await smartLink.save();
    
    res.status(200).json({
      success: true,
      message: "Smart Link mis à jour avec succès",
      smartLink
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du Smart Link",
      error: error.message
    });
  }
};

/**
 * Supprimer un Smart Link
 */
exports.deleteSmartLink = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    await SmartLink.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Smart Link supprimé avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression du Smart Link",
      error: error.message
    });
  }
};

/**
 * Récupérer un Smart Link public par son slug
 */
exports.getPublicSmartLinkBySlug = async (req, res) => {
  try {
    const smartLink = await SmartLink.findOne({ slug: req.params.slug, isActive: true })
      .populate('artist', 'name image socialLinks');
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé ou inactif"
      });
    }
    
    // Enregistrer la visite
    await recordVisitInternal(smartLink._id, req);
    
    res.status(200).json({
      success: true,
      smartLink: {
        id: smartLink._id,
        title: smartLink.title,
        artist: smartLink.artist,
        releaseDate: smartLink.releaseDate,
        coverImage: smartLink.coverImage,
        description: smartLink.description,
        platforms: smartLink.platforms
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du Smart Link",
      error: error.message
    });
  }
};

/**
 * Enregistrer une visite sur un Smart Link
 */
exports.recordVisit = async (req, res) => {
  try {
    const smartLink = await SmartLink.findOne({ slug: req.params.slug, isActive: true });
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé ou inactif"
      });
    }
    
    // Enregistrer la visite
    await recordVisitInternal(smartLink._id, req);
    
    res.status(200).json({
      success: true,
      message: "Visite enregistrée avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement de la visite",
      error: error.message
    });
  }
};

/**
 * Enregistrer un partage de Smart Link
 */
exports.recordShare = async (req, res) => {
  try {
    const smartLink = await SmartLink.findOne({ slug: req.params.slug, isActive: true });
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé ou inactif"
      });
    }
    
    // Enregistrer le partage
    await db.share.create({
      smartLink: smartLink._id,
      platform: req.body.platform,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || '',
      timestamp: Date.now()
    });
    
    res.status(200).json({
      success: true,
      message: "Partage enregistré avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du partage",
      error: error.message
    });
  }
};

/**
 * Enregistrer un clic sur une plateforme
 */
exports.recordPlatformClick = async (req, res) => {
  try {
    const smartLink = await SmartLink.findOne({ slug: req.params.slug, isActive: true });
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé ou inactif"
      });
    }
    
    // Enregistrer le clic
    await db.click.create({
      smartLink: smartLink._id,
      platform: req.body.platform,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || '',
      timestamp: Date.now()
    });
    
    res.status(200).json({
      success: true,
      message: "Clic enregistré avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'enregistrement du clic",
      error: error.message
    });
  }
};

/**
 * Récupérer les statistiques d'un Smart Link
 */
exports.getSmartLinkStats = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // Période
    const period = req.query.period || 'all';
    let startDate = new Date(0);
    
    if (period !== 'all') {
      const now = new Date();
      
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
    }
    
    // Récupérer les statistiques
    const visits = await db.visit.countDocuments({
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    const uniqueVisits = await db.visit.distinct('ip', {
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    const shares = await db.share.countDocuments({
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    const clicks = await db.click.countDocuments({
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    // Répartition des clics par plateforme
    const platformClicks = await db.click.aggregate([
      {
        $match: {
          smartLink: smartLink._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Évolution des visites par jour
    const visitsByDay = await db.visit.aggregate([
      {
        $match: {
          smartLink: smartLink._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        visits,
        uniqueVisits: uniqueVisits.length,
        shares,
        clicks,
        platformClicks: platformClicks.map(item => ({
          platform: item._id,
          count: item.count
        })),
        visitsByDay: visitsByDay.map(item => ({
          date: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

/**
 * Générer un code QR pour un Smart Link
 */
exports.generateQRCode = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // URL du Smart Link
    const baseUrl = process.env.FRONTEND_URL || 'https://mdmc-music-ads.com';
    const smartLinkUrl = `${baseUrl}/s/${smartLink.slug}`;
    
    // Options du QR code
    const options = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    // Générer le QR code
    const qrCodeDataUrl = await QRCode.toDataURL(smartLinkUrl, options);
    
    // Extraire les données binaires
    const data = qrCodeDataUrl.split(',')[1];
    const buffer = Buffer.from(data, 'base64');
    
    // Créer le répertoire de sortie s'il n'existe pas
    const outputDir = path.join(__dirname, '../../public/qrcodes');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Chemin du fichier QR code
    const fileName = `qrcode_${smartLink._id}.png`;
    const filePath = path.join(outputDir, fileName);
    
    // Enregistrer le fichier
    fs.writeFileSync(filePath, buffer);
    
    // URL du QR code
    const qrCodeUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/public/qrcodes/${fileName}`;
    
    res.status(200).json({
      success: true,
      qrCode: {
        url: qrCodeUrl,
        dataUrl: qrCodeDataUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du QR code",
      error: error.message
    });
  }
};

/**
 * Ajouter une plateforme à un Smart Link
 */
exports.addPlatform = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // Vérifier si la plateforme existe déjà
    const platformExists = smartLink.platforms.some(platform => platform.name === req.body.name);
    
    if (platformExists) {
      return res.status(400).json({
        success: false,
        message: "Cette plateforme existe déjà dans ce Smart Link"
      });
    }
    
    // Ajouter la plateforme
    smartLink.platforms.push({
      name: req.body.name,
      url: req.body.url,
      icon: req.body.icon,
      order: req.body.order || smartLink.platforms.length
    });
    
    await smartLink.save();
    
    res.status(200).json({
      success: true,
      message: "Plateforme ajoutée avec succès",
      platform: smartLink.platforms[smartLink.platforms.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'ajout de la plateforme",
      error: error.message
    });
  }
};

/**
 * Mettre à jour une plateforme d'un Smart Link
 */
exports.updatePlatform = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // Trouver la plateforme
    const platformIndex = smartLink.platforms.findIndex(platform => platform._id.toString() === req.params.platformId);
    
    if (platformIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Plateforme non trouvée"
      });
    }
    
    // Mettre à jour la plateforme
    if (req.body.name) smartLink.platforms[platformIndex].name = req.body.name;
    if (req.body.url) smartLink.platforms[platformIndex].url = req.body.url;
    if (req.body.icon) smartLink.platforms[platformIndex].icon = req.body.icon;
    if (req.body.order !== undefined) smartLink.platforms[platformIndex].order = req.body.order;
    
    await smartLink.save();
    
    res.status(200).json({
      success: true,
      message: "Plateforme mise à jour avec succès",
      platform: smartLink.platforms[platformIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la plateforme",
      error: error.message
    });
  }
};

/**
 * Supprimer une plateforme d'un Smart Link
 */
exports.deletePlatform = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // Trouver la plateforme
    const platformIndex = smartLink.platforms.findIndex(platform => platform._id.toString() === req.params.platformId);
    
    if (platformIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Plateforme non trouvée"
      });
    }
    
    // Supprimer la plateforme
    smartLink.platforms.splice(platformIndex, 1);
    
    await smartLink.save();
    
    res.status(200).json({
      success: true,
      message: "Plateforme supprimée avec succès"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de la plateforme",
      error: error.message
    });
  }
};

/**
 * Réordonner les plateformes d'un Smart Link
 */
exports.reorderPlatforms = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id);
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // Vérifier si les plateformes existent
    const platformIds = req.body.platforms.map(p => p.id);
    const allPlatformsExist = platformIds.every(id => 
      smartLink.platforms.some(platform => platform._id.toString() === id)
    );
    
    if (!allPlatformsExist) {
      return res.status(400).json({
        success: false,
        message: "Une ou plusieurs plateformes n'existent pas"
      });
    }
    
    // Mettre à jour l'ordre des plateformes
    req.body.platforms.forEach(item => {
      const platform = smartLink.platforms.find(p => p._id.toString() === item.id);
      if (platform) {
        platform.order = item.order;
      }
    });
    
    // Trier les plateformes par ordre
    smartLink.platforms.sort((a, b) => a.order - b.order);
    
    await smartLink.save();
    
    res.status(200).json({
      success: true,
      message: "Plateformes réordonnées avec succès",
      platforms: smartLink.platforms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réorganisation des plateformes",
      error: error.message
    });
  }
};

/**
 * Exporter les statistiques d'un Smart Link (CSV, PDF)
 */
exports.exportStats = async (req, res) => {
  try {
    const smartLink = await SmartLink.findById(req.params.id)
      .populate('artist', 'name');
    
    if (!smartLink) {
      return res.status(404).json({
        success: false,
        message: "Smart Link non trouvé"
      });
    }
    
    // Période
    const period = req.query.period || 'all';
    let startDate = new Date(0);
    let periodLabel = 'Toute la période';
    
    if (period !== 'all') {
      const now = new Date();
      
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          periodLabel = 'Aujourd\'hui';
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          periodLabel = 'Hier';
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          periodLabel = '7 derniers jours';
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          periodLabel = '30 derniers jours';
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          periodLabel = '12 derniers mois';
          break;
      }
    }
    
    // Récupérer les statistiques
    const visits = await db.visit.countDocuments({
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    const uniqueVisits = await db.visit.distinct('ip', {
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    const shares = await db.share.countDocuments({
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    const clicks = await db.click.countDocuments({
      smartLink: smartLink._id,
      timestamp: { $gte: startDate }
    });
    
    // Répartition des clics par plateforme
    const platformClicks = await db.click.aggregate([
      {
        $match: {
          smartLink: smartLink._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Évolution des visites par jour
    const visitsByDay = await db.visit.aggregate([
      {
        $match: {
          smartLink: smartLink._id,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format d'export
    const format = req.params.format.toLowerCase();
    
    if (format === 'csv') {
      // Générer le CSV
      let csv = 'Statistiques du Smart Link\n';
      csv += `Titre: ${smartLink.title}\n`;
      csv += `Artiste: ${smartLink.artist.name}\n`;
      csv += `Période: ${periodLabel}\n\n`;
      
      csv += 'Métriques globales\n';
      csv += `Visites totales,${visits}\n`;
      csv += `Visiteurs uniques,${uniqueVisits.length}\n`;
      csv += `Partages,${shares}\n`;
      csv += `Clics sur les plateformes,${clicks}\n\n`;
      
      csv += 'Clics par plateforme\n';
      csv += 'Plateforme,Nombre de clics\n';
      platformClicks.forEach(item => {
        csv += `${item._id},${item.count}\n`;
      });
      
      csv += '\nVisites par jour\n';
      csv += 'Date,Nombre de visites\n';
      visitsByDay.forEach(item => {
        csv += `${item._id},${item.count}\n`;
      });
      
      // Envoyer le CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=stats_${smartLink.slug}.csv`);
      res.status(200).send(csv);
    } else if (format === 'pdf') {
      // Générer le PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      
      // Créer le répertoire de sortie s'il n'existe pas
      const outputDir = path.join(__dirname, '../../public/exports');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Chemin du fichier PDF
      const fileName = `stats_${smartLink.slug}_${Date.now()}.pdf`;
      const filePath = path.join(outputDir, fileName);
      
      // Créer le flux d'écriture
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Titre
      doc.fontSize(20).text('Rapport de statistiques', { align: 'center' });
      doc.moveDown();
      
      // Informations du Smart Link
      doc.fontSize(14).text(`Smart Link: ${smartLink.title}`);
      doc.fontSize(12).text(`Artiste: ${smartLink.artist.name}`);
      doc.text(`Période: ${periodLabel}`);
      doc.moveDown();
      
      // Métriques globales
      doc.fontSize(16).text('Métriques globales');
      doc.fontSize(12).text(`Visites totales: ${visits}`);
      doc.text(`Visiteurs uniques: ${uniqueVisits.length}`);
      doc.text(`Partages: ${shares}`);
      doc.text(`Clics sur les plateformes: ${clicks}`);
      doc.moveDown();
      
      // Clics par plateforme
      doc.fontSize(16).text('Clics par plateforme');
      doc.fontSize(12);
      
      const platformTable = {
        headers: ['Plateforme', 'Nombre de clics'],
        rows: platformClicks.map(item => [item._id, item.count.toString()])
      };
      
      // Tableau simple
      const tableTop = doc.y;
      const tableLeft = 50;
      const cellPadding = 5;
      const colWidth = 200;
      
      // En-têtes
      doc.text(platformTable.headers[0], tableLeft, tableTop);
      doc.text(platformTable.headers[1], tableLeft + colWidth, tableTop);
      
      // Ligne de séparation
      doc.moveTo(tableLeft, tableTop + 20)
         .lineTo(tableLeft + colWidth * 2, tableTop + 20)
         .stroke();
      
      // Lignes de données
      let rowTop = tableTop + 30;
      platformTable.rows.forEach(row => {
        doc.text(row[0], tableLeft, rowTop);
        doc.text(row[1], tableLeft + colWidth, rowTop);
        rowTop += 20;
      });
      
      doc.moveDown(platformTable.rows.length + 2);
      
      // Visites par jour
      doc.fontSize(16).text('Visites par jour');
      doc.fontSize(12);
      
      const dayTable = {
        headers: ['Date', 'Nombre de visites'],
        rows: visitsByDay.map(item => [item._id, item.count.toString()])
      };
      
      // Tableau simple
      const dayTableTop = doc.y;
      
      // En-têtes
      doc.text(dayTable.headers[0], tableLeft, dayTableTop);
      doc.text(dayTable.headers[1], tableLeft + colWidth, dayTableTop);
      
      // Ligne de séparation
      doc.moveTo(tableLeft, dayTableTop + 20)
         .lineTo(tableLeft + colWidth * 2, dayTableTop + 20)
         .stroke();
      
      // Lignes de données
      rowTop = dayTableTop + 30;
      dayTable.rows.forEach(row => {
        doc.text(row[0], tableLeft, rowTop);
        doc.text(row[1], tableLeft + colWidth, rowTop);
        rowTop += 20;
      });
      
      // Finaliser le PDF
      doc.end();
      
      // Attendre que le fichier soit écrit
      stream.on('finish', () => {
        // URL du PDF
        const pdfUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/public/exports/${fileName}`;
        
        res.status(200).json({
          success: true,
          message: "Rapport PDF généré avec succès",
          pdfUrl
        });
      });
      
      stream.on('error', (error) => {
        res.status(500).json({
          success: false,
          message: "Erreur lors de la génération du PDF",
          error: error.message
        });
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Format non supporté. Formats disponibles: csv, pdf"
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'exportation des statistiques",
      error: error.message
    });
  }
};

/**
 * Fonction interne pour enregistrer une visite
 */
const recordVisitInternal = async (smartLinkId, req) => {
  await db.visit.create({
    smartLink: smartLinkId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer || '',
    timestamp: Date.now()
  });
};

/**
 * Fonction pour générer un slug à partir d'un titre
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/--+/g, '-') // Remplacer les tirets multiples par un seul
    .trim(); // Supprimer les espaces au début et à la fin
};
