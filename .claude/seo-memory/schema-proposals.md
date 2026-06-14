# Propositions JSON-LD — seo-schema (InstaDeco AI)

> Brouillon. NON déployé. Validation humaine requise avant intégration.
> Audit du 2026-06-14 — site live https://instadeco.app + code `lib/seo/`.
> AggregateRating : **INTERDIT** — `generation_ratings` = 0 ligne (aucun avis réel).

## État des lieux (ce qui existe déjà — bon)
- **Global layout** (`app/[locale]/layout.tsx`) : Organization + WebSite (SearchAction) + SoftwareApplication, sur toutes les locales.
- **Homepage** (`/[locale]/(marketing)/page.tsx`) : FAQPage (données `Home.faq`, réellement rendues l.191 → pas d'orphelin).
- **Pricing** (`pricing/layout.tsx`) : Product + 3 Offer (MerchantReturnPolicy, OfferShippingDetails) + FAQPage + BreadcrumbList.
- **Generate** (`generate/layout.tsx`) : SoftwareApplication + BreadcrumbList.
- **Deco programmatique** (`deco/[style]/[piece]`) : WebPage + FAQPage + BreadcrumbList.
- **Galerie item** (`g/[id]`) : ImageObject (rendu unique).
- **Blog** (`blog/[slug]`, `blog/page.tsx`) : BlogPosting / Blog — MAIS pages 404 en prod (migration `20260607_blog_language.sql` non appliquée). Schéma jamais servi.

## Findings prioritaires
1. **[HIGH] Pas d'AggregateRating** — correct, garder ainsi tant que `generation_ratings` est vide. Re-vérifier le compte avant toute proposition future.
2. **[HIGH] BlogPosting `url` et `mainEntityOfPage['@id']` = chaîne vide** (`blog/[slug]/page.tsx` l.552, l.573). Champ requis vide = schéma invalide.
3. **[HIGH] SoftwareApplication dupliqué sur `/generate`** : 2 occurrences (layout global + generate/layout) avec 2 AggregateOffer → entité dupliquée. Garder une seule source, idéalement avec `@id`.
4. **[MED] `inLanguage` hardcodé `fr`** dans WebSite/SoftwareApplication/Article (config `language: 'fr'`) servi aussi sur `/en` et `/de`. Doit être par locale.
5. **[MED] `sameAs` = 3 profils** (Twitter/Instagram/Pinterest). Cible ≥10 (Product Hunt, Trustpilot, Capterra, G2, Wikidata, LinkedIn, Crunchbase…). N'ajouter que des profils RÉELS existants.
6. **[MED] Pas de HowTo** nulle part (tuto upload→style→avant/après absent).
7. **[MED] ImageObject galerie = image unique**, pas un couple avant/après (`acquireLicensePage`/paire absente).
8. **[MED] `/essai` (money page)** n'a que le schéma global hérité — pas de FAQ/HowTo/Offer propre au flux d'essai gratuit.
9. **[LOW] Pas de `@id` global** sur SoftwareApplication (Organization/WebSite en ont un). Empêche le liage d'entité propre.

## Snippets cibles proposés (à valider)

### A. HowTo — flux déco (homepage et/ou /generate, /essai)
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Décorer une pièce avec InstaDeco AI",
  "description": "Transformez une photo de pièce en rendu décoré professionnel en 3 étapes.",
  "totalTime": "PT1M",
  "step": [
    { "@type": "HowToStep", "position": 1, "name": "Uploadez votre photo", "text": "Importez une photo de la pièce à décorer.", "url": "https://instadeco.app/fr/generate#upload" },
    { "@type": "HowToStep", "position": 2, "name": "Choisissez un style", "text": "Sélectionnez parmi plus de 20 styles de décoration.", "url": "https://instadeco.app/fr/generate#style" },
    { "@type": "HowToStep", "position": 3, "name": "Recevez votre rendu avant/après", "text": "L'IA génère le rendu décoré en ~30 secondes.", "url": "https://instadeco.app/fr/generate#resultat" }
  ]
}
```
> `inLanguage` à passer par locale. Steps doivent correspondre au contenu visible (sinon orphelin).

### B. ImageObject — couple AVANT/APRÈS (page `g/[id]`)
Proposer un `@graph` à 2 ImageObject reliés, plutôt qu'un seul rendu :
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ImageObject",
      "@id": "<shareUrl>#avant",
      "name": "Avant — <pièce>",
      "contentUrl": "<generation.input_image_url>",
      "caption": "Photo originale avant transformation IA"
    },
    {
      "@type": "ImageObject",
      "@id": "<shareUrl>#apres",
      "name": "Après — <pièce> style <style>",
      "contentUrl": "<generation.output_image_url>",
      "caption": "Rendu décoré style <style> généré par IA",
      "creator": { "@type": "Organization", "@id": "https://instadeco.app/#organization" },
      "isBasedOn": { "@id": "<shareUrl>#avant" },
      "datePublished": "<generation.created_at>"
    }
  ]
}
```

### C. Correction BlogPosting (remplir `url` + `@id`)
```diff
- url: ``,
+ url: getLocalizedCanonicalUrl(locale, `/blog/${article.slug}`),
...
- '@id': ``,
+ '@id': getLocalizedCanonicalUrl(locale, `/blog/${article.slug}`),
```
> À ne faire qu'APRÈS application de `20260607_blog_language.sql` (sinon page 404).

### D. Organization sameAs (≥10, profils RÉELS uniquement)
```json
"sameAs": [
  "https://twitter.com/instadeco_ai",
  "https://instagram.com/instadeco_ai",
  "https://pinterest.com/instadeco_ai"
  /* AJOUTER seulement si réellement créés : LinkedIn, Product Hunt, Trustpilot, Capterra, G2, Crunchbase, Wikidata, Facebook, YouTube, TikTok */
]
```

### E. SoftwareApplication — dédupliquer + `@id` + AggregateRating ABSENT
```json
{
  "@type": "SoftwareApplication",
  "@id": "https://instadeco.app/#software",
  "name": "InstaDeco AI",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Web",
  "url": "https://instadeco.app/fr/generate",
  "offers": { "@type": "AggregateOffer", "lowPrice": "9.90", "highPrice": "34.90", "priceCurrency": "EUR", "offerCount": 3 }
  /* PAS d'aggregateRating : generation_ratings vide */
}
```
> Retirer l'instance de `generate/layout.tsx` OU celle du layout global — pas les deux.

### F. inLanguage par locale (config)
Passer `inLanguage`/`locale` dynamiquement dans `generateWebSiteSchema`, `generateSoftwareAppSchema`, `generateArticleSchema` (actuellement `SEO_CONFIG.language` = `'fr'` figé).

## Hors périmètre schema (à router)
- **Sitemap cassé** : `<loc>` contient un retour ligne littéral (`https://instadeco.app\n/fr`) → URLs invalides. → `seo-sitemap` / `seo-technical`. [CRITICAL]
- **Blog 404** : migration `20260607_blog_language.sql` non appliquée. → ops / migration.
