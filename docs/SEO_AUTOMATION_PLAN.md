# 🚀 SEO AUTOMATION - Plan d'Implémentation InstaDeco

> **Version**: 1.0.0  
> **Date de création**: 20 janvier 2026  
> **Basé sur**: Architecture Hexagonale + Supabase + Next.js 14  
> **Objectif**: 3 articles/jour automatisés pour SEO Suisse/France/Belgique

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture Adaptée](#2-architecture-adaptée)
3. [Plan d'Implémentation par Phases](#3-plan-dimplémentation-par-phases)
4. [Phase 1 - Fondations SEO](#phase-1---fondations-seo)
5. [Phase 2 - Domain & Application Layer](#phase-2---domain--application-layer)
6. [Phase 3 - Infrastructure Layer](#phase-3---infrastructure-layer)
7. [Phase 4 - API Routes & Cron Jobs](#phase-4---api-routes--cron-jobs)
8. [Phase 5 - Frontend Blog](#phase-5---frontend-blog)
9. [Phase 6 - Déploiement & Monitoring](#phase-6---déploiement--monitoring)
10. [Thèmes d'Articles](#thèmes-darticles)
11. [Coûts Estimés](#coûts-estimés)

---

## 1. VUE D'ENSEMBLE

### Qu'est-ce qu'on construit ?

Un système **100% automatisé** qui :
- ✅ Génère 3 articles SEO/jour via Gemini AI (matin, après-midi, soir)
- ✅ Publie sur `/blog` avec HTML statique optimisé
- ✅ Évite la détection IA avec post-processing
- ✅ Ajoute des liens internes automatiquement
- ✅ Notifie Google/Bing/IndexNow
- ✅ Génère sitemap.xml et RSS feed dynamiques

### Stack Adapté (vs Blueprint Original)

| Original (Firebase) | InstaDeco (Supabase) |
|---------------------|----------------------|
| Firebase Functions | Next.js API Routes + Vercel Cron |
| Firestore | Supabase PostgreSQL |
| Firebase Storage | Supabase Storage |
| Firebase Hosting | Vercel |
| Node.js 24 | Next.js 14 Runtime |

### Flux de Données

```
[Vercel Cron] → [API Route /api/v2/blog/generate]
                         ↓
              [GenerateBlogArticleUseCase]
                         ↓
              [GeminiAIService] → Génération contenu
                         ↓
              [AntiAIPostProcessor] → Nettoyage
                         ↓
              [InternalLinksService] → Liens
                         ↓
              [BlogArticleRepository] → Sauvegarde Supabase
                         ↓
              [SEONotificationService] → IndexNow/Google/Bing
```

---

## 2. ARCHITECTURE ADAPTÉE

### Respect de l'Architecture Hexagonale

```
src/
├── domain/
│   ├── entities/
│   │   └── BlogArticle.ts              # NOUVEAU
│   ├── value-objects/
│   │   ├── ArticleSlug.ts              # NOUVEAU
│   │   ├── ArticleStatus.ts            # NOUVEAU
│   │   └── SEOMetadata.ts              # NOUVEAU
│   ├── ports/
│   │   ├── repositories/
│   │   │   └── IBlogArticleRepository.ts   # NOUVEAU
│   │   └── services/
│   │       ├── IAIContentService.ts        # NOUVEAU
│   │       └── ISEONotificationService.ts  # NOUVEAU
│   └── errors/
│       ├── ArticleGenerationError.ts   # NOUVEAU
│       └── DuplicateArticleError.ts    # NOUVEAU
│
├── application/
│   ├── use-cases/
│   │   └── blog/                       # NOUVEAU DOSSIER
│   │       ├── GenerateBlogArticleUseCase.ts
│   │       ├── ListBlogArticlesUseCase.ts
│   │       ├── GetBlogArticleBySlugUseCase.ts
│   │       └── index.ts
│   ├── dtos/
│   │   └── BlogArticleDTO.ts           # NOUVEAU
│   └── mappers/
│       └── BlogArticleMapper.ts        # NOUVEAU
│
├── infrastructure/
│   ├── repositories/
│   │   └── SupabaseBlogArticleRepository.ts   # NOUVEAU
│   └── services/
│       ├── GeminiAIContentService.ts          # NOUVEAU
│       ├── SEONotificationService.ts          # NOUVEAU
│       └── AntiAIPostProcessor.ts             # NOUVEAU
│
├── presentation/
│   └── hooks/
│       └── useBlogArticles.ts          # NOUVEAU
│
└── shared/
    └── constants/
        └── blog-themes.ts              # NOUVEAU (thèmes SEO)
```

### Table Supabase à Créer

```sql
-- Table blog_articles
CREATE TABLE blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    word_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 1,
    anti_ai_score INTEGER DEFAULT 0,
    session_type TEXT, -- 'morning', 'afternoon', 'evening'
    source TEXT DEFAULT 'automation',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX idx_blog_articles_status ON blog_articles(status);
CREATE INDEX idx_blog_articles_published_at ON blog_articles(published_at DESC);

-- RLS - Lecture publique
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blog articles are viewable by everyone" 
    ON blog_articles FOR SELECT USING (status = 'published');
```

---

## 3. PLAN D'IMPLÉMENTATION PAR PHASES

### Vue Chronologique

| Phase | Description | Durée | Prérequis |
|-------|-------------|-------|-----------|
| **1** | Fondations SEO (sitemap, robots, metadata) | 1 jour | - |
| **2** | Domain & Application Layer | 1 jour | Phase 1 |
| **3** | Infrastructure Layer (Gemini, Supabase) | 1-2 jours | Phase 2 |
| **4** | API Routes & Cron Jobs | 1 jour | Phase 3 |
| **5** | Frontend Blog (/blog) | 1-2 jours | Phase 4 |
| **6** | Déploiement & Monitoring | 1 jour | Phase 5 |

**Durée totale estimée : 6-8 jours**

---

## PHASE 1 - FONDATIONS SEO

### Objectif
Mettre en place les bases SEO indispensables AVANT de générer du contenu.

### 1.1 Fichiers à Créer

```
app/
├── sitemap.ts                  # Sitemap dynamique Next.js
├── robots.ts                   # Robots.txt dynamique
├── layout.tsx                  # Metadata globales (à enrichir)
└── blog/
    ├── page.tsx                # Liste des articles
    └── [slug]/
        └── page.tsx            # Article individuel
```

### 1.2 Checklist Phase 1

- [ ] Créer `app/sitemap.ts` (génération dynamique)
- [ ] Créer `app/robots.ts`
- [ ] Enrichir metadata dans `app/layout.tsx`
- [ ] Ajouter Open Graph images
- [ ] Configurer Google Search Console
- [ ] Créer clé IndexNow et fichier de vérification
- [ ] Ajouter `public/{indexnow-key}.txt`

### 1.3 Code de Référence

**app/sitemap.ts**
```typescript
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.ai';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages = [
    { url: `${BASE_URL}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/generate`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  // Articles de blog (à implémenter Phase 4)
  // const articles = await getBlogArticles();
  // const articlePages = articles.map(article => ({
  //   url: `${BASE_URL}/blog/${article.slug}`,
  //   lastModified: article.updatedAt,
  //   changeFrequency: 'monthly',
  //   priority: 0.7,
  // }));

  return [...staticPages];
}
```

**app/robots.ts**
```typescript
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://instadeco.ai';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/login/', '/signup/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
```

---

## PHASE 2 - DOMAIN & APPLICATION LAYER

### Objectif
Définir les entités, value objects et use cases pour le blog.

### 2.1 Fichiers à Créer

```
src/domain/
├── entities/
│   └── BlogArticle.ts
├── value-objects/
│   ├── ArticleSlug.ts
│   ├── ArticleStatus.ts
│   └── SEOMetadata.ts
├── ports/
│   ├── repositories/
│   │   └── IBlogArticleRepository.ts
│   └── services/
│       ├── IAIContentService.ts
│       └── ISEONotificationService.ts
└── errors/
    ├── ArticleGenerationError.ts
    └── DuplicateArticleError.ts

src/application/
├── use-cases/
│   └── blog/
│       ├── GenerateBlogArticleUseCase.ts
│       ├── ListBlogArticlesUseCase.ts
│       ├── GetBlogArticleBySlugUseCase.ts
│       └── index.ts
├── dtos/
│   └── BlogArticleDTO.ts
└── mappers/
    └── BlogArticleMapper.ts
```

### 2.2 Checklist Phase 2

- [ ] Créer entité `BlogArticle.ts`
- [ ] Créer value objects (`ArticleSlug`, `ArticleStatus`, `SEOMetadata`)
- [ ] Créer ports repository et services
- [ ] Créer erreurs métier
- [ ] Créer DTOs et Mappers
- [ ] Créer Use Cases (Generate, List, GetBySlug)
- [ ] Ajouter au DI Container

### 2.3 Specs Techniques

**BlogArticle Entity**
```typescript
interface BlogArticle {
  id: string;
  title: string;
  slug: ArticleSlug;
  content: string;              // HTML
  metaDescription: string;
  tags: string[];
  status: ArticleStatus;        // 'draft' | 'published' | 'archived'
  wordCount: number;
  readingTimeMinutes: number;
  antiAIScore: number;          // 0-100
  sessionType: 'morning' | 'afternoon' | 'evening';
  source: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**GenerateBlogArticleUseCase Input**
```typescript
interface GenerateArticleInput {
  theme: string;
  sessionType: 'morning' | 'afternoon' | 'evening';
}
```

---

## PHASE 3 - INFRASTRUCTURE LAYER

### Objectif
Implémenter les services concrets (Gemini, Supabase, SEO notifications).

### 3.1 Fichiers à Créer

```
src/infrastructure/
├── repositories/
│   └── SupabaseBlogArticleRepository.ts
└── services/
    ├── GeminiAIContentService.ts
    ├── SEONotificationService.ts
    └── AntiAIPostProcessor.ts

src/shared/
└── constants/
    └── blog-themes.ts
```

### 3.2 Checklist Phase 3

- [ ] Créer table Supabase `blog_articles`
- [ ] Implémenter `SupabaseBlogArticleRepository`
- [ ] Implémenter `GeminiAIContentService`
- [ ] Implémenter `SEONotificationService` (IndexNow, Google Ping, Bing Ping)
- [ ] Implémenter `AntiAIPostProcessor`
- [ ] Créer fichier de thèmes d'articles
- [ ] Configurer secret `GEMINI_API_KEY`
- [ ] Configurer `INDEXNOW_KEY`

### 3.3 Variables d'Environnement à Ajouter

```bash
# .env.local

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# SEO
NEXT_PUBLIC_APP_URL=https://instadeco.ai
INDEXNOW_KEY=votre_cle_32_caracteres_hex
```

### 3.4 Mots Interdits (Anti-IA)

```typescript
// À intégrer dans AntiAIPostProcessor.ts
const AI_FORBIDDEN_WORDS = [
  "découvrez", "plongez", "explorez", "n'hésitez pas",
  "il est important de noter", "il convient de", "il est essentiel",
  "dans cet article", "nous allons voir", "vous allez découvrir",
  "en conclusion", "pour conclure", "en résumé", "en somme",
  "de nos jours", "à l'ère de", "dans notre société moderne",
  "précieux conseils", "astuces incontournables", "guide ultime",
];
```

---

## PHASE 4 - API ROUTES & CRON JOBS

### Objectif
Créer les endpoints API et configurer les crons Vercel.

### 4.1 Fichiers à Créer

```
app/api/v2/blog/
├── generate/
│   └── route.ts            # POST - Génère un article
├── articles/
│   ├── route.ts            # GET - Liste les articles
│   └── [slug]/
│       └── route.ts        # GET - Article par slug
├── sitemap/
│   └── route.ts            # GET - Sitemap XML
└── feed/
    ├── rss/
    │   └── route.ts        # GET - RSS Feed
    └── atom/
        └── route.ts        # GET - Atom Feed

vercel.json                 # Configuration crons
```

### 4.2 Configuration Vercel Cron

**vercel.json**
```json
{
  "crons": [
    {
      "path": "/api/v2/blog/generate?session=morning",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/v2/blog/generate?session=afternoon",
      "schedule": "0 14 * * *"
    },
    {
      "path": "/api/v2/blog/generate?session=evening",
      "schedule": "0 18 * * *"
    }
  ]
}
```

### 4.3 Checklist Phase 4

- [ ] Créer route POST `/api/v2/blog/generate`
- [ ] Créer route GET `/api/v2/blog/articles`
- [ ] Créer route GET `/api/v2/blog/articles/[slug]`
- [ ] Créer route GET `/api/v2/blog/sitemap`
- [ ] Créer route GET `/api/v2/blog/feed/rss`
- [ ] Créer `vercel.json` avec crons
- [ ] Sécuriser route generate avec `CRON_SECRET`

### 4.4 Sécurité Cron

```typescript
// app/api/v2/blog/generate/route.ts
export async function POST(req: Request) {
  // Vérifier que c'est bien Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // ... génération article
}
```

---

## PHASE 5 - FRONTEND BLOG

### Objectif
Créer les pages de liste et détail des articles avec SSG/ISR.

### 5.1 Fichiers à Créer

```
app/blog/
├── page.tsx                # Liste des articles (ISR)
├── [slug]/
│   └── page.tsx            # Détail article (SSG + ISR)
└── layout.tsx              # Layout blog

components/features/blog/
├── ArticleCard.tsx
├── ArticleList.tsx
├── ArticleContent.tsx
├── ArticleMeta.tsx
├── RelatedArticles.tsx
└── TableOfContents.ts

src/presentation/hooks/
└── useBlogArticles.ts
```

### 5.2 Checklist Phase 5

- [x] Créer page liste `/blog`
- [x] Créer page détail `/blog/[slug]`
- [x] Créer composants blog (ArticleCard, ArticleList, etc.)
- [x] Configurer ISR (revalidate: 3600)
- [x] Ajouter structured data JSON-LD
- [x] Créer hook `useBlogArticles`
- [x] Ajouter lien blog dans navigation

### 5.3 SEO Metadata par Article

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  
  return {
    title: `${article.title} | Blog InstaDeco`,
    description: article.metaDescription,
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: 'article',
      publishedTime: article.publishedAt,
      authors: ['InstaDeco AI'],
      tags: article.tags,
    },
    alternates: {
      canonical: `https://instadeco.ai/blog/${article.slug}`,
    },
  };
}
```

---

## PHASE 6 - DÉPLOIEMENT & MONITORING

### Objectif
Déployer, configurer le monitoring et valider le système.

### 6.1 Checklist Phase 6

- [x] Déployer sur Vercel
- [x] Vérifier crons dans Vercel Dashboard
- [ ] Soumettre sitemap à Google Search Console
- [ ] Soumettre sitemap à Bing Webmaster Tools
- [x] Configurer alertes (échec génération)
- [x] Tester génération manuelle
- [ ] Vérifier articles générés après 24h

### 6.2 Monitoring

```typescript
// Endpoint health check
// app/api/v2/blog/health/route.ts
export async function GET() {
  const articlesCount = await countArticles();
  const lastArticle = await getLatestArticle();
  
  return Response.json({
    status: 'healthy',
    articlesCount,
    lastArticleDate: lastArticle?.publishedAt,
    cronStatus: 'active',
  });
}
```

### 6.3 Dashboard Analytics (Optionnel)

Intégrer dans le dashboard existant :
- Nombre d'articles publiés
- Trafic organique (via Google Analytics)
- Mots-clés positionnés (via Search Console API)

---

## THÈMES D'ARTICLES

### Décoration d'Intérieur (100+ thèmes)

**Matin (Guides pratiques)**
```typescript
const THEMES_MORNING = [
  "Comment décorer un petit salon sans se ruiner",
  "10 erreurs à éviter dans une chambre minimaliste",
  "Guide complet de la décoration bohème chic",
  "Astuces pour agrandir visuellement une pièce",
  "Les couleurs tendance 2026 pour votre intérieur",
  "Comment créer un coin bureau dans un petit espace",
  "Décoration scandinave : les principes essentiels",
  "Transformer son entrée en espace accueillant",
  "Les plantes d'intérieur faciles d'entretien",
  "Éclairage d'ambiance : guide pratique",
  // ... 40+ thèmes
];
```

**Après-midi (Inspirations et tendances)**
```typescript
const THEMES_AFTERNOON = [
  "Inspiration : salon style industriel moderne",
  "Tendances déco 2026 : ce qui va cartonner",
  "Avant/Après : transformations spectaculaires",
  "Les plus beaux intérieurs Pinterest analysés",
  "Style japandi : le minimalisme qui cartonne",
  "Déco éco-responsable : idées et astuces",
  "Couleur de l'année : comment l'intégrer",
  "Mix and match : oser les mélanges de styles",
  "Home staging : vendre plus vite",
  "Déco vintage : où trouver les bonnes pièces",
  // ... 40+ thèmes
];
```

**Soir (Conseils et analyses)**
```typescript
const THEMES_EVENING = [
  "Pourquoi faire appel à un décorateur d'intérieur",
  "Budget déco : combien prévoir par pièce",
  "Les erreurs déco qui dévaluent votre bien",
  "DIY déco : projets faciles pour le weekend",
  "Feng Shui : aménager pour le bien-être",
  "Matériaux nobles : investissement durable",
  "Décorer un logement locatif sans travaux",
  "Choisir son canapé : guide complet",
  "L'art d'exposer ses collections",
  "Créer une ambiance cocooning pour l'hiver",
  // ... 40+ thèmes
];
```

### Liens Internes à Configurer

```typescript
const INTERNAL_LINKS_MAP = {
  "décoration d'intérieur": "/",
  "transformer votre intérieur": "/generate",
  "génération ia": "/generate",
  "intelligence artificielle déco": "/generate",
  "instadeco": "/",
  "home staging": "/generate",
  "visualisation déco": "/generate",
  "crédits": "/pricing",
  "abonnement": "/pricing",
  "tarifs": "/pricing",
};
```

---

## COÛTS ESTIMÉS

### Mensuels

| Service | Usage | Coût |
|---------|-------|------|
| Vercel Pro | Crons + Hosting | $20/mois |
| Gemini API | ~90 articles/mois | $0-5/mois |
| Supabase | Base existante | Inclus |
| **Total** | | **~$25/mois** |

### ROI Attendu

- **Mois 1-3** : Indexation, peu de trafic
- **Mois 4-6** : Premiers résultats, 500-2000 visites/mois
- **Mois 7-12** : Croissance, 5000-20000 visites/mois
- **An 2+** : Trafic établi, 20000+ visites/mois

---

## 📌 PROCHAINE ÉTAPE

**Commencer par la Phase 1** :

```bash
# Créer les fichiers SEO de base
1. app/sitemap.ts
2. app/robots.ts  
3. Enrichir metadata dans app/layout.tsx
```

Voulez-vous que je commence par la **Phase 1** ?

---

*Document créé pour le projet InstaDeco AI*  
*Architecture Hexagonale + Supabase + Next.js 14*
