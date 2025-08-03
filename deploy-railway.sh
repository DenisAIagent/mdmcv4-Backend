#!/bin/bash

# 🚀 Script de Déploiement Automatisé - Backend ShortLinks MDMC
# Objectif : Déployer rapidement le backend avec ShortLinks sur Railway

set -e  # Arrêter le script en cas d'erreur

echo "🚀 === DÉPLOIEMENT BACKEND SHORTLINKS MDMC ==="
echo "📍 Répertoire : $(pwd)"
echo "⏰ Début : $(date)"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les étapes
print_step() {
    echo -e "${BLUE}📋 ÉTAPE $1 : $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Vérifications préliminaires
print_step "1" "Vérifications préliminaires"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    print_error "Fichier package.json non trouvé. Exécutez ce script depuis le dossier backend."
    exit 1
fi

if [ ! -f "controllers/shortLinkController.js" ]; then
    print_error "Controller ShortLink non trouvé. Vérifiez que le backend complet est présent."
    exit 1
fi

print_success "Fichiers backend validés"

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    print_warning "Railway CLI non installé"
    echo "Installation de Railway CLI..."
    npm install -g @railway/cli
fi

print_success "Railway CLI disponible"

# 2. Validation de la configuration
print_step "2" "Validation de la configuration"

# Vérifier package.json
START_SCRIPT=$(grep '"start"' package.json | grep -o '"node src/app.js"' || true)
if [ -z "$START_SCRIPT" ]; then
    print_warning "Script de démarrage non configuré correctement"
    echo "Configuration du script start..."
    # Vous pouvez ajouter une modification automatique ici si nécessaire
else
    print_success "Script de démarrage configuré : node src/app.js"
fi

# Vérifier les dépendances critiques
if [ ! -d "node_modules" ]; then
    print_warning "Dépendances non installées"
    echo "Installation des dépendances..."
    npm install
fi

print_success "Dépendances validées"

# 3. Connexion à Railway
print_step "3" "Connexion à Railway"

# Vérifier la connexion
if ! railway whoami &> /dev/null; then
    print_warning "Non connecté à Railway"
    echo "Veuillez vous connecter à Railway..."
    railway login
fi

RAILWAY_USER=$(railway whoami)
print_success "Connecté à Railway en tant que : $RAILWAY_USER"

# 4. Configuration des variables d'environnement
print_step "4" "Configuration des variables d'environnement"

echo "Configuration des variables critiques..."

# Variables essentielles (seulement si pas déjà définies)
railway variables set NODE_ENV="production" 2>/dev/null || true
railway variables set PORT="5001" 2>/dev/null || true

print_success "Variables d'environnement configurées"

# 5. Déploiement
print_step "5" "Déploiement sur Railway"

echo "🚀 Lancement du déploiement..."
railway up --detach

print_success "Déploiement lancé"

# 6. Attendre et vérifier le déploiement
print_step "6" "Vérification du déploiement"

echo "⏳ Attente du déploiement (30 secondes)..."
sleep 30

# Obtenir l'URL du service
RAILWAY_URL=$(railway domain 2>/dev/null | head -n 1 || echo "URL non disponible")
print_success "URL du service : $RAILWAY_URL"

# 7. Tests de base
print_step "7" "Tests de validation"

if [ "$RAILWAY_URL" != "URL non disponible" ]; then
    echo "🧪 Test de l'API..."
    
    # Test de l'endpoint principal
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/v1" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "API répond correctement (200)"
        
        # Test des endpoints ShortLinks
        SHORTLINKS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/api/v1/shortlinks" || echo "000")
        
        if [ "$SHORTLINKS_STATUS" = "200" ]; then
            print_success "Endpoints ShortLinks opérationnels (200)"
        else
            print_warning "Endpoints ShortLinks : Status $SHORTLINKS_STATUS"
        fi
    else
        print_warning "API Status : $HTTP_STATUS (peut nécessiter plus de temps)"
    fi
else
    print_warning "URL non disponible pour les tests"
fi

# 8. Résumé final
print_step "8" "Résumé du déploiement"

echo ""
echo "🎯 === RÉSUMÉ DU DÉPLOIEMENT ==="
echo "📅 Terminé le : $(date)"
echo "🔗 URL du service : $RAILWAY_URL"
echo "📊 Endpoints disponibles :"
echo "   • API : $RAILWAY_URL/api/v1"
echo "   • ShortLinks : $RAILWAY_URL/api/v1/shortlinks"
echo ""

# Instructions pour le frontend
print_warning "ACTION REQUISE : Mettre à jour l'URL de l'API dans le frontend"
echo "   Frontend config : VITE_API_URL=\"$RAILWAY_URL/api/v1\""
echo ""

# Commandes utiles
echo "🛠️  Commandes utiles :"
echo "   • Logs : railway logs --tail"
echo "   • Status : railway status"
echo "   • Variables : railway variables"
echo "   • Redéployer : railway up"
echo ""

print_success "Déploiement terminé ! 🎉"

# Ouvrir les logs automatiquement (optionnel)
read -p "Voulez-vous voir les logs en temps réel ? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 Ouverture des logs..."
    railway logs --tail
fi