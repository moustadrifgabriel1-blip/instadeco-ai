# 🚀 Quick Start - InstantDecor AI (Firebase)

## 📦 Installation rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Firebase

# 3. Se connecter à Firebase
npm run firebase:login

# 4. Déployer les règles
npm run firebase:deploy:rules

# 5. Importer les données
npm run seed:firestore

# 6. Lancer le projet
npm run dev
```

---

## 🔑 Variables d'environnement requises

`.env.local`:
```bash
# Firebase (depuis console.firebase.google.com)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre-projet
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Service Account (télécharger depuis Firebase)
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json

# Fal.ai (depuis fal.ai)
FAL_API_KEY=fal_xxxxx
FAL_MODEL_ID=fal-ai/flux-pro/v1.1-ultra

# Stripe (depuis stripe.com)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_PRO=price_xxxxx
STRIPE_PRICE_UNLIMITED=price_xxxxx
```

---

## 🔥 Commandes Firebase essentielles

```bash
# Connexion
npm run firebase:login

# Lister les projets
npm run firebase projects:list

# Déployer les règles de sécurité
npm run firebase:deploy:rules

# Importer les données initiales
npm run seed:firestore

# Lancer les émulateurs locaux
npm run firebase emulators:start

# Déployer tout
npm run firebase:deploy
```

---

## 📝 Commandes npm disponibles

```bash
# Développement
npm run dev              # Lancer Next.js en dev
npm run build            # Build de production
npm run start            # Lancer en production
npm run lint             # Linter ESLint
npm run type-check       # Vérification TypeScript

# Firebase
npm run firebase         # Firebase CLI
npm run firebase:login   # Se connecter
npm run firebase:deploy  # Déployer tout
npm run firebase:deploy:rules  # Déployer uniquement les règles
npm run seed:firestore   # Importer les données
```

---

## 📁 Structure du projet

```
/app                  # Next.js App Router
  /(auth)            # Routes auth (login, signup)
  /(dashboard)       # Routes protégées (dashboard, generate)
  /(marketing)       # Routes publiques (landing, pricing)
  /api               # API Routes
/components          # Composants React
  /ui               # Shadcn/UI
  /layout           # Header, Footer
  /features         # Composants métier
/lib                 # Services
  /firebase         # Firebase clients
  /ai               # Fal.ai client
  /payments         # Stripe client
/docs               # Documentation
  CONTEXT.md        # 📖 MÉMOIRE COMPLÈTE DU PROJET
  FIRESTORE_SCHEMA.md
  FIREBASE_SETUP.md
/scripts            # Scripts utilitaires
```

---

## 🎯 Milestone actuel : 1.1 - Setup Projet

**Checklist:**
- [x] Initialiser Next.js + TypeScript + Tailwind
- [ ] Créer projet Firebase
- [ ] Configurer Authentication
- [ ] Configurer Firestore
- [ ] Configurer Storage
- [ ] Déployer les règles
- [ ] Importer les données
- [ ] Tester l'authentification

---

## 📚 Documentation complète

**À LIRE À CHAQUE SESSION:**
- [docs/CONTEXT.md](docs/CONTEXT.md) - Contexte complet du projet

**Guides:**
- [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) - Setup Firebase pas à pas
- [docs/FIRESTORE_SCHEMA.md](docs/FIRESTORE_SCHEMA.md) - Schéma de la base
- [docs/COPILOT_FIREBASE_COMMANDS.md](docs/COPILOT_FIREBASE_COMMANDS.md) - Commandes Copilot

---

## 🔗 Liens utiles

- **Firebase Console:** https://console.firebase.google.com
- **Fal.ai Dashboard:** https://fal.ai/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Next.js Docs:** https://nextjs.org/docs
- **Firestore Docs:** https://firebase.google.com/docs/firestore

---

## ⚠️ Fichiers à NE JAMAIS commiter

- ❌ `firebase-service-account.json`
- ❌ `.env.local`
- ❌ `.env`
- ❌ `.firebase/` (cache Firebase)

---

## 🆘 Aide rapide

**Problème d'installation?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Firebase ne se connecte pas?**
```bash
npm run firebase:login
npm run firebase projects:list
```

**Erreur "Permission denied"?**
```bash
npm run firebase:deploy:rules
```

**Les données ne s'importent pas?**
```bash
# Vérifier que firebase-service-account.json existe
npm run seed:firestore
```

---

**Prêt à démarrer ? Lancez `npm run dev` !** 🚀
