# 📋 API SmartLinks HTML - Architecture Simplifiée

## 🎯 Vue d'ensemble

Cette API REST permet de gérer des SmartLinks optimisés pour l'architecture HTML simplifiée avec rendu Puppeteer pour les métadonnées Open Graph.

**Base URL:** `/api/v1/smartlinks-html`

---

## 🔗 Endpoints

### 📋 **GET** `/api/v1/smartlinks-html`
Récupère la liste des SmartLinks avec pagination

**Query Parameters:**
- `page` (number, optionnel) - Page courante (défaut: 1)
- `limit` (number, optionnel) - Éléments par page (défaut: 20, max: 100)
- `search` (string, optionnel) - Recherche par artiste ou titre

**Réponse:**
```json
{
  "success": true,
  "data": {
    "smartlinks": [
      {
        "_id": "...",
        "slug": "jacob-bryant/when-i-get-on-a-roll",
        "artistSlug": "jacob-bryant",
        "trackSlug": "when-i-get-on-a-roll",
        "artist": "Jacob Bryant",
        "title": "When I Get On A Roll",
        "imageUrl": "https://...",
        "viewCount": 42,
        "clickCount": 15,
        "createdAt": "2025-01-01T12:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 3,
      "total": 47,
      "limit": 20
    }
  }
}
```

---

### 🔍 **GET** `/api/v1/smartlinks-html/:slug`
Récupère un SmartLink spécifique par son slug

**URL:** `/api/v1/smartlinks-html/jacob-bryant/when-i-get-on-a-roll`

**Réponse:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "slug": "jacob-bryant/when-i-get-on-a-roll",
    "artistSlug": "jacob-bryant",
    "trackSlug": "when-i-get-on-a-roll",
    "artist": "Jacob Bryant",
    "title": "When I Get On A Roll",
    "description": "Nouveau single country de Jacob Bryant...",
    "imageUrl": "https://i.scdn.co/image/...",
    "spotifyUrl": "https://open.spotify.com/track/...",
    "appleUrl": "https://music.apple.com/...",
    "youtubeUrl": "https://www.youtube.com/watch?v=...",
    "deezerUrl": "https://www.deezer.com/track/...",
    "primaryColor": "#FF6B35",
    "template": "default",
    "viewCount": 42,
    "clickCount": 15,
    "platformClicks": {
      "spotify": 8,
      "apple": 4,
      "youtube": 2,
      "deezer": 1
    },
    "seoTitle": "When I Get On A Roll - Jacob Bryant | MDMC SmartLink",
    "seoDescription": "Écoutez When I Get On A Roll de Jacob Bryant sur Spotify...",
    "isPublished": true,
    "createdAt": "2025-01-01T12:00:00.000Z",
    "updatedAt": "2025-01-03T15:30:00.000Z"
  }
}
```

---

### ✅ **POST** `/api/v1/smartlinks-html`
Crée un nouveau SmartLink

**Body:**
```json
{
  "artist": "Jacob Bryant",
  "title": "When I Get On A Roll",
  "description": "Nouveau single country de Jacob Bryant...",
  "imageUrl": "https://i.scdn.co/image/...",
  "spotifyUrl": "https://open.spotify.com/track/...",
  "appleUrl": "https://music.apple.com/...",
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "deezerUrl": "https://www.deezer.com/track/...",
  "amazonUrl": "https://music.amazon.com/...",
  "tidalUrl": "https://tidal.com/...",
  "soundcloudUrl": "https://soundcloud.com/...",
  "bandcampUrl": "https://artist.bandcamp.com/...",
  "primaryColor": "#FF6B35",
  "template": "default",
  "releaseDate": "2025-01-01"
}
```

**Validation:**
- `artist` (string, requis) - Nom de l'artiste
- `title` (string, requis) - Titre du morceau
- `imageUrl` (URL, requis) - Image de couverture
- Au moins une URL de plateforme requise
- `primaryColor` (hex, optionnel) - Couleur d'accent
- `template` (enum, optionnel) - Template visuel: `default`, `minimal`, `dark`, `gradient`

**Réponse:** `201 Created`
```json
{
  "success": true,
  "message": "SmartLink créé avec succès",
  "data": { /* SmartLink créé */ }
}
```

---

### 🔄 **PUT** `/api/v1/smartlinks-html/:slug`
Met à jour un SmartLink existant

**Body:** Même structure que POST (tous les champs optionnels)

**Réponse:**
```json
{
  "success": true,
  "message": "SmartLink mis à jour avec succès",
  "data": { /* SmartLink mis à jour */ }
}
```

---

### 🗑️ **DELETE** `/api/v1/smartlinks-html/:slug`
Supprime un SmartLink

**Réponse:**
```json
{
  "success": true,
  "message": "SmartLink supprimé avec succès",
  "data": {
    "slug": "jacob-bryant/when-i-get-on-a-roll"
  }
}
```

---

### 📊 **POST** `/api/v1/smartlinks-html/:slug/click`
Enregistre un clic sur une plateforme (analytics)

**Body:**
```json
{
  "platform": "spotify"
}
```

**Plateformes supportées:**
`spotify`, `apple`, `youtube`, `deezer`, `amazon`, `tidal`, `soundcloud`, `bandcamp`

**Réponse:**
```json
{
  "success": true,
  "message": "Clic enregistré",
  "data": {
    "clickCount": 16,
    "platformClicks": {
      "spotify": 9,
      "apple": 4,
      "youtube": 2,
      "deezer": 1
    }
  }
}
```

---

## 🤖 Middleware Puppeteer SEO

### 🔗 **GET** `/smartlinks/:artistSlug/:trackSlug`
Route publique pour les bots sociaux et SEO

**Détection automatique:**
- **Bots sociaux** (Facebook, Twitter, WhatsApp, etc.) → HTML statique avec métadonnées Open Graph
- **Utilisateurs humains** → Redirection vers SPA Vue.js après 1.5 secondes

**User-Agents détectés:**
- `facebookexternalhit` - Facebook
- `twitterbot` - Twitter
- `linkedinbot` - LinkedIn  
- `whatsapp` - WhatsApp
- `googlebot` - Google
- Et autres...

**Test manuel:** Ajouter `?seo=true` pour forcer le rendu SEO

**Exemple:**
- Bot: `GET /smartlinks/jacob-bryant/when-i-get-on-a-roll` → HTML avec métadonnées
- Utilisateur: `GET /smartlinks/jacob-bryant/when-i-get-on-a-roll` → Redirection vers `/#/smartlinks/jacob-bryant/when-i-get-on-a-roll`

---

## 🚀 Modèle de données

### SmartLinkHTML Schema

```javascript
{
  // Identifiants
  slug: "jacob-bryant/when-i-get-on-a-roll",    // Unique
  artistSlug: "jacob-bryant",                    // Généré auto
  trackSlug: "when-i-get-on-a-roll",           // Généré auto
  
  // Métadonnées
  artist: "Jacob Bryant",                        // Requis
  title: "When I Get On A Roll",               // Requis
  description: "Nouveau single country...",     // Auto-généré si vide
  imageUrl: "https://...",                      // Requis
  releaseDate: "2025-01-01T00:00:00.000Z",     // Optionnel
  
  // URLs plateformes (au moins une requise)
  spotifyUrl: "https://open.spotify.com/...",
  appleUrl: "https://music.apple.com/...",
  youtubeUrl: "https://www.youtube.com/...",
  deezerUrl: "https://www.deezer.com/...",
  amazonUrl: "https://music.amazon.com/...",
  tidalUrl: "https://tidal.com/...",
  soundcloudUrl: "https://soundcloud.com/...",
  bandcampUrl: "https://artist.bandcamp.com/...",
  
  // Personnalisation
  primaryColor: "#FF6B35",                      // Couleur hex
  template: "default",                          // default|minimal|dark|gradient
  
  // SEO
  seoTitle: "When I Get On A Roll - Jacob Bryant | MDMC SmartLink",
  seoDescription: "Écoutez When I Get On A Roll de Jacob Bryant...",
  
  // Analytics
  viewCount: 42,
  clickCount: 15,
  platformClicks: {
    spotify: 8,
    apple: 4,
    youtube: 2,
    deezer: 1,
    amazon: 0,
    tidal: 0,
    soundcloud: 0,
    bandcamp: 0
  },
  
  // Statut
  isPublished: true,
  createdBy: ObjectId("..."),
  createdAt: "2025-01-01T12:00:00.000Z",
  updatedAt: "2025-01-03T15:30:00.000Z"
}
```

---

## 🎨 Templates visuels

### `default`
- Fond dégradé avec couleur primaire
- Layout carte centrée
- Boutons colorés par plateforme

### `minimal`
- Fond blanc épuré
- Typography sobre
- Boutons monochromes

### `dark`
- Fond noir/gris foncé
- Texte blanc
- Accents colorés

### `gradient`
- Fond dégradé animé
- Effets de transparence
- Style moderne

---

## 📊 Métriques et Analytics

### Événements trackés
- **Page view** - Consultation du SmartLink
- **Platform click** - Clic sur un bouton de plateforme
- **Static SEO view** - Vue par un bot social

### Intégrations
- **Google Analytics 4** - Événements personnalisés
- **Meta Pixel** - Conversions et audiences
- **GTM** - Gestionnaire de tags unifié

---

## 🔧 Configuration

### Variables d'environnement
```bash
# Base de données
MONGO_URI=mongodb://...

# Analytics
GA4_ID=G-P11JTJ21NZ
GTM_ID=GTM-XXXXXXX
META_PIXEL_ID=123456789

# Puppeteer
NODE_ENV=production
PUPPETEER_CACHE_TTL=3600000  # 1 heure en ms
```

### Optimisations Puppeteer
- Cache mémoire avec TTL
- Configuration headless optimisée
- Timeout de 30 secondes
- Rendu statique préféré au rendu dynamique

---

## 🧪 Tests

### Tests unitaires
```bash
npm test
```

### Test de l'API
```bash
node scripts/test-smartlinks-html.js
```

### Test SEO manuel
```bash
curl -H "User-Agent: facebookexternalhit/1.1" \
  "https://www.mdmcmusicads.com/smartlinks/jacob-bryant/when-i-get-on-a-roll"
```

---

## 🚀 Déploiement

### Prérequis
- Node.js 18+
- MongoDB 5+
- Puppeteer dependencies sur le serveur

### Variables critiques
- `MONGO_URI` - Connexion base de données
- `NODE_ENV=production` - Mode production
- Headers CORS configurés pour le domaine

### Monitoring
- Logs des rendus Puppeteer
- Métriques de cache hit/miss  
- Temps de réponse des bots sociaux

---

*Documentation générée pour l'architecture HTML simplifiée MDMC SmartLinks*