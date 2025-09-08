# MDMC v4 Backend - API Principal

## 🎯 **Rôle et Responsabilités**

Ce backend est l'**API principale** de l'écosystème MDMC Music Ads, responsable de toute la logique métier, l'authentification et la gestion des données.

### **Services Fournis**
- **Authentication & Authorization** (JWT, sessions utilisateurs)
- **SmartLinks Management** (CRUD, métadonnées, analytics)
- **Artist & User Management** (profiles, permissions)
- **Marketing Tools** (landing pages, campaigns, integrations)
- **Reviews & Ratings System** (Airtable sync, modération)
- **File Upload & Media Management** (Cloudinary integration)
- **Analytics & Tracking** (clics, conversions, rapports)
- **WordPress Integration** (posts, sync bidirectionnel)
- **Email Services** (Brevo/SendinBlue integration)

## 🏗️ **Architecture Technique**

### **Stack Principal**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary
- **Email**: Brevo API
- **Security**: Helmet, CORS, rate limiting, input sanitization

### **Structure des Dossiers**
```
mdmcv4-backend/
├── src/
│   └── app.js                    # Point d'entrée principal
├── controllers/                  # Logique métier par domaine
│   ├── smartLinkController.js    # Gestion SmartLinks
│   ├── artistController.js       # Gestion Artistes
│   ├── authController.js         # Authentification
│   ├── analyticsController.js    # Analytics & tracking
│   └── ...
├── models/                       # Modèles de données MongoDB
│   ├── SmartLink.js
│   ├── Artist.js
│   ├── User.js
│   └── ...
├── routes/                       # Définition des endpoints
├── middleware/                   # Middlewares personnalisés
├── services/                     # Services externes (Odesli, etc.)
└── scripts/                     # Scripts de maintenance
```

## 🚀 **Déploiement**

### **URL Production**
```
https://api.mdmcmusicads.com
```

### **Variables d'Environnement Requises**
```env
# Database
MONGODB_URI=mongodb://...

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Brevo)
BREVO_API_KEY=

# External APIs
ODESLI_API_URL=https://api.song.link/v1-alpha.1
```

### **Commandes de Déploiement**
```bash
# Installation
npm install

# Développement
npm run dev

# Production
npm start

# Tests
npm test
```

## 📡 **Endpoints Principaux**

### **Authentication**
- `POST /api/v1/auth/register` - Inscription utilisateur
- `POST /api/v1/auth/login` - Connexion
- `POST /api/v1/auth/refresh` - Renouvellement token

### **SmartLinks**
- `GET /api/v1/smartlinks` - Liste SmartLinks
- `POST /api/v1/smartlinks` - Créer SmartLink
- `GET /api/v1/smartlinks/:id` - Détails SmartLink
- `PUT /api/v1/smartlinks/:id` - Modifier SmartLink
- `DELETE /api/v1/smartlinks/:id` - Supprimer SmartLink
- `GET /api/v1/smartlinks/fetch-metadata?url=...` - Récupérer métadonnées Odesli

### **Artists**
- `GET /api/v1/artists` - Liste artistes
- `POST /api/v1/artists` - Créer artiste
- `GET /api/v1/artists/:slug` - Profil artiste

### **Analytics**
- `POST /api/v1/analytics/click` - Enregistrer clic
- `GET /api/v1/analytics/smartlink/:id` - Stats SmartLink
- `GET /api/v1/analytics/dashboard` - Dashboard général

## 🔄 **Intégrations Externes**

### **Odesli API**
- **Service**: `services/odesliService.js`
- **Usage**: Récupération métadonnées musicales depuis URLs plateformes
- **Rate Limiting**: Respecté côté backend

### **Cloudinary**
- **Usage**: Upload et gestion des artworks, médias
- **Optimisation**: Redimensionnement automatique

### **Brevo (SendinBlue)**
- **Usage**: Envoi emails transactionnels, newsletters
- **Templates**: Gérés via dashboard Brevo

## 🔒 **Sécurité**

### **Mesures Implémentées**
- **Rate Limiting**: Protection contre spam/DDoS
- **Input Sanitization**: Protection XSS/injection
- **CORS**: Origines autorisées uniquement
- **JWT**: Tokens sécurisés avec expiration
- **Password Hashing**: bcrypt avec salt
- **Helmet**: Headers de sécurité

## 📊 **Monitoring & Logs**

### **Logs Disponibles**
- **Morgan**: Logs HTTP requests
- **Custom**: Logs métier par domaine
- **Errors**: Stacktraces détaillées

### **Health Check**
- `GET /health` - Status du service
- `GET /api/status` - Status détaillé avec dépendances

## 🔗 **Relations avec Autres Services**

### **mdmcv4-frontend**
- **Consomme**: Toutes les APIs via axios
- **Authentification**: JWT en localStorage
- **Real-time**: Pas d'implémentation WebSocket

### **mdmcv4-smartlinks-service**  
- **Relation**: Services complémentaires
- **Rôle**: Backend principal fournit données, service SmartLinks gère HTML statique
- **Sync**: Via APIs communes

## 🧪 **Tests & Qualité**

### **Scripts de Test**
```bash
# Tests unitaires
npm run test

# Tests d'intégration
node test-controller.js

# Test Odesli
node test-odesli.js
```

### **Environnement de Dev**
- **Auto-reload**: nodemon
- **Debug**: VS Code compatible
- **Database**: MongoDB local ou Atlas

## 📝 **Maintenance**

### **Scripts Utilitaires**
- `scripts/create-admin.js` - Créer utilisateur admin
- `scripts/seed-production-data.js` - Seeding données de prod
- `scripts/test-smartlinks-html.js` - Tests SmartLinks

### **Backup**
- **Database**: MongoDB Atlas automated backups
- **Media**: Cloudinary automatic backup

---

## 🚨 **Notes Importantes**

1. **Ce backend est CRITIQUE** - Il gère toute la donnée métier
2. **Zero downtime**: Déploiements rolling sur Railway
3. **Scaling**: Horizontal scaling possible via load balancer
4. **Dependencies**: Vérifier compatibilité avant updates

**Contact Support**: [email technique]  
**Documentation API**: [Swagger/Postman collection]  
**Monitoring**: [Dashboard URL]
