# MDMC SmartLinks - Frontend Vue.js

Architecture Vue.js complète pour la plateforme SmartLinks de MDMC Music Ads.

## 🚀 Fonctionnalités

### Frontend Public
- **Affichage SmartLinks** : Interface optimisée pour les utilisateurs finaux
- **Hash Routing** : Routes SPA avec `/#/smartlinks/:artistSlug/:trackSlug`
- **SEO Optimisé** : Métadonnées Open Graph/Twitter dynamiques avec vue-meta
- **Analytics Intégrés** : Tracking GA4, Meta Pixel, TikTok Pixel
- **Responsive Design** : Interface mobile-first selon charte MDMC

### Back-office Admin
- **Gestion SmartLinks** : CRUD complet avec formulaires avancés
- **Gestion Artistes** : Base de données centralisée
- **Upload Média** : Images de couverture et extraits audio
- **Analytics Dashboard** : Statistiques détaillées et exports
- **Import Automatique** : Intégration Odesli pour récupération des liens

### Architecture Technique
- **Vue 3 + Composition API** : Framework moderne et performant
- **Pinia** : State management réactif
- **Vue Router** : Navigation SPA avec hash routing
- **Vite** : Bundler ultra-rapide
- **SCSS** : Styles selon charte MDMC (Poppins/Inter, variables CSS)

## 🛠️ Installation

### Prérequis
- Node.js 18+ 
- npm 9+
- Backend Express.js démarré sur le port 5001

### Configuration

1. **Cloner et installer**
```bash
cd /Users/denisadam/Downloads/mdmcv4-backend/frontend-vue
npm install
```

2. **Configuration environnement**
```bash
cp .env.example .env.local
# Ajuster les variables selon votre environnement
```

3. **Démarrer en développement**
```bash
npm run dev
# Application disponible sur http://localhost:3000
```

4. **Build pour production**
```bash
npm run build
npm run preview
```

## 📂 Structure du Projet

```
frontend-vue/
├── public/                     # Assets statiques
│   ├── assets/
│   │   ├── images/            # Images et logos
│   │   └── icons/             # Icônes plateformes
│   └── favicon.ico
├── src/
│   ├── components/            # Composants réutilisables
│   │   ├── admin/            # Composants admin
│   │   ├── layout/           # Headers, footers
│   │   └── smartlinks/       # SmartLink Player
│   ├── views/                # Pages complètes
│   │   ├── public/           # Pages publiques
│   │   └── admin/            # Pages admin
│   ├── layouts/              # Layouts principaux
│   ├── stores/               # Stores Pinia
│   ├── services/             # Services API
│   ├── assets/styles/        # Styles SCSS
│   ├── router/               # Configuration Vue Router
│   ├── App.vue               # Composant racine
│   └── main.js               # Point d'entrée
├── package.json
├── vite.config.js            # Configuration Vite
└── README.md
```

## 🎯 Workflow de Création SmartLink

### 1. Interface Admin
```
/admin/smartlinks/create
│
├── Sélection artiste (avec autocomplete)
├── Informations titre (titre, slug, description)
├── Upload média (cover + extrait audio)
├── Liens plateformes
│   ├── Import automatique Odesli
│   └── Ajout manuel par plateforme
├── Configuration (sous-titre, publication)
└── Tracking avancé (GA4, Meta Pixel, etc.)
```

### 2. URL Générée
```
https://www.mdmcmusicads.com/#/smartlinks/jean-michel/a-tout-va
```

### 3. Affichage Public
- **Utilisateur** → SPA Vue.js avec métadonnées dynamiques
- **Bot Social** → Middleware Puppeteer + HTML statique optimisé

## 🔧 API Integration

### Services Disponibles
```javascript
import api from '@/services/api'

// SmartLinks
await api.smartlinks.getBySlug(artistSlug, trackSlug)
await api.smartlinks.create(smartlinkData)
await api.smartlinks.trackView(artistSlug, trackSlug)
await api.smartlinks.trackClick(artistSlug, trackSlug, platform)

// Artistes
await api.artists.getAll()
await api.artists.search(query)

// Upload
await api.upload.uploadImage(file, 'cover')
await api.upload.uploadAudio(file)

// Analytics
await api.analytics.getDashboard()
await api.analytics.getSmartlinkStats()
```

### Configuration API
- **Base URL** : `process.env.VUE_APP_API_BASE_URL`
- **Authentification** : JWT Bearer Token
- **Timeout** : 30 secondes
- **Intercepteurs** : Gestion automatique erreurs et auth

## 📊 Analytics et Tracking

### Events Trackés
- **smartlink_view** : Vue d'un SmartLink
- **platform_click** : Clic sur un bouton plateforme
- **smartlink_created** : Création d'un SmartLink (admin)
- **static_smartlink_view** : Vue par un bot (SEO)

### Plateformes Supportées
- Google Analytics 4
- Meta Pixel (Facebook/Instagram)
- TikTok Pixel
- Google Tag Manager

## 🎨 Charte Graphique MDMC

### Couleurs
- **Primaire** : `#E50914` (Rouge MDMC)
- **Secondaire** : `#141414` (Noir profond)
- **Accents** : Variables selon plateformes musicales

### Typographie
- **Principale** : Poppins (Titres, boutons)
- **Secondaire** : Inter (Corps de texte)
- **Responsive** : Échelle fluide avec clamp()

### Composants
- **Boutons** : Arrondis, états hover/focus
- **Cards** : Border-radius 1rem, ombres subtiles
- **SmartLink Player** : Design centré 420px max-width

## 🚦 Routes Principales

### Public
- `/` → HomePage
- `/#/smartlinks/:artistSlug/:trackSlug` → SmartLink Public

### Admin
- `/admin` → Dashboard Admin
- `/admin/smartlinks` → Liste SmartLinks
- `/admin/smartlinks/create` → Création SmartLink
- `/admin/smartlinks/:id/edit` → Édition SmartLink
- `/admin/artists` → Gestion Artistes
- `/admin/analytics` → Tableaux de bord

## 🔍 SEO et Métadonnées

### Métadonnées Dynamiques
```javascript
// Dans SmartLinkPublic.vue
useHead({
  title: `${smartlink.trackTitle} - ${smartlink.artist.name}`,
  meta: [
    { property: 'og:title', content: metaTitle },
    { property: 'og:description', content: metaDescription },
    { property: 'og:image', content: smartlink.coverImageUrl },
    { property: 'og:type', content: 'music.song' },
    { name: 'twitter:card', content: 'summary_large_image' }
  ]
})
```

### Rendu SEO
- **SPA Standard** : Vue.js + vue-meta
- **Bots Sociaux** : Middleware Puppeteer + HTML statique
- **Cache** : 1 heure TTL pour optimiser les performances

## 🧪 Tests et Débogage

### Test SmartLink
```bash
# URL de test
http://localhost:3000/#/smartlinks/test-artist/test-track

# Test SEO (simulation bot)
curl -H "User-Agent: facebookexternalhit/1.1" \
     http://localhost:5001/smartlinks/test-artist/test-track
```

### Debug Analytics
```javascript
// Activer logs en développement
VUE_APP_ENABLE_ANALYTICS_DEBUG=true

// Vérifier events dans DevTools
gtag('config', 'GA_MEASUREMENT_ID', { debug_mode: true })
```

## 🚀 Déploiement

### Variables d'Environnement Production
```bash
VUE_APP_API_BASE_URL=https://api.mdmcmusicads.com/api/v1
VUE_APP_SITE_URL=https://www.mdmcmusicads.com
VUE_APP_GA4_ID=G-P11JTJ21NZ
NODE_ENV=production
```

### Build Optimisé
```bash
npm run build
# Génère le dossier dist/ prêt pour déploiement
```

### Compatibilité Backend
- **Express.js** : Compatible avec middleware Puppeteer existant
- **Hash Routing** : Pas de configuration serveur nécessaire
- **API REST** : Utilise les endpoints `/api/v1/` existants

## 📋 TODO et Évolutions

- [ ] Mode hors ligne avec Service Worker
- [ ] Tests unitaires (Vitest + Testing Library)
- [ ] Tests E2E (Playwright)
- [ ] PWA avec notifications push
- [ ] Import CSV en masse
- [ ] API GraphQL
- [ ] Mode sombre
- [ ] Internationalisation (i18n)

## 🤝 Contribution

### Standards de Code
- **ESLint** : Configuration Vue.js recommandée
- **Prettier** : Formatage automatique
- **Conventional Commits** : Messages de commit standardisés
- **SCSS** : Variables partagées dans `variables.scss`

### Règles MDMC
- ❌ **Jamais d'emojis** dans le code ou interfaces
- ✅ **Texte professionnel** uniquement
- 🚫 **Pas de fallbacks** pour logos plateformes
- ✅ **Charte graphique** strictement respectée

---

**Développé par l'équipe MDMC Music Ads**  
*Marketing musical qui convertit* 🎵