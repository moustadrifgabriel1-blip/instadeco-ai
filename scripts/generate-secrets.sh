#!/bin/bash
# Script de génération des secrets pour InstaDeco AI

echo "🔐 Génération des secrets InstaDeco AI"
echo "========================================"
echo ""

# CRON_SECRET
CRON_SECRET=$(openssl rand -hex 32)
echo "CRON_SECRET=$CRON_SECRET"
echo ""

echo "📋 Instructions:"
echo "1. Copiez la variable ci-dessus"
echo "2. Allez sur https://vercel.com/[votre-projet]/settings/environment-variables"
echo "3. Ajoutez la variable CRON_SECRET"
echo ""
echo "⚠️  N'oubliez pas d'ajouter aussi GEMINI_API_KEY"
echo "   Obtenez-la sur https://ai.google.dev/"
