# 🚀 Guide de Déploiement Railway - Backend ShortLinks MDMC

## ⚠️ MISSION CRITIQUE
**Objectif** : Déployer le backend mdmcv4-backend avec fonctionnalité ShortLinks complète sur Railway
**Impact Business** : Restaurer la compétitivité face à Linkfire/Features.fm

---

## 📋 PRÉREQUIS

✅ **Backend complet avec ShortLinks** : `/Users/denisadam/Downloads/mdmcv4-backend/`
✅ **Endpoints ShortLinks** : `/api/v1/shortlinks/*`
✅ **Modèles MongoDB** : ShortLink.js, SmartLink.js, Artist.js
✅ **Configuration Railway** : nixpacks.toml, Dockerfile.production

---

## 🛠️ ÉTAPES DE DÉPLOIEMENT

### 1. CONNEXION RAILWAY
```bash
# Si Railway CLI n'est pas installé
npm install -g @railway/cli

# Connexion à Railway
railway login

# Vérifier connexion
railway whoami
```

### 2. PRÉPARATION DU PROJET
```bash
# Aller dans le dossier backend
cd /Users/denisadam/Downloads/mdmcv4-backend

# Vérifier que tous les fichiers sont présents
ls -la controllers/shortLinkController.js
ls -la routes/shortLinks.routes.js
ls -la models/ShortLink.js

# Vérifier package.json
cat package.json | grep '"start"'
# Doit afficher: "start": "node src/app.js"
```

### 3. CRÉATION/MISE À JOUR DU SERVICE RAILWAY

#### Option A : Nouveau Service
```bash
# Créer un nouveau service
railway init

# Nommer le service
# Nom suggéré: mdmcv4-backend-with-shortlinks
```

#### Option B : Mise à jour du service existant
```bash
# Connecter au service existant
railway link

# Sélectionner : mdmcv4-backend-production-b615
```

### 4. CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

```bash
# Variables CRITIQUES à configurer sur Railway Dashboard
railway variables set MONGO_URI="mongodb://mongo:FmVdSDmdCsIXnQKdNDrTETlJSgGSpiEO@yamanote.proxy.rlwy.net:25766"
railway variables set JWT_SECRET="ecf2c87501c158b712e13d2fc1cb1ada2755a66b1682d97f6401fef66d2953f06323dec23ad2e1d3e3612090d8f9d5b3514de0797a5fbd61fc9c06a1bd1d4b16"
railway variables set JWT_REFRESH_SECRET="54ff1007ba79066674d4b80dff7ee892cc18cd6b27c47378140ab94e8f68387161b61e131c2ea89b72d571b9ecfcd1a1f22a6d216dd8bf24fb543499241717fb"
railway variables set NODE_ENV="production"
railway variables set PORT="5001"
railway variables set FRONTEND_URL="https://www.mdmcmusicads.com"
railway variables set CORS_ORIGIN="https://www.mdmcmusicads.com"

# Variables EMAIL (si nécessaires)
railway variables set EMAIL_HOST="smtp.mailgun.org"
railway variables set EMAIL_USER="postmaster@sandbox63365fba544340f696316496671eb633.mailgun.org"
railway variables set EMAIL_PASSWORD="MARKETING_MAIL_SMTP_MDMC_2@25"

# Variables Cloudinary
railway variables set CLOUDINARY_CLOUD_NAME="dwv1otztl"
railway variables set CLOUDINARY_API_KEY="157592992482694"
railway variables set CLOUDINARY_API_SECRET="n4l6NutwEMsIjJ8QNuqrpxXEQCQ"
```

### 5. DÉPLOIEMENT
```bash
# Déployer le backend complet
railway up

# Suivre les logs de déploiement
railway logs

# Vérifier le statut
railway status
```

### 6. OBTENIR L'URL DE PRODUCTION
```bash
# Récupérer l'URL du service déployé
railway domain

# URL typique : https://mdmcv4-backend-production-XXXX.up.railway.app
```

---

## 🧪 TESTS POST-DÉPLOIEMENT

### 1. Test de Santé API
```bash
# Test endpoint principal
curl https://[VOTRE-URL-RAILWAY].up.railway.app/api/v1

# Réponse attendue :
{
  "success": true,
  "message": "API MDMC Music Ads v1 est opérationnelle !",
  "endpoints": {
    "shortlinks": "/api/v1/shortlinks"
  }
}
```

### 2. Test Endpoints ShortLinks
```bash
# Lister les ShortLinks (peut retourner vide si aucun n'existe)
curl https://[VOTRE-URL-RAILWAY].up.railway.app/api/v1/shortlinks

# Créer un ShortLink (nécessite un SmartLink existant)
curl -X POST https://[VOTRE-URL-RAILWAY].up.railway.app/api/v1/shortlinks \
  -H "Content-Type: application/json" \
  -d '{"smartLinkId": "[ID_SMARTLINK_EXISTANT]"}'
```

### 3. Test Résolution ShortLink
```bash
# Test résolution (remplacer ABC123 par un code existant)
curl https://[VOTRE-URL-RAILWAY].up.railway.app/api/v1/shortlinks/ABC123
```

---

## 🔧 DÉPANNAGE

### Erreur "Cannot GET /api/v1/shortlinks"
**Cause** : Routes non montées correctement
**Solution** : Vérifier que `app.use('/api/v1/shortlinks', shortLinksRoutes)` est présent dans `src/app.js`

### Erreur de Connexion MongoDB
**Cause** : Variable MONGO_URI mal configurée
**Solution** : 
```bash
railway variables get MONGO_URI
# Vérifier l'URL complète de connexion
```

### Erreur 500 Internal Server Error
**Cause** : Erreur dans le code ou dépendances manquantes
**Solution** :
```bash
railway logs --tail
# Analyser les logs d'erreur
```

### Problème CORS
**Cause** : Frontend ne peut pas accéder à l'API
**Solution** :
```bash
railway variables set CORS_ORIGIN="https://www.mdmcmusicads.com"
railway variables set FRONTEND_URL="https://www.mdmcmusicads.com"
```

---

## 📊 VÉRIFICATION FINALE

### Checklist de Validation
- [ ] ✅ API respond sur `/api/v1`
- [ ] ✅ Endpoint `/api/v1/shortlinks` accessible
- [ ] ✅ MongoDB connecté (pas d'erreurs de connexion)
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ CORS configuré pour le frontend
- [ ] ✅ Logs de déploiement sans erreurs critiques

### URL à Mettre à Jour dans le Frontend
Si l'URL Railway change, mettre à jour dans le frontend :
```javascript
// Frontend - src/services/api.js ou équivalent
const API_BASE_URL = 'https://[NOUVELLE-URL-RAILWAY].up.railway.app/api/v1';
```

---

## 🎯 RÉSULTAT ATTENDU

**Après déploiement réussi** :
- ✅ ShortLinks fonctionnels : `https://mdmc.com/s/ABC123`
- ✅ Tracking des clics opérationnel
- ✅ API complète disponible pour le frontend
- ✅ Compétitivité restaurée vs Linkfire/Features.fm

**Temps estimé** : 15-30 minutes pour un déploiement complet

---

## 📞 SUPPORT
En cas de problème, vérifier :
1. Les logs Railway : `railway logs --tail`
2. Les variables d'environnement : `railway variables`
3. Le statut du service : `railway status`
4. La connectivité MongoDB depuis Railway

---
**Guide créé le** : 1 août 2025
**Version Backend** : mdmcv4-backend v1.0.1
**Objectif** : Déploiement ShortLinks - Mission Critique