#!/bin/bash

# Script de déploiement sur Vercel (instadeco.app)
# Usage: ./scripts/deploy.sh [production|preview]

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Mode de déploiement (production par défaut)
MODE=${1:-production}

echo -e "${YELLOW}🚀 Déploiement InstaDeco AI${NC}\n"

# Vérifier qu'on est sur la branche main pour production
if [ "$MODE" = "production" ]; then
  CURRENT_BRANCH=$(git branch --show-current)
  if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Erreur: Vous devez être sur la branche 'main' pour déployer en production${NC}"
    echo "Branche actuelle: $CURRENT_BRANCH"
    exit 1
  fi
fi

# Vérifier qu'il n'y a pas de changements non commités
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}❌ Erreur: Il y a des changements non commités${NC}"
  echo "Veuillez commiter ou stasher vos changements avant de déployer."
  git status --short
  exit 1
fi

# Build de test en local
echo -e "${YELLOW}📦 Build de test en local...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Échec du build local${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build local réussi${NC}\n"

# Déployer sur Vercel
echo -e "${YELLOW}🌐 Déploiement sur Vercel...${NC}"

if [ "$MODE" = "production" ]; then
  echo "Mode: PRODUCTION (instadeco.app)"
  npx vercel --prod
else
  echo "Mode: PREVIEW"
  npx vercel
fi

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Déploiement réussi!${NC}"
  
  if [ "$MODE" = "production" ]; then
    echo -e "\n🌍 Site disponible sur: ${GREEN}https://instadeco.app${NC}"
  else
    echo -e "\n👀 Preview déployé, lien ci-dessus"
  fi
  
  echo -e "\n📊 Prochaines étapes:"
  echo "  1. Vérifier les variables d'environnement dans Vercel Dashboard"
  echo "  2. Vérifier les cron jobs (Settings > Cron Jobs)"
  echo "  3. Tester la génération d'articles: ./scripts/test-blog-generation.sh https://instadeco.app"
  echo "  4. Soumettre le sitemap à Google Search Console"
else
  echo -e "\n${RED}❌ Échec du déploiement${NC}"
  exit 1
fi
