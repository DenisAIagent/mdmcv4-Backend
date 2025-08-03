# ⚡ DÉPLOIEMENT RAPIDE - ShortLinks Backend

## 🚨 COMMANDES CRITIQUES

### Déploiement Automatique
```bash
cd /Users/denisadam/Downloads/mdmcv4-backend
./deploy-railway.sh
```

### Déploiement Manuel (3 commandes)
```bash
cd /Users/denisadam/Downloads/mdmcv4-backend
railway login
railway up
```

## 🧪 TEST IMMÉDIAT

### Vérifier que l'API fonctionne
```bash
curl https://[URL-RAILWAY]/api/v1
```

**Réponse attendue** :
```json
{
  "success": true,
  "endpoints": {
    "shortlinks": "/api/v1/shortlinks"
  }
}
```

### Test ShortLinks
```bash
curl https://[URL-RAILWAY]/api/v1/shortlinks
```

## 🔧 DÉPANNAGE RAPIDE

### Erreur 404 sur /api/v1/shortlinks
```bash
railway logs --tail
# Chercher : "shortLinks routes mounted"
```

### Variable d'environnement manquante
```bash
railway variables set MONGO_URI="[VOTRE_MONGO_URI]"
```

### Redéployer rapidement
```bash
railway up --detach
```

## ✅ VALIDATION FINALE

- [ ] API répond sur `/api/v1`
- [ ] ShortLinks endpoint disponible
- [ ] Logs sans erreur critique
- [ ] Frontend peut appeler l'API

**Temps estimé : 5-10 minutes**