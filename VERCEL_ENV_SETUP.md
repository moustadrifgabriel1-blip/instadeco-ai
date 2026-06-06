# 🔐 Configuration Variables d'Environnement Vercel

## ⚠️ URGENT - Variables à Configurer

Pour que le site fonctionne correctement, configure ces variables dans **Vercel Dashboard** :

**URL** : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/settings/environment-variables

> 🚨 **SÉCURITÉ** : ne mets JAMAIS de valeur de secret réelle dans ce fichier (il est versionné).
> Génère/copie les secrets uniquement dans le dashboard Vercel et dans `.env.local` (gitignoré).
> Si un secret a déjà été commité, considère-le comme compromis et **rote-le immédiatement**.

---

## 1️⃣ Supabase (DÉJÀ CONFIGURÉ ✅)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 2️⃣ CRON Secret (NOUVEAU)

**Nom** : `CRON_SECRET`
**Valeur** : `<générer avec: openssl rand -base64 32>`

**Environnements** : Production, Preview, Development

---

## 3️⃣ Gemini AI (**OBLIGATOIRE pour le blog**)

**Nom** : `GEMINI_API_KEY`
**Valeur** : `<votre_clé_gemini>` (à stocker uniquement dans Vercel + `.env.local`)

**⚠️ CRITIQUE** : Sans cette variable, le cron de génération échoue silencieusement !
→ Si aucun article n'est publié depuis 48h : vérifier cette clé EN PREMIER.

**Nom** : `GEMINI_MODEL` *(optionnel — pour override du modèle)*
**Valeur par défaut** : `gemini-2.0-flash` (rapide ~2-15s, recommandé)
**Alternatives** : `gemini-2.0-flash-lite` (ultra-rapide), `gemini-1.5-flash` (fallback)

**Comment obtenir une nouvelle clé** :
1. Aller sur https://aistudio.google.com/app/apikey
2. Créer une clé API
3. Copier la valeur

---

## 4️⃣ Replicate (À VÉRIFIER)

```bash
REPLICATE_API_TOKEN=your_replicate_token
```

**Comment obtenir** :
1. Aller sur https://replicate.com/account/api-tokens
2. Créer un token
3. Copier la valeur

---

## 5️⃣ Stripe (À CONFIGURER)

```bash
# Clés publiques/privées
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Prix des produits (à créer dans Stripe Dashboard)
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_UNLIMITED=price_...
STRIPE_PRICE_HD_UNLOCK=price_...
```

**Étapes** :
1. Aller sur https://dashboard.stripe.com/apikeys
2. Copier les clés (mode Test puis Live)
3. Créer les produits : https://dashboard.stripe.com/products
4. Configurer webhook : `https://instadeco.app/api/v2/webhooks/stripe`

---

## 6️⃣ Configuration Complète

```bash
# Next.js
NEXT_PUBLIC_APP_URL=https://instadeco.app

# Supabase (✅ CONFIGURÉ)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Provider de génération d'images (fal | gemini)
IMAGE_PROVIDER=fal
FAL_KEY=your_fal_key

# Gemini AI (Blog + génération image si IMAGE_PROVIDER=gemini)
GEMINI_API_KEY=your_gemini_api_key

# Stripe (Paiements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_UNLIMITED=price_...
STRIPE_PRICE_HD_UNLOCK=price_...

# Sécurité Cron (générer: openssl rand -base64 32)
CRON_SECRET=your_cron_secret

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=10
```

---

## 🧪 Tester après Configuration

### 1. Tester l'endpoint cron (en local)

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal (remplace $CRON_SECRET par ta valeur locale)
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/generate-articles
```

### 2. Tester l'endpoint cron (en production)

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://instadeco.app/api/cron/generate-articles
```

### 3. Vérifier les variables configurées

```bash
# Local
grep -E "^[A-Z]" .env.local | wc -l

# Vercel (dans le dashboard)
# Aller sur Settings > Environment Variables
```

---

## 📋 Checklist

- [x] Supabase configuré
- [ ] CRON_SECRET généré et configuré (Vercel + local)
- [ ] GEMINI_API_KEY obtenu et configuré
- [ ] FAL_KEY configuré (si IMAGE_PROVIDER=fal)
- [ ] Stripe configuré (clés + produits)
- [ ] Stripe webhook configuré
- [ ] Site redéployé après config

---

## 🚀 Après Configuration

**Ne pas oublier de redéployer** :

```bash
npx vercel --prod --yes
```

---

**Dernière mise à jour** : juin 2026
