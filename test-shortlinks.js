// test-shortlinks.js
const mongoose = require('mongoose');
require('dotenv').config();

const ShortLink = require('./models/ShortLink');
const SmartLink = require('./models/SmartLink');
const Artist = require('./models/Artist');

const testShortLinks = async () => {
  try {
    // Connexion MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connecté');

    // Test 1: Créer un artiste de test
    let artist = await Artist.findOne({ name: 'Test Artist' });
    if (!artist) {
      artist = await Artist.create({
        name: 'Test Artist',
        slug: 'test-artist',
        description: 'Artiste de test pour ShortLinks'
      });
      console.log('✅ Artiste de test créé:', artist.name);
    } else {
      console.log('✅ Artiste de test trouvé:', artist.name);
    }

    // Test 2: Créer un SmartLink de test
    let smartLink = await SmartLink.findOne({ trackTitle: 'Test Track' });
    if (!smartLink) {
      smartLink = await SmartLink.create({
        trackTitle: 'Test Track',
        artistId: artist._id,
        slug: 'test-track',
        platformLinks: [
          { platform: 'Spotify', url: 'https://spotify.com/test' },
          { platform: 'Apple Music', url: 'https://music.apple.com/test' }
        ]
      });
      console.log('✅ SmartLink de test créé:', smartLink.trackTitle);
    } else {
      console.log('✅ SmartLink de test trouvé:', smartLink.trackTitle);
    }

    // Test 3: Générer un ShortCode
    const shortCode = await ShortLink.generateShortCode();
    console.log('✅ Code court généré:', shortCode);

    // Test 4: Créer un ShortLink
    const shortLink = await ShortLink.create({
      shortCode,
      smartLinkId: smartLink._id
    });
    console.log('✅ ShortLink créé:', shortLink.shortCode);

    // Test 5: Résoudre le ShortLink
    const foundShortLink = await ShortLink.findOne({ shortCode }).populate({
      path: 'smartLinkId',
      select: 'trackTitle slug artistId',
      populate: {
        path: 'artistId',
        select: 'name slug'
      }
    });

    if (foundShortLink) {
      console.log('✅ ShortLink résolu:');
      console.log(`   Code: ${foundShortLink.shortCode}`);
      console.log(`   Track: ${foundShortLink.smartLinkId.trackTitle}`);
      console.log(`   Artist: ${foundShortLink.smartLinkId.artistId.name}`);
      console.log(`   URL: /smartlinks/${foundShortLink.smartLinkId.artistId.slug}/${foundShortLink.smartLinkId.slug}`);
    }

    // Test 6: Test de click tracking
    await foundShortLink.incrementClick({
      country: 'FR',
      referrer: 'https://twitter.com',
      device: 'Mobile'
    });
    console.log('✅ Click incrémenté:', foundShortLink.clickCount);

    // Test 7: Statistiques
    const stats = {
      shortCode: foundShortLink.shortCode,
      totalClicks: foundShortLink.clickCount,
      smartLink: {
        title: foundShortLink.smartLinkId.trackTitle,
        artist: foundShortLink.smartLinkId.artistId.name
      },
      countries: Object.fromEntries(foundShortLink.accessStats?.countries || new Map()),
      referrers: Object.fromEntries(foundShortLink.accessStats?.referrers || new Map()),
      devices: Object.fromEntries(foundShortLink.accessStats?.devices || new Map())
    };
    
    console.log('✅ Statistiques ShortLink:');
    console.log(JSON.stringify(stats, null, 2));

    console.log('\n🎉 Tous les tests ShortLinks passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur test ShortLinks:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Déconnexion MongoDB');
    process.exit(0);
  }
};

// Lancer les tests
testShortLinks();