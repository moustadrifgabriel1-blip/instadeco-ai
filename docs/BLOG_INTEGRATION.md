# 📰 Blog InstaDeco - Guide d'Intégration

## ✅ Statut : **Intégré et Fonctionnel**

Le blog est maintenant **complètement intégré** sur le site InstaDeco AI.

---

## 🔗 Accès au Blog

### Sur le Site

1. **Navigation principale** : Cliquer sur "Blog" dans le header
2. **Page d'accueil** : Lien "📰 Lire le blog" en bas de page
3. **Footer** : Lien "Blog" dans la section "Produit"
4. **URL directe** : [http://localhost:3000/blog](http://localhost:3000/blog) (dev) ou `https://instadeco.ai/blog` (production)

### Structure des URLs

- **Liste des articles** : `/blog`
- **Article détaillé** : `/blog/[slug]`
- **Filtrage par tag** : `/blog?tag=decoration-scandinave`
- **Recherche** : `/blog?search=salon`
- **Pagination** : `/blog?page=2`

---

## 🎨 Pages du Blog

### 1. Page Liste (`/blog`)

**Fichier** : [app/blog/page.tsx](../app/blog/page.tsx)

**Fonctionnalités** :
- ✅ Affiche les articles publiés
- ✅ Pagination (9 articles par page)
- ✅ Filtrage par tags
- ✅ Recherche full-text
- ✅ Sidebar avec articles récents et tags populaires
- ✅ ISR avec revalidation 60 secondes
- ✅ Métadonnées SEO optimisées

### 2. Page Détail (`/blog/[slug]`)

**Fichier** : [app/blog/\[slug\]/page.tsx](../app/blog/[slug]/page.tsx)

**Fonctionnalités** :
- ✅ Affichage de l'article complet
- ✅ Métadonnées dynamiques par article
- ✅ Schema.org JSON-LD (Article)
- ✅ Liens internes automatiques
- ✅ Table des matières
- ✅ Articles similaires
- ✅ SSG + ISR (revalidate: 3600s)

---

## 🚀 Génération Automatique d'Articles

### Configuration Vercel Cron

**Fichier** : [vercel.json](../vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-articles",
      "schedule": "0 6 * * *"   // 6h matin
    },
    {
      "path": "/api/cron/generate-articles",
      "schedule": "0 12 * * *"  // 12h après-midi
    },
    {
      "path": "/api/cron/generate-articles",
      "schedule": "0 18 * * *"  // 18h soir
    }
  ]
}
```

### Endpoint Cron

**Fichier** : [app/api/cron/generate-articles/route.ts](../app/api/cron/generate-articles/route.ts)

**Sécurité** : Protégé par `CRON_SECRET`

**Processus** :
1. Sélectionne un thème aléatoire non utilisé
2. Génère le contenu via Gemini AI
3. Post-traitement anti-IA
4. Insertion de liens internes
5. Publication automatique
6. Notification (optionnel)

### Tester la Génération Manuellement

```bash
# En local (dev)
curl http://localhost:3000/api/cron/generate-articles?secret=YOUR_CRON_SECRET

# En production
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://instadeco.ai/api/cron/generate-articles
```

---

## 📊 API Routes Blog

### 1. Liste des Articles

**GET** `/api/blog/articles`

**Query params** :
- `page` : Numéro de page (défaut: 1)
- `limit` : Articles par page (défaut: 10)
- `status` : Filtrer par statut (`published`, `draft`)
- `tag` : Filtrer par tag
- `search` : Recherche full-text

**Exemple** :
```bash
curl http://localhost:3000/api/blog/articles?page=1&limit=9&status=published
```

### 2. Article par Slug

**GET** `/api/blog/[slug]`

**Exemple** :
```bash
curl http://localhost:3000/api/blog/comment-decorer-un-petit-salon
```

### 3. Notification SEO

**POST** `/api/blog/notify-seo`

Notifie Google Search Console & Bing d'un nouvel article (webhook).

---

## 🎨 Composants UI

### ArticleCard

**Fichier** : [components/features/blog/ArticleCard.tsx](../components/features/blog/ArticleCard.tsx)

Affiche une carte article avec :
- Image (placeholder si absente)
- Titre
- Extrait
- Tags
- Date de publication
- Temps de lecture

### BlogSidebar

**Fichier** : [components/features/blog/BlogSidebar.tsx](../components/features/blog/BlogSidebar.tsx)

Affiche :
- Articles récents
- Tags populaires

### Pagination

**Fichier** : [components/features/blog/Pagination.tsx](../components/features/blog/Pagination.tsx)

Navigation entre pages avec :
- Boutons Précédent/Suivant
- Numéros de pages
- État actif

---

## 📝 Thèmes d'Articles

**Fichier** : [src/shared/constants/blog-themes.ts](../src/shared/constants/blog-themes.ts)

**120+ thèmes disponibles** répartis en 3 sessions :

- **Matin (6h)** : Guides pratiques
- **Après-midi (12h)** : Inspirations et tendances
- **Soir (18h)** : Conseils et analyses

**Exemples de thèmes** :
- "Comment décorer un petit salon sans se ruiner"
- "10 erreurs à éviter dans une chambre minimaliste"
- "Tendances déco 2026 : ce qui va cartonner"
- "Guide complet de la décoration bohème chic"

---

## 🔧 Configuration Requise

### Variables d'Environnement

```bash
# Gemini AI (génération contenu)
GEMINI_API_KEY=your_gemini_api_key

# Cron Job (sécurité)
CRON_SECRET=your_random_secret_key

# Supabase (base de données)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Table Supabase

La table `blog_articles` doit être créée avec :
- Full-text search (PostgreSQL `tsvector`)
- Row Level Security (RLS)
- Indexes sur `slug`, `status`, `publishedAt`, `tags`

**Script SQL** : Voir [docs/SEO_AUTOMATION_PLAN.md](SEO_AUTOMATION_PLAN.md) Phase 2

---

## ✅ Checklist d'Intégration

- [x] Table `blog_articles` créée dans Supabase
- [x] Page liste `/blog` fonctionnelle
- [x] Page détail `/blog/[slug]` fonctionnelle
- [x] Navigation Header avec lien "Blog"
- [x] Footer avec lien "Blog"
- [x] Page d'accueil avec CTA blog
- [x] Composants UI (ArticleCard, Sidebar, Pagination)
- [x] API Routes (`/api/blog/articles`, `/api/blog/[slug]`)
- [x] Endpoint Cron (`/api/cron/generate-articles`)
- [x] Configuration `vercel.json` avec crons
- [x] Métadonnées SEO optimisées
- [x] ISR/SSG pour performances

---

## 🚀 Déploiement

### 1. Pusher le Code

```bash
git add .
git commit -m "feat: intégration complète du blog SEO"
git push origin main
```

### 2. Déployer sur Vercel

Le déploiement est automatique si le projet est connecté à Vercel.

### 3. Configurer les Variables d'Environnement

Dans Vercel Dashboard :
1. Aller dans **Settings > Environment Variables**
2. Ajouter `GEMINI_API_KEY`
3. Ajouter `CRON_SECRET` (générer avec `openssl rand -base64 32`)
4. Ajouter les variables Supabase

### 4. Vérifier les Crons

Dans Vercel Dashboard :
1. Aller dans **Settings > Cron Jobs**
2. Vérifier que les 3 crons sont actifs (6h, 12h, 18h)

### 5. Tester un Article

Attendre 24h ou forcer une génération :

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://instadeco.ai/api/cron/generate-articles
```

---

## 📈 Monitoring

### Logs Vercel

Vérifier les logs des crons dans Vercel Dashboard > Logs.

### Table Supabase

Vérifier les articles générés dans Supabase Dashboard :

```sql
SELECT id, title, slug, status, published_at 
FROM blog_articles 
ORDER BY published_at DESC 
LIMIT 10;
```

### Google Search Console

Après quelques jours, vérifier l'indexation :
1. Soumettre le sitemap : `https://instadeco.ai/sitemap.xml`
2. Vérifier les articles indexés

---

## 🎯 Prochaines Étapes

- [ ] Soumettre le sitemap à Google Search Console
- [ ] Soumettre le sitemap à Bing Webmaster Tools
- [ ] Configurer Google Analytics pour le blog
- [ ] Ajouter des images générées (optionnel)
- [ ] Créer des newsletters hebdomadaires (optionnel)

---

**Document créé le** : 21 janvier 2026  
**Version** : 1.0.0
