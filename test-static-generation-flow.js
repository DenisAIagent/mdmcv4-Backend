// test-static-generation-flow.js
// Test du flow complet de génération de pages statiques

const fs = require('fs').promises;
const path = require('path');

// Import des contrôleurs
const { generateStaticPage } = require('./controllers/staticPageController');

// Mock d'une création de SmartLink complète
async function testCompleteFlow() {
  console.log('🧪 Test du flow complet de génération de page statique\n');

  // Simulation d'une création de SmartLink
  const mockSmartLinkData = {
    _id: '507f1f77bcf86cd799439011', // ObjectId simulé
    shortId: 'taylor-swift-cruel-summer-392836',
    trackTitle: 'Cruel Summer',
    artistName: 'Taylor Swift',
    coverImageUrl: 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647',
    description: 'Écoutez Cruel Summer de Taylor Swift sur toutes les plateformes',
    platforms: [
      { platform: 'Spotify', url: 'https://open.spotify.com/track/1BxfuPKGuaTgP7aM0Bbdwr' },
      { platform: 'Apple Music', url: 'https://music.apple.com/track/1BxfuPKGuaTgP7aM0Bbdwr' },
      { platform: 'YouTube Music', url: 'https://music.youtube.com/watch?v=ic8j13piAhQ' },
      { platform: 'Deezer', url: 'https://www.deezer.com/track/737967292' }
    ]
  };

  // Mock de la requête
  const mockRequest = {
    body: {
      smartlinkId: mockSmartLinkData._id,
      shortId: mockSmartLinkData.shortId,
      trackTitle: mockSmartLinkData.trackTitle,
      artistName: mockSmartLinkData.artistName,
      coverImageUrl: mockSmartLinkData.coverImageUrl,
      description: mockSmartLinkData.description,
      platforms: mockSmartLinkData.platforms
    }
  };

  const mockResponse = {
    statusCode: null,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };

  console.log('📄 1. Génération de la page statique...');
  
  try {
    await generateStaticPage(mockRequest, mockResponse);
    
    if (mockResponse.jsonData && mockResponse.jsonData.success) {
      console.log('✅ Page statique générée avec succès !');
      console.log('📍 URL:', mockResponse.jsonData.data.url);
      console.log('📁 Fichier:', mockResponse.jsonData.data.filePath);
      
      // Vérification que le fichier existe
      const staticFilePath = path.join(__dirname, 'public', 'sl', `${mockSmartLinkData.shortId}.html`);
      
      try {
        const stats = await fs.stat(staticFilePath);
        console.log('✅ Fichier HTML créé:', staticFilePath);
        console.log('📊 Taille:', stats.size, 'bytes');
        
        // Lecture d'un extrait du fichier
        const content = await fs.readFile(staticFilePath, 'utf8');
        const titleMatch = content.match(/<title>(.*?)<\/title>/);
        const ogTitleMatch = content.match(/<meta property="og:title" content="(.*?)"/);
        
        console.log('📋 Titre HTML:', titleMatch?.[1] || 'Non trouvé');
        console.log('📋 Open Graph titre:', ogTitleMatch?.[1] || 'Non trouvé');
        
        console.log('\n🔍 Métadonnées détectées:');
        const metaRegex = /<meta property="og:([^"]+)" content="([^"]*)"/g;
        let match;
        while ((match = metaRegex.exec(content)) !== null) {
          console.log(`   og:${match[1]}: ${match[2]}`);
        }
        
        console.log('\n✅ Test complet réussi !');
        console.log(`🌐 La page sera accessible à: https://www.mdmcmusicads.com/sl/${mockSmartLinkData.shortId}.html`);
        
      } catch (fileError) {
        console.error('❌ Fichier HTML non créé:', fileError.message);
      }
      
    } else {
      console.error('❌ Échec de la génération:', mockResponse.jsonData);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Test des URLs de pages statiques existantes
async function testExistingStaticPages() {
  console.log('\n🔍 Vérification des pages statiques existantes...');
  
  try {
    const staticDir = path.join(__dirname, 'public', 'sl');
    const files = await fs.readdir(staticDir);
    
    console.log(`📁 ${files.length} fichier(s) dans /public/sl/:`);
    
    for (const file of files) {
      if (file.endsWith('.html')) {
        const filePath = path.join(staticDir, file);
        const stats = await fs.stat(filePath);
        console.log(`   📄 ${file} (${stats.size} bytes, modifié: ${stats.mtime.toISOString()})`);
      }
    }
    
  } catch (error) {
    console.log('📁 Aucun fichier statique trouvé ou erreur:', error.message);
  }
}

// Exécution des tests
async function runTests() {
  await testExistingStaticPages();
  await testCompleteFlow();
}

runTests();