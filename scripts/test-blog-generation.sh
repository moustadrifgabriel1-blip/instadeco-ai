#!/bin/bash

# Script de test pour générer un article blog manuellement
# Usage: ./scripts/test-blog-generation.sh

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Test de génération d'article blog${NC}\n"

# Vérifier que CRON_SECRET est défini
if [ -z "$CRON_SECRET" ]; then
  echo -e "${RED}❌ Erreur: CRON_SECRET n'est pas défini${NC}"
  echo "Ajoutez-le dans .env.local:"
  echo "CRON_SECRET=your_secret_key"
  exit 1
fi

# URL de base
BASE_URL="${1:-http://localhost:3000}"

echo -e "📍 URL: ${BASE_URL}/api/cron/generate-articles"
echo -e "🔑 Secret: ${CRON_SECRET}\n"

# Faire la requête
echo -e "${YELLOW}⏳ Génération en cours...${NC}\n"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${BASE_URL}/api/cron/generate-articles")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "HTTP Status: ${HTTP_CODE}\n"
echo -e "Réponse:\n${BODY}\n"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Article généré avec succès!${NC}"
  
  # Extraire le slug si possible
  SLUG=$(echo "$BODY" | grep -o '"slug":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$SLUG" ]; then
    echo -e "\n📰 Article disponible sur:"
    echo -e "   ${BASE_URL}/blog/${SLUG}"
  fi
else
  echo -e "${RED}❌ Échec de la génération${NC}"
  exit 1
fi
