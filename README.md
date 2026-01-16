# 🏠 InstantDecor AI

**SaaS B2C de décoration d'intérieur par IA** - Transformez vos photos de pièces en rendus décorés professionnels grâce à Flux.1 + ControlNet.

## 🚀 Stack Technique

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI:** Shadcn/UI (Radix UI)
- **Backend:** Next.js API Routes + Firebase Functions
- **Database:** Firebase Firestore + Firebase Auth + Firebase Storage
- **IA:** Fal.ai (Flux.1 [dev] + ControlNet)
- **Paiements:** Stripe (modèle de crédits)

## 📁 Structure du Projet

```
/app                  # Next.js App Router
  /(auth)            # Routes authentification
  /(dashboard)       # Routes protégées
  /(marketing)       # Routes publiques
  /api               # API Routes
/components          # Composants React
  /ui               # Composants Shadcn/UI
  /layout           # Mise en page
  /features         # Composants métier
/lib                 # Utilitaires et services
  /db               # Clients Supabase
  /ai               # Client Fal.ai
  /payments         # Client Stripe
  /validations      # Schemas Zod
/docs               # Documentation
  CONTEXT.md        # Contrat de contexte complet
```

## 🛠️ Installation

### 1. Cloner et installer les dépendances

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local
```

### 2. Configurer Firebase

1. Créer un projet sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activer **Authentication** (Email/Password + Google)
3. Créer une base **Firestore** (mode production)
4. Activer **Storage**
5. Aller dans **Project Settings > General** et copier la config Firebase dans `.env.local`
6. Générer une clé de compte de service (Settings > Service Accounts) et télécharger le JSON

### 3. Configurer Fal.ai

1. Créer un compte sur [fal.ai](https://fal.ai)
2. Générer une clé API
3. Ajouter `FAL_API_KEY` dans `.env.local`

### 4. Configurer Stripe

1. Créer un compte sur [stripe.com](https://stripe.com)
2. Aller dans **Developers > API keys** (mode test)
3. Copier `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` et `STRIPE_SECRET_KEY`
4. Créer 3 produits avec prix :
   - **Starter:** 10 crédits - 9.99€
   - **Pro:** 30 crédits - 24.99€
   - **Unlimited:** 100 crédits - 69.99€
5. Copier les `price_id` dans `.env.local`
6. Configurer un webhook :
   - URL : `https://votredomaine.com/api/payments/webhook`
   - Événement : `checkout.session.completed`
   - Copier le secret dans `STRIPE_WEBHOOK_SECRET`

### 5. Lancer le projet

```bash
# Mode développement
npm run dev

# Ouvrir http://localhost:3000
```

## 📚 Documentation Complète

**Lire le fichier [docs/CONTEXT.md](docs/CONTEXT.md)** pour :
- Architecture détaillée
- Schéma de base de données complet
- Endpoints API
- Milestones de développement
- Variables d'environnement

## 🎯 Commandes Disponibles

```bash
npm run dev         # Lancer le serveur de développement
npm run build       # Build de production
npm run start       # Lancer en production
npm run lint        # Linter ESLint
npm run type-check  # Vérification TypeScript
```

## 📦 Installation de Shadcn/UI

Pour ajouter des composants Shadcn/UI :

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
```

## 🚢 Déploiement

### Vercel (recommandé)

1. Pusher le code sur GitHub
2. Connecter le repo sur [vercel.com](https://vercel.com)
3. Ajouter les variables d'environnement
4. Déployer automatiquement

### Variables d'environnement en production

⚠️ **Important:** Passer Stripe en mode production et reconfigurer les webhooks avec l'URL de production.

## 📖 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Fal.ai](https://fal.ai/docs)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Shadcn/UI](https://ui.shadcn.com)

## 📄 Licence

Projet privé - Tous droits réservés

---

**Créé par:** @gabrielmoustadrif  
**Date:** 16 janvier 2026  
**Version:** 1.0.0
