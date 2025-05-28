# Documentation des Variables d'Environnement et du Déploiement

Ce document détaille les variables d'environnement nécessaires au fonctionnement du backoffice MDMC Music Ads, ainsi que les instructions de déploiement.

## Variables d'Environnement

### Variables Générales
| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement d'exécution | `development` ou `production` |
| `PORT` | Port du serveur backend | `5000` |
| `FRONTEND_URL` | URL du frontend | `https://www.mdmcmusicads.com` |
| `CORS_ORIGIN` | Origine autorisée pour les requêtes CORS | `https://www.mdmcmusicads.com` |

### Base de Données
| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGO_URI` | URI de connexion MongoDB pour la production | `mongodb://user:password@host:port/database?options` |
| `MONGO_URI_DEV` | URI de connexion MongoDB pour le développement | `mongodb://localhost:27017/mdmc_dev` |

### Authentification
| Variable | Description | Exemple |
|----------|-------------|---------|
| `JWT_SECRET` | Clé secrète pour les tokens JWT | `ecf2c87501c158b712e13d2fc1cb1ada2755a66b1682d97f6401fef66d2953f06323dec23ad2e1d3e3612090d8f9d5b3514de0797a5fbd61fc9c06a1bd1d4b16` |
| `JWT_REFRESH_SECRET` | Clé secrète pour les refresh tokens | `54ff1007ba79066674d4b80dff7ee892cc18cd6b27c47378140ab94e8f68387161b61e131c2ea89b72d571b9ecfcd1a1f22a6d216dd8bf24fb543499241717fb` |
| `JWT_EXPIRE` | Durée de validité des tokens JWT | `30d` |
| `JWT_REFRESH_EXPIRE` | Durée de validité des refresh tokens | `7d` |
| `JWT_COOKIE_EXPIRE` | Durée de validité des cookies en jours | `30` |

### Cloudinary (Stockage d'Images)
| Variable | Description | Exemple |
|----------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud Cloudinary | `dwv1otztl` |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | `157592992482694` |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | `n4l6NutwEMsIjJ8QNuqrpxXEQCQ` |
| `CLOUDINARY_URL` | URL Cloudinary complète | `cloudinary://157592992482694:n4l6NutwEMsIjJ8QNuqrpxXEQCQ@dwv1otztl` |

### Frontend
| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_API_URL` | URL de l'API backend pour le frontend | `https://mdmcv4-backend-production-b615.up.railway.app/api/v1` |

## Instructions de Déploiement

### Prérequis
- Node.js v16+ et npm
- MongoDB (ou accès à une instance MongoDB)
- Compte Cloudinary pour le stockage d'images

### Déploiement Local

#### Backend
1. Cloner le dépôt backend
   ```bash
   git clone https://github.com/DenisAIagent/mdmcv4-Backend.git
   cd mdmcv4-Backend
   ```

2. Installer les dépendances
   ```bash
   npm install
   ```

3. Créer un fichier `.env` à la racine du projet avec les variables d'environnement listées ci-dessus

4. Démarrer le serveur en mode développement
   ```bash
   npm run dev
   ```

#### Frontend
1. Cloner le dépôt frontend
   ```bash
   git clone https://github.com/DenisAIagent/mdmcv4-frontend.git
   cd mdmcv4-frontend
   ```

2. Installer les dépendances
   ```bash
   npm install
   ```

3. Créer un fichier `.env` à la racine du projet avec les variables d'environnement frontend

4. Démarrer le serveur de développement
   ```bash
   npm run dev
   ```

### Déploiement en Production

#### Backend (Railway)
1. Connecter le dépôt GitHub à Railway
2. Configurer les variables d'environnement dans les paramètres du projet Railway
3. Déployer l'application

#### Frontend (Vercel/Netlify)
1. Connecter le dépôt GitHub à Vercel ou Netlify
2. Configurer les variables d'environnement dans les paramètres du projet
3. Déployer l'application

## Sécurité

### Bonnes Pratiques
- Utiliser des secrets forts et uniques pour JWT_SECRET et JWT_REFRESH_SECRET
- Ne jamais exposer les variables d'environnement dans le code source
- Activer HTTPS en production
- Limiter les origines CORS aux domaines nécessaires
- Utiliser des tokens JWT avec une durée de validité raisonnable

### Rotation des Secrets
Il est recommandé de changer régulièrement les secrets JWT pour limiter l'impact d'une éventuelle compromission.

## Surveillance et Maintenance

### Logs
Les logs sont configurés pour être plus détaillés en développement et plus concis en production.

### Monitoring
Pour le monitoring en production, il est recommandé d'utiliser:
- Sentry pour le suivi des erreurs
- Prometheus et Grafana pour le monitoring des performances

## Sauvegarde et Récupération

### Base de Données
Il est recommandé de configurer des sauvegardes automatiques de la base de données MongoDB.

### Stratégie de Récupération
En cas de problème:
1. Restaurer la dernière sauvegarde de la base de données
2. Redéployer l'application avec les mêmes variables d'environnement
3. Vérifier les logs pour identifier et résoudre les problèmes
