# 🔗 InstaDeco App - Liens Importants

**Date de déploiement** : 21 janvier 2026  
**Version** : 2.0.0

---

## 🌐 URLs Production

### Site Principal
- **Homepage** : https://instadeco.app
- **Génération** : https://instadeco.app/generate
- **Tarifs** : https://instadeco.app/pricing
- **Blog** : https://instadeco.app/blog

### Authentification
- **Inscription** : https://instadeco.app/signup
- **Connexion** : https://instadeco.app/login
- **Dashboard** : https://instadeco.app/dashboard

### SEO
- **Sitemap** : https://instadeco.app/sitemap.xml
- **Robots.txt** : https://instadeco.app/robots.txt

---

## 🔧 Dashboards & Outils

### Vercel
- **Project** : https://vercel.com/saas-deco-interieurs-projects/instadeco.app
- **Deployments** : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/deployments
- **Settings** : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/settings
- **Logs** : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/logs
- **Cron Jobs** : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/settings/cron

### Supabase
- **Dashboard** : https://supabase.com/dashboard
- **SQL Editor** : https://supabase.com/dashboard/project/_/sql
- **Table Editor** : https://supabase.com/dashboard/project/_/editor
- **Auth Users** : https://supabase.com/dashboard/project/_/auth/users
- **Storage** : https://supabase.com/dashboard/project/_/storage

### Stripe
- **Dashboard** : https://dashboard.stripe.com
- **Products** : https://dashboard.stripe.com/products
- **Prices** : https://dashboard.stripe.com/prices
- **Webhooks** : https://dashboard.stripe.com/webhooks
- **Customers** : https://dashboard.stripe.com/customers
- **Payments** : https://dashboard.stripe.com/payments

### Replicate
- **Dashboard** : https://replicate.com/account
- **API Tokens** : https://replicate.com/account/api-tokens
- **Predictions** : https://replicate.com/account/predictions

### Google AI
- **API Keys** : https://makersuite.google.com/app/apikey
- **Gemini Docs** : https://ai.google.dev/docs

---

## 🔍 SEO & Analytics

### Google Search Console
- **Property** : https://search.google.com/search-console
- **Soumettre sitemap** : `https://instadeco.app/sitemap.xml`
- **Performance** : https://search.google.com/search-console/performance
- **Coverage** : https://search.google.com/search-console/coverage

### Bing Webmaster Tools
- **Dashboard** : https://www.bing.com/webmasters
- **Soumettre sitemap** : `https://instadeco.app/sitemap.xml`

### Google Analytics (à configurer)
- **Dashboard** : https://analytics.google.com

---

## 🧪 API Endpoints (Tests)

### Génération d'Images
```bash
# POST /api/v2/generate
curl -X POST https://instadeco.app/api/v2/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "...", "style": "modern", "room": "salon"}'
```

### Crédits
```bash
# GET /api/v2/credits
curl https://instadeco.app/api/v2/credits \
  -H "Authorization: Bearer YOUR_TOKEN"

# GET /api/v2/credits/history
curl https://instadeco.app/api/v2/credits/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Blog
```bash
# GET /api/blog/articles
curl https://instadeco.app/api/blog/articles?page=1&limit=10

# GET /api/blog/[slug]
curl https://instadeco.app/api/blog/comment-decorer-un-petit-salon
```

### Cron (Génération Blog)
```bash
# POST /api/cron/generate-articles
curl -X GET https://instadeco.app/api/cron/generate-articles \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 📊 Monitoring

### Vercel Logs
```bash
# Temps réel
npx vercel logs https://instadeco.app --follow

# Derniers logs
npx vercel logs https://instadeco.app --since 1h
```

### Supabase Logs
```sql
-- Articles générés aujourd'hui
SELECT COUNT(*) FROM blog_articles 
WHERE DATE(created_at) = CURRENT_DATE;

-- Dernières générations
SELECT id, title, slug, status, published_at 
FROM blog_articles 
ORDER BY created_at DESC 
LIMIT 10;

-- Utilisateurs inscrits
SELECT COUNT(*) FROM auth.users;

-- Crédits distribués
SELECT SUM(amount) FROM credit_transactions 
WHERE type = 'purchase';
```

---

## 🎯 Prochaines Actions

### 1. Configuration Vercel (URGENT)
- [ ] Variables d'environnement : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/settings/environment-variables
- [ ] Vérifier les crons : https://vercel.com/saas-deco-interieurs-projects/instadeco.app/settings/cron

### 2. Configuration Stripe
- [ ] Créer produits : https://dashboard.stripe.com/products/create
- [ ] Webhook endpoint : `https://instadeco.app/api/v2/webhooks/stripe`

### 3. SEO
- [ ] Soumettre sitemap Google : https://search.google.com/search-console
- [ ] Soumettre sitemap Bing : https://www.bing.com/webmasters

### 4. Tests
```bash
# Générer un article test
./scripts/test-blog-generation.sh https://instadeco.app

# Redéployer
./scripts/deploy.sh production
```

---

## 📞 Besoin d'aide ?

- **Documentation** : [docs/](../docs/)
- **Vercel Support** : https://vercel.com/support
- **Supabase Support** : https://supabase.com/support
- **Stripe Support** : https://support.stripe.com

---

**Dernière mise à jour** : 21 janvier 2026
