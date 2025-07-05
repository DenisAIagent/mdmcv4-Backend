// Test server without MongoDB for local development
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// --- Middlewares ---
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mock authentication middleware with bypass support
const mockAuth = (req, res, next) => {
  // Check for dev-bypass-token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (token === 'dev-bypass-token') {
    console.log('🔓 Auth: Bypass activé pour développement');
    req.user = {
      _id: 'dev-admin-id',
      name: 'Dev Admin',
      email: 'dev@admin.local',
      role: 'admin'
    };
    return next();
  }
  
  // For testing, allow all requests
  req.user = {
    _id: 'test-user-id',
    name: 'Test User',
    email: 'test@admin.local',
    role: 'admin'
  };
  next();
};

// Mock SmartLinks data
const mockSmartlinks = [
  {
    _id: 'mock-id-1',
    trackTitle: 'Test Track 1',
    artistId: {
      _id: 'artist-1',
      name: 'Test Artist 1',
      slug: 'test-artist-1'
    },
    slug: 'test-track-1',
    isPublished: true,
    viewCount: 150,
    platformClickCount: 45,
    coverImageUrl: 'https://via.placeholder.com/300x300',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-id-2',
    trackTitle: 'Test Track 2',
    artistId: {
      _id: 'artist-2',
      name: 'Test Artist 2',
      slug: 'test-artist-2'
    },
    slug: 'test-track-2',
    isPublished: false,
    viewCount: 75,
    platformClickCount: 20,
    coverImageUrl: 'https://via.placeholder.com/300x300',
    createdAt: new Date().toISOString()
  }
];

// --- Routes ---
app.get('/api/v1', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'API MDMC Test Server is operational!',
    version: '1.0.0-test',
    mode: 'mock-development'
  });
});

// SmartLinks routes
app.get('/api/v1/smartlinks', mockAuth, (req, res) => {
  console.log('📋 SmartLinks: Mock data requested by:', req.user.email);
  res.status(200).json({
    success: true,
    data: mockSmartlinks,
    count: mockSmartlinks.length
  });
});

app.get('/api/v1/smartlinks/:id', mockAuth, (req, res) => {
  const smartlink = mockSmartlinks.find(sl => sl._id === req.params.id);
  if (!smartlink) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: smartlink
  });
});

app.post('/api/v1/smartlinks', mockAuth, (req, res) => {
  console.log('📝 SmartLinks: Creating new smartlink:', req.body);
  const newSmartlink = {
    _id: `mock-id-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    platformClickCount: 0
  };
  
  mockSmartlinks.push(newSmartlink);
  
  res.status(201).json({
    success: true,
    data: newSmartlink
  });
});

app.delete('/api/v1/smartlinks/:id', mockAuth, (req, res) => {
  const index = mockSmartlinks.findIndex(sl => sl._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'SmartLink not found'
    });
  }
  
  mockSmartlinks.splice(index, 1);
  
  res.status(200).json({
    success: true,
    message: 'SmartLink deleted successfully'
  });
});

// Auth routes for testing
app.get('/api/v1/auth/me', mockAuth, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5002;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🧪 Test server started on port ${PORT}`);
  console.log(`🔗 Access at: http://localhost:${PORT}/api/v1`);
  console.log(`🔓 Auth bypass enabled with 'dev-bypass-token'`);
});

process.on('unhandledRejection', (err) => {
  console.error(`ERREUR (Unhandled Rejection): ${err.message || err}`);
  server.close(() => process.exit(1));
});

module.exports = app;