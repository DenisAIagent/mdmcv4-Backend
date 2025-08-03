// test-static-pages.js
// Test direct du contrôleur de pages statiques

const { generateStaticPage } = require('./controllers/staticPageController');

// Mock du req et res
const mockRequest = {
  body: {
    shortId: 'test-123',
    trackTitle: 'Cruel Summer',
    artistName: 'Taylor Swift',
    coverImageUrl: 'https://example.com/cover.jpg',
    description: 'Écoutez Cruel Summer de Taylor Swift sur toutes les plateformes',
    platforms: [
      { platform: 'spotify', url: 'https://open.spotify.com/track/123' },
      { platform: 'appleMusic', url: 'https://music.apple.com/track/123' }
    ]
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
    console.log(`📤 Status: ${this.statusCode}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    return this;
  }
};

async function testStaticPageGeneration() {
  console.log('🧪 Test génération page statique\n');
  
  try {
    await generateStaticPage(mockRequest, mockResponse);
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testStaticPageGeneration();