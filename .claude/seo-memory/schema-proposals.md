# Propositions JSON-LD — seo-schema (InstaDeco AI)

> Brouillon. NON déployé. Validation humaine requise avant intégration.
> Audit du 2026-07-02, code `lib/seo/` + rendu réel des pages + requête Supabase.
> AggregateRating : **INTERDIT**, `generation_ratings` = 0 ligne réelle (vérifié par requête directe le 02/07). Ne rien proposer tant que ce compte est à 0.

## État des lieux (déjà en place, bon, ne pas re-proposer)
- Layout global : Organization (+`@id`, contactPoint, areaServed, founder Person, foundingDate) + WebSite (SearchAction) + SoftwareApplication.
- `/pro` : Product + Offer abonnement (19/49/99, `UnitPriceSpecification` mensuelle) + FAQPage (commit d499217).
- `/pricing` : Product + 3 Offer + FAQPage + BreadcrumbList.
- `/solution/[slug]` (9 pages) : WebPage + BreadcrumbList + FAQPage + HowTo conditionnel (`page.howTo === true`).
- Blog `[slug]` : BlogPosting (author = Person Gabriel Moustadrif + jobTitle + url /a-propos) + BreadcrumbList + FAQPage auto si ≥2 questions (commit 368c415).
- Pages villes `architecte-interieur/[slug]` : Service + City + ImageObject (a priori, non revérifié ce tour, hors périmètre du diff).
- `/a-propos` : BreadcrumbList + AboutPage.
- `/generate` : SoftwareApplication + BreadcrumbList.

## Findings (ce tour)

1. **[HIGH] `/essai` n'émet AUCUN JSON-LD.** Vérifié : `essai/layout.tsx` et `essai/page.tsx` n'importent ni `JsonLd` ni aucun générateur de schema. C'est une money page du funnel gratuit (citée comme telle dans CLAUDE.md, "essai gratuit repointé /essai"), page orpheline de schema. Risque nul (pas de sur-marquage) mais opportunité manquée pour rich results et AEO.
   - Fix proposé : BreadcrumbList + WebPage (comme `/a-propos`) + FAQPage si la page contient déjà 2+ Q/R visibles (vérifier le contenu avant, ne pas créer de FAQ orpheline). Pas d'Offer ici (l'essai est gratuit, pas un produit payant, un Offer price=0 serait limite et à valider avec seo-content d'abord sur le texte réel affiché).

2. **[MED] `/pro` n'a pas de BreadcrumbList**, contrairement à `/pricing` et `/solution/[slug]` qui en ont un. Incohérence de couverture sur la money page la plus importante du site.
   - Fix proposé : ajouter `generateBreadcrumbList([{ label: 'Pro', path: '/pro' }], { home: {...} })` dans `pro/layout.tsx`, à côté de `generateProSubscriptionSchema` et `generateFAQSchema`.

3. **[MED] Seulement 3 des 9 pages `/solution` ont `howTo:true`** dans `intent-pages-data.ts` (`home-staging-virtuel`, `logiciel-home-staging`, `home-staging-virtuel-agents-immobiliers`). Les 6 autres (`simulateur-decoration-interieur`, `idee-amenagement-studio`, `simulateur-peinture`, `decoration-salon`, `decoration-chambre`, `avant-apres-decoration`, `home-staging-virtuel-prix`, `home-staging-virtuel-belgique`, `home-staging-virtuel-suisse-romande`, `home-staging-virtuel-legal`) n'émettent pas de HowTo alors que le composant le supporte déjà (`...(page.howTo ? [generateHowToSchema()] : [])`).
   - Le générateur `generateHowToSchema()` est générique (flux photo→style→rendu), donc réutilisable tel quel sur toute page qui montre concrètement ce flux dans son contenu visible.
   - Fix proposé : passer en revue chaque page, et flip `howTo: true` UNIQUEMENT sur celles dont le contenu visible décrit réellement les 3 étapes (éviter le schema orphelin, règle anti scaled-content). Ne pas l'activer en masse sans relecture du texte de chaque page ; c'est un travail de contenu, pas juste un flag.

4. **[MED] `sameAs` toujours à 3 profils réels** (Instagram, Facebook, Pinterest), inchangé depuis le dernier audit du 14/06. `Product Hunt` référencé dans `backlink-outreach.ts` comme cible d'outreach, PAS comme profil live existant : ne pas l'ajouter tant que la fiche n'existe pas réellement. Cible ≥10 reste hors d'atteinte sans création réelle de profils (LinkedIn, Trustpilot, Capterra, G2, Crunchbase, Wikidata...). Hors périmètre schema : router vers `seo-entity-graph` / `seo-brand-outreach` pour la création effective des profils, puis seo-schema ajoutera les URLs une fois réelles.

5. **[LOW] Incohérence narrative Organization vs `/a-propos`.** Le schema Organization a `founder: { '@type': 'Person', name: 'Gabriel Moustadrif' }` (un seul fondateur), mais le copy visible de `/a-propos` raconte "un couple suisse" ("née de la rencontre entre une passionnée de décoration et un ingénieur tech"). Ce n'est pas un bug de syntaxe JSON-LD, mais un risque de cohérence schema/contenu (E-E-A-T) si les deux doivent matcher. Hors périmètre strict schema (contenu → `seo-content`), signalé ici parce que ça touche directement au champ `founder`.

6. **[LOW] `SEO_CONFIG.targetCountries` = `['FR', 'CH', 'BE']` seulement**, alors que CLAUDE.md mentionne un marché DE/EN actif (locales `de`/`en` existent). `areaServed` de l'Organization ne couvre donc pas l'Allemagne. À vérifier avec seo-chief si le marché DE est réellement actif commercialement (Stripe, pricing DE) avant d'ajouter `Germany` à `areaServed` : ne pas déclarer une zone de service non réellement servie.

7. **[LOW] BlogPosting du template `blog/[slug]/page.tsx` n'utilise pas `generateBlogPostingSchema()` de `lib/seo/schemas.ts`** mais un objet inline dupliqué (avec un `publisher.Organization` SANS `@id`, contrairement à `generateBlogPostingSchema` qui lie bien `@id: #organization`). Deux implémentations divergentes du même schema = risque de dérive future. Pas bloquant (le schema inline est valide), mais mérite une consolidation technique (hors périmètre schema strict, plutôt refacto code).

## Snippets proposés (résumé, prêts à intégrer après validation humaine)

### A. BreadcrumbList sur `/pro`
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://instadeco.app/fr" },
    { "@type": "ListItem", "position": 2, "name": "Pro", "item": "https://instadeco.app/fr/pro" }
  ]
}
```
Implémentation : `generateBreadcrumbList([{ label: 'Pro', path: '/pro' }], { home: { name: 'Accueil', url: '/' } })` ajouté au tableau `data` de `pro/layout.tsx`.

### B. Schema minimal `/essai` (BreadcrumbList + WebPage)
```json
{
  "@type": "WebPage",
  "name": "Essai gratuit InstaDeco AI",
  "url": "https://instadeco.app/fr/essai",
  "isPartOf": { "@id": "https://instadeco.app/#website" },
  "publisher": { "@id": "https://instadeco.app/#organization" },
  "inLanguage": "fr"
}
```
+ `generateBreadcrumbList([{ label: 'Essai gratuit', path: '/essai' }])`. FAQPage seulement si contenu Q/R déjà visible sur la page (à vérifier).

### C. HowTo à activer au cas par cas sur `/solution` (liste, pas de snippet nouveau : `generateHowToSchema()` existe déjà)
Candidats à examiner un par un pour vérifier que le flux 3 étapes est bien décrit visiblement avant de flipper `howTo: true` : `simulateur-decoration-interieur`, `simulateur-peinture`, `decoration-salon`, `decoration-chambre`, `avant-apres-decoration`, `home-staging-virtuel-prix`, `home-staging-virtuel-belgique`, `home-staging-virtuel-suisse-romande`, `home-staging-virtuel-legal`, `idee-amenagement-studio`.

## Hors périmètre schema (à router)
- Création réelle de nouveaux profils tiers (LinkedIn, Trustpilot, Capterra, G2, Crunchbase, Wikidata) pour alimenter `sameAs` → `seo-entity-graph` / `seo-brand-outreach`.
- Cohérence narrative "couple fondateur" vs `founder` unique → `seo-content` (à trancher avec l'utilisateur : un ou deux fondateurs réels ?).
- Vérification marché DE actif avant extension `areaServed` → `seo-chief` (décision produit/marché, pas schema).
