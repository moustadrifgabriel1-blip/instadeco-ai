# Guide de Déploiement - InstaDeco AI SEO Automation

## Prérequis

- Compte Vercel avec projet configuré
- Compte Supabase avec projet créé
- Clé API Gemini (Google AI Studio)
- Stripe configuré en mode LIVE

---

## 1. Variables d'environnement Vercel

### Variables existantes (déjà configurées)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=https://instadeco.ai
```

### Nouvelles variables à ajouter (SEO Automation)

```bash
# Cron Jobs Security
CRON_SECRET=<générer avec le script ci-dessous>

# AI Content Generation
GEMINI_API_KEY=<votre clé API Google Gemini>
```

### Générer CRON_SECRET

```bash
# Méthode 1: openssl (recommandé)
openssl rand -hex 32

# Méthode 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Méthode 3: Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 2. Migration Supabase

### Exécuter via Supabase Dashboard

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier le contenu de `supabase/migrations/20260120_create_blog_articles.sql`
5. Exécuter la migration

### Ou via CLI Supabase

```bash
# Se connecter
supabase login

# Lier le projet
supabase link --project-ref <your-project-ref>

# Exécuter les migrations
supabase db push
```

---

## 3. Configuration Vercel Cron

Le fichier `vercel.json` est déjà configuré avec 3 cron jobs :

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-articles",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/generate-articles",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/generate-articles",
      "schedule": "0 18 * * *"
    }
  ]
}
```

**Note:** Les cron jobs Vercel sont disponibles uniquement sur les plans **Pro** et **Enterprise**.

---

## 4. Déploiement

### Étapes

```bash
# 1. Commit des changements
git add .
git commit -m "feat: add SEO automation with blog"

# 2. Push vers la branche principale
git push origin main

# 3. Vercel déploie automatiquement
```

### Vérification post-déploiement

1. **Vérifier le build** : Dashboard Vercel > Deployments
2. **Tester le blog** : https://instadeco.ai/blog
3. **Tester l'API** : https://instadeco.ai/api/blog/articles
4. **Vérifier le sitemap** : https://instadeco.ai/sitemap.xml

---

## 5. Test manuel de génération d'article

### Via cURL

```bash
# Tester la génération d'article
curl -X POST "https://instadeco.ai/api/cron/generate-articles" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Via le Dashboard Vercel

1. Aller dans **Settings > Cron Jobs**
2. Cliquer sur "Trigger" à côté du job `/api/cron/generate-articles`

---

## 6. Monitoring

### Logs Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Voir les logs en temps réel
vercel logs --follow
```

### Vérifier les articles générés

```sql
-- Dans Supabase SQL Editor
SELECT id, title, slug, status, created_at 
FROM blog_articles 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 7. IndexNow (Notification moteurs de recherche)

La clé IndexNow est déjà configurée :
- Fichier clé : `/public/7722ff255c24236c9e68335cd4b12bd9.txt`
- Valeur : `7722ff255c24236c9e68335cd4b12bd9`

Les articles sont automatiquement notifiés aux moteurs de recherche après publication.

---

## 8. Dépannage

### Le cron ne s'exécute pas

1. Vérifier que `CRON_SECRET` est configuré dans Vercel
2. Vérifier les logs dans le dashboard Vercel
3. S'assurer que le plan Vercel supporte les crons

### Erreur Gemini API

1. Vérifier que `GEMINI_API_KEY` est valide
2. Vérifier les quotas sur https://console.cloud.google.com
3. Vérifier les logs pour le message d'erreur spécifique

### Articles non visibles

1. Vérifier le status des articles en base (`published` vs `draft`)
2. Vérifier les Row Level Security policies Supabase
3. Vérifier que la migration a bien été exécutée

---

## 9. Checklist finale

- [ ] Variables d'environnement configurées sur Vercel
- [ ] Migration Supabase exécutée
- [ ] Build Vercel réussi
- [ ] Page `/blog` accessible
- [ ] API `/api/blog/articles` fonctionnelle
- [ ] Sitemap inclut `/blog`
- [ ] Header contient lien vers Blog
- [ ] Test manuel de génération d'article réussi

---

## Support

- Documentation Next.js : https://nextjs.org/docs
- Documentation Supabase : https://supabase.com/docs
- Documentation Vercel Cron : https://vercel.com/docs/cron-jobs
- Documentation Gemini API : https://ai.google.dev/docs
