# 🔐 Configuration Variables d'Environnement Vercel

## ⚠️ URGENT - Variables à Configurer

Pour que le site fonctionne correctement, configure ces variables dans **Vercel Dashboard** :

**URL** : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/settings/environment-variables

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
**Valeur** : `SLPGj1ljF8bj3S265EP0q+xxbT6jUFMLXPm5+v6sQ44=`

**Environnements** : Production, Preview, Development

---

## 3️⃣ Gemini AI (**OBLIGATOIRE pour le blog**)

**Nom** : `GEMINI_API_KEY`  
**Valeur** : `AIzaSyD0j-rEkffCDrSn1X-twz_7yHXa1hYvT0o` (clé actuellement dans `.env.local`)

**⚠️ CRITIQUE** : Sans cette variable, le cron de génération échoue silencieusement !  
→ Si aucun article n'est publié depuis 48h : vérifier cette clé EN PREMIER.

**Nom** : `GEMINI_MODEL` *(optionnel — pour override du modèle)*  
**Valeur par défaut** : `gemini-2.0-flash` (rapide ~2-15s, recommandé)  
**Alternatives** : `gemini-2.0-flash-lite` (ultra-rapide), `gemini-1.5-flash` (fallback)

**Comment obtenir une nouvelle clé** :
1. Aller sur https://makersuite.google.com/app/apikey
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

# Replicate (Génération Images)
REPLICATE_API_TOKEN=your_replicate_token

# Gemini AI (❌ MANQUANT - Blog)
GEMINI_API_KEY=your_gemini_api_key

# Stripe (Paiements)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_UNLIMITED=price_...
STRIPE_PRICE_HD_UNLOCK=price_...

# Sécurité Cron (✅ GÉNÉRÉ)
CRON_SECRET=SLPGj1ljF8bj3S265EP0q+xxbT6jUFMLXPm5+v6sQ44=

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=10
```

---

## 🧪 Tester après Configuration

### 1. Tester l'endpoint cron (en local)

```bash
# Démarrer le serveur
npm run dev

# Dans un autre terminal
curl "http://localhost:3000/api/cron/generate-articles?secret=SLPGj1ljF8bj3S265EP0q%2BxxbT6jUFMLXPm5%2Bv6sQ44%3D"
```

### 2. Tester l'endpoint cron (en production)

```bash
curl -H "Authorization: Bearer SLPGj1ljF8bj3S265EP0q+xxbT6jUFMLXPm5+v6sQ44=" \
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
- [x] CRON_SECRET généré et configuré localement
- [ ] CRON_SECRET ajouté sur Vercel
- [ ] GEMINI_API_KEY obtenu et configuré
- [ ] REPLICATE_API_TOKEN configuré
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

**Dernière mise à jour** : 21 janvier 2026
