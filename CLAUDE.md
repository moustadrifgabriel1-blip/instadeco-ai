# CLAUDE.md, InstaDeco AI

Guide pour Claude Code sur ce projet. Lis-le avant toute modification.

## RÈGLE PRIORITAIRE, écriture anti détection IA (NON NÉGOCIABLE)

Le copy du site ne doit JAMAIS ressembler à du texte généré par IA. C'est une priorité MAJEURE produit : la détection IA nuit à la crédibilité auprès des agences. Deux interdits absolus, partout (UI, copy, i18n fr/en/de, commits, commentaires, docs) :

1. **Zéro tiret de séparation.** Jamais de tiret cadratin (—) ni demi cadratin (–). Jamais de tiret d'union décoratif pour relier des bouts de phrase. On remplace TOUJOURS par une vraie ponctuation : point, virgule, deux points, point d'exclamation, parenthèses, ou barre oblique (« avant/après »). Les traits d'union d'orthographe figée (peut être, rendez vous) restent corrects mais dans le doute on reformule. C'est le marqueur numéro 1 d'écriture IA.
2. **Zéro emoji dans le copy du site.** Aucun emoji décoratif dans les textes visibles. Là où un emoji servait d'icône, utiliser une icône vectorielle (lucide-react, déjà installé ; Simple Icons pour les marques), jamais un emoji.

Le texte doit toujours être travaillé : phrases de longueurs variées, ton humain et direct, zéro tournure générique d'IA, zéro remplissage.

## Projet
SaaS B2C de **décoration d'intérieur par IA** : l'utilisateur upload une photo de pièce, choisit un style, et reçoit un rendu "avant/après". Modèle freemium (essai gratuit → crédits payants Stripe). Domaine : instadeco.app.

## Mission active : MRR Pro / immobilier (objectif 50k€/mois)
Le moteur de revenu cible n'est PLUS le grand public (crédits 9,90€, achat ponctuel, zéro récurrence) mais l'**abonnement Pro** visant agents immobiliers, home stagers, promoteurs (FR+BE+Romandie). Page money `/fr/pro` : 3 paliers (Solo 19€/40 img, **Pro 49€ illimité fair-use**, Agence 99€/3 sièges), annuel −30%. Angle : « Vendez vos biens plus vite, sans 2 000€ de home staging ». **Boussole de priorisation : chaque tâche doit répondre « comment ça aide le MRR Pro ? ».**

Le moteur technique est CONSTRUIT et déployé : tunnel Stripe Checkout + webhook abonnement (activation/renouvellement/annulation), gate illimité, multi-tenant Agence (tables `organizations`/`organization_members`), tracking funnel (Meta Pixel + GA, events `InitiateCheckout`/`Purchase` dans `lib/analytics/`), DA prestige, pSEO. **Le goulot vers 50k n'est donc plus le code mais l'ACQUISITION** (outbound agents immo, playbook `docs/ACQUISITION_PRO_M4.md`). ✅ **Prérequis bloquant LEVÉ le 21/06/2026 : le tunnel de vente est validé bout en bout** (vrai paiement → webhook 200 `subscription_activated_pro` → profil `pro_status=active` → page de validation premium → email de confirmation). C'était la cause de mort n°1 du pré-mortem. Le blocage était 100% config Vercel (5 couches de secrets/URL/env), jamais le code. Règle copy `/fr/pro` : aucune stat chiffrée non sourçable (reformuler en bénéfice), preuve = vrais avant/après de la table `generations` (compte démo `f88c9b68-...` uniquement sur pages indexées, RGPD).

## Stack
- **Next.js 15** (App Router) + **TypeScript strict** + **React 18**
- **next-intl** (i18n : `fr` / `en` / `de`, `localePrefix: 'always'`, défaut `fr`)
- **Supabase** (auth, Postgres, storage `input-images` / `output-images`)
- **Stripe** (paiements/crédits) · **Resend** (emails) · **Gemini** (articles blog)
- **Génération d'images** : FAL.ai (Flux) ou Google Gemini 2.5 Flash Image, voir ci-dessous
- **Tailwind** + shadcn/ui · **Vitest** (tests) · déploiement **Vercel**

## Commandes
```bash
npm run dev          # dev local
npm run build        # build prod (lance ESLint, un lint rouge CASSE le build)
npm run lint         # ESLint (next lint)
npm run type-check   # tsc --noEmit
npm run test:run     # Vitest (doit rester vert, bloquant en CI)
```
Avant tout commit : `npm run type-check && npm run lint && npm run test:run` doivent être **verts**. Le CI (`.github/workflows/ci.yml`) les impose (tsc + lint + tests bloquants).

## Architecture (clean architecture sous `src/`)
- `src/domain/`, entités, ports (interfaces), erreurs. **Ne dépend de rien d'externe.**
- `src/application/use-cases/`, logique métier orchestrée.
- `src/infrastructure/`, adapters (repos Supabase, services Fal/Gemini/Stripe), `config/di-container.ts` (singleton d'injection).
- `app/`, routes Next (App Router). Les routes `app/api/**` doivent passer par les **use-cases via le DI container**, pas appeler Supabase/Fal en direct.
- `components/`, `hooks/` (racine = cross-cutting : auth, supabase browser) · `src/presentation/hooks/` (use-cases métier côté client).
- Langue UI : **français** (textes, commentaires).

## Génération d'images, système de provider
- Sélection via env **`IMAGE_PROVIDER`** = `fal` ou `gemini` (override explicite prioritaire). **Sans variable, défaut auto = `gemini` si `GEMINI_API_KEY` est présente, sinon `fal`.** L'ancien défaut « fal en dur » faisait échouer TOUTE génération web faute de `FAL_KEY` (local ET prod) : le tunnel ne passait jamais par le moteur configuré (corrigé le 21/06). Factory : `src/infrastructure/services/image-generator-factory.ts`, branchée dans le DI container.
- Les deux implémentent `IImageGeneratorService` (`generate()` synchrone).
- **FAL** : `fal.run()` SYNCHRONE uniquement (JAMAIS `fal.queue.submit` → ré-exécute le modèle). Toujours `fal.storage.upload()` avant. ControlNet depth désactivé (bug tenseur 14/02/2026).
- **Gemini** ("Nano Banana", `gemini-2.5-flash-image`) : REST pur, édite la photo en préservant la structure. Override modèle via `GEMINI_IMAGE_MODEL`.
- Presets/prompts centralisés : `src/shared/constants/interior-design.ts` (style/pièce/mobilier), `flux-presets.ts`, `gemini-image-presets.ts`.

## Sécurité, règles
- **Aucun secret dans le repo.** Secrets uniquement en `.env.local` (gitignoré) + Vercel env. Ne jamais committer de valeur réelle (un secret déjà commité = compromis → roter). Cf. `VERCEL_ENV_SETUP.md` (placeholders only).
- **SSRF** : tout `fetch()` serveur d'une URL utilisateur passe par `safeFetchImage` / `assertSafeImageUrl` (`src/shared/utils/safe-url.ts`), bloque IP internes/metadata.
- **CRON** : routes `app/api/cron/**` protégées par `Authorization: Bearer ${CRON_SECRET}`. Ne JAMAIS faire confiance à `x-vercel-signature` seul (spoofable).
- **Rate-limiting** : `checkRateLimitDistributed` (table Supabase partagée, RPC `increment_rate_limit`) avec fallback mémoire + timeout court. Le `Map` mémoire seul est contournable en serverless.
- **Upload** : valider taille + magic-bytes (`isSupportedImageBase64`).
- **Crédits = argent** : déduction/remboursement idempotents. Webhook Stripe idempotent (table `processed_stripe_events`). Toute modif de logique crédit doit être testée.

## Contrainte coût (≤ 10.-/mois fixe visé)
- Unit economics excellentes (~96% marge ; COGS génération ~0,025€/image). Le poste qui casse le budget = **Vercel Pro 20$** (forcé par crons + maxDuration élevés).
- Garder `maxDuration ≤ 60`, peu de crons. ⚠️ **Vercel Hobby interdit l'usage commercial** (ToS).
- ✅ **Crons sur VPS Hetzner (LIVE depuis le 17/06/2026)** : le VPS `wefam-prod` (178.105.148.37, mutualisé 3 projets) fait tourner TOUS les crons en appelant `/api/cron/*` (Bearer `CRON_SECRET`). `/opt/instadeco/run-cron.sh` + crontab posé (11 crons app + 3 moteur SEO + drip-feed pSEO). Le tableau `crons` de `vercel.json` a été **vidé** (plus de double exécution, plus de pression Pro). Doc : `docs/CRON_VPS_HETZNER.md`. POC Cloudflare (`docs/CLOUDFLARE_MIGRATION.md`) = plan B abandonné.

## Pièges / fichiers sensibles
- Liens internes : utiliser `Link` de `@/i18n/navigation` (ou `next/link`), **jamais `<a href>` vers une page interne** (casse le build via ESLint + le routing i18n).
- `app/api/trial/generate/route.ts` : route critique (essai gratuit anti-abus). Préserver la logique `fal.run` synchrone.
- Le blog est sous `app/[locale]/(marketing)/blog/` (migré, localisé).
- Migrations Supabase dans `supabase/migrations/` : **l'agent PEUT les appliquer directement via le MCP Supabase** (`apply_migration`) sur le projet prod `tocgrsdlegabfkykhdrz`. Toujours écrire le fichier `.sql` dans `supabase/migrations/` d'abord (source de vérité versionnée), puis appliquer. Écrire des migrations **idempotentes** (`IF NOT EXISTS` / `CREATE OR REPLACE`). Pour un DDL **destructif** sur une table live (DROP de colonne/table/contrainte, ALTER de type), prévenir l'utilisateur dans la réponse avant d'appliquer.

## Système SEO/GEO multi-agents (`.claude/`)
- Installé le 14/06/2026. **Point d'entrée UNIQUE** : agent `seo-chief` (`.claude/agents/seo-chief.md`). Il route vers 17 sous-agents (escouades Diagnostic / Sémantique / Exécution / Présence / Médias), parallélise le diagnostic (lecture seule), synthétise `.claude/seo-memory/seo-scoreboard.md` et **PROPOSE** des patchs (validation humaine avant toute écriture sur le site live). Ne JAMAIS lancer un agent d'escouade en direct.
- Usage : demander « lance seo-chief pour un audit complet » (ou ciblé). NB : les fichiers `.claude/agents/` ne deviennent des *types* d'agent qu'au (re)démarrage de session, en cours de session, faire exécuter un agent en lui faisant lire sa définition.
- Mémoire partagée : `.claude/seo-memory/*.md` (scoreboard, entity-graph, topical-coverage, serp-targets, brand-presence-map, citation-log, schema-proposals).
- ✅ **Moteur SEO LIVE sur le VPS (17/06/2026)** : `.claude/seo-engine/` (scripts Python). `gsc_daily`, `drift_check`, `rank_tracker` IMPLÉMENTÉS et tournent en cron VPS (`scripts/seo-engine/run-seo-engine.sh`, compte de service Google fourni, `GSC_SITE_URL=sc-domain:instadeco.app`). `rank_tracker` lit les positions depuis GSC (pas de scraping). Rapports gardés EN LOCAL/VPS (repo public → jamais poussés, gitignorés). Encore squelettes : `serp_scraper`, `competitor_diff`, `citation_batch`. GitHub Actions (`seo-engine.yml`) = filet manuel (workflow_dispatch).
- **Budget STRICT ≤ 2 CHF/mois** (hors génération de contenu IA) : agents via Claude Code, APIs Google gratuits. `seo-geo-citation` (monitoring LLM) cap ≤ 1.50 CHF. Désactivés (web-only) : `seo-aso`, `seo-video`, `seo-crawl-budget`.
- Règles : croissance **Google-safe** (pas d'écriture massive, rate-limiting scrape), **données réelles uniquement** (jamais d'invention), pas de schema fake (`AggregateRating` seulement avec `generation_ratings`).

## Anti-IA (barrière qualité PERMANENTE)
- `src/shared/lint/anti-ai-lint.ts` : linter déterministe (`lintAntiAi` + `sanitizeAntiAi`). Règles **hard** (tiret cadratin/demi, emoji, placeholder → échec immédiat) + **soft** (ouvertures/remplissages IA, débuts répétés, longueurs uniformes → score). 61 tests dans `src/__tests__/anti-ai-lint.test.ts`. **Gate branché** dans `GenerateBlogArticleUseCase` (article qui ne passe pas → `draft`, jamais publié) ET dans le générateur pSEO. Tout nouveau contenu DOIT passer ce gate.

## pSEO longue traîne (`/amenager/[slug]`)
- Pages pièce×style×contrainte, stratégie Google-safe : contenu unique (Gemini 3.1-pro) + drip-feed + CTA conversion. Table `pseo_pages` (RLS lecture publique des publiés). Générateur `scripts/generate-pseo-batch.ts` (594 combos, gate anti-IA, idempotent, `--limit` pour le coût). Drip-feed `app/api/cron/pseo-publish` (15/jour, cron VPS 02:00). Frontend ISR `app/[locale]/(marketing)/amenager/[slug]/page.tsx`. Barrière qualité pages villes : `lib/seo/pseo-quality.ts` (noindex sous seuil). ⚠️ Surveiller le coût Gemini, générer par lots.

## Conformité Google, garde-fou anti-désindexation (NON NÉGOCIABLE)

Toute automatisation de croissance organique (génération pSEO de masse, contenu IA, boucle d'optimisation CTR, distribution, backlinks) DOIT respecter à la lettre les Google Search Essentials et les spam policies (`developers.google.com/search/docs/essentials/spam-policies`). Un manquement = perte de positions, désindexation, voire action manuelle. La croissance reste **lente et people-first**, jamais agressive. Règles dérivées des politiques officielles (vérifiées 18/06/2026) :

1. **Scaled content abuse (le risque n°1 du pSEO IA).** Interdit : générer beaucoup de pages dont le but premier est de manipuler le ranking sans valeur pour l'utilisateur. Chaque page générée DOIT apporter une valeur unique réelle : data vérifiable, vrais avant/après (table `generations`, compte démo RGPD), info locale concrète, réponse utile. Le gate anti-IA + la barrière qualité (`lib/seo/pseo-quality.ts`, noindex sous seuil) sont OBLIGATOIRES sur tout contenu auto. Cadence de publication plafonnée (drip-feed), jamais de dump massif. Si une page n'apporterait rien qu'un humain trouverait utile en arrivant directement dessus, elle ne se publie pas (reste `draft`/`noindex`).
2. **Doorway pages.** Interdit : multiplier des pages ville/variation quasi identiques qui ne servent qu'à capter des requêtes puis renvoient vers une destination unique. Chaque page localisée doit avoir un contenu et une intention propres, pas un simple gabarit dupliqué. Pas de réseaux de sous-domaines/domaines pour la même cible.
3. **Keyword stuffing.** Interdit : listes de villes/mots-clés répétées, bourrage. Le texte reste naturel (cf. règle anti-IA, phrases variées).
4. **Cloaking et sneaky redirects.** JAMAIS servir un contenu différent à Googlebot vs aux humains, ni détecter le user-agent pour adapter le contenu. Les redirections doivent être honnêtes (301 légitimes de consolidation uniquement, cf. `next.config.js`). Pas de redirection trompeuse desktop/mobile.
5. **Hidden text / liens cachés.** Aucun texte ou lien dissimulé (texte blanc sur blanc, opacity 0, hors écran, font-size 0).
6. **Machine-generated traffic (scraping Google).** Interdit d'envoyer des requêtes automatisées à Google ou de scraper les SERP pour le suivi de rang sans permission. Les positions se lisent via l'**API GSC officielle uniquement** (déjà le cas : `rank_tracker` lit GSC). Le stub `serp_scraper` NE doit PAS scraper Google directement ; s'il est activé, passer par une API autorisée.
7. **Contenu IA, people-first et E-E-A-T.** L'automatisation n'est pas interdite en soi, mais le contenu doit être créé d'abord pour les humains, pas pour le moteur. Viser Expérience/Expertise/Autorité/**Confiance** (la confiance prime). La boucle d'auto-optimisation des titles est autorisée tant que les titles restent **honnêtes et reflètent le contenu réel** (zéro clickbait trompeur = forme de cloaking d'intention).
8. **Link spam.** Backlinks mérités uniquement. Interdit : achat/échange de liens, fermes de liens, génération automatisée de liens, ancres sur-optimisées en masse. Tout lien sponsorisé/affilié porte `rel="sponsored"` ou `rel="nofollow"`. Outreach plafonné et utile (cf. agents `seo-brand-outreach`/`seo-community`, 1 contribution utile/site/mois max).
9. **Site reputation abuse.** Ne pas héberger de contenu tiers sur le domaine pour exploiter son autorité.
10. **Hygiène technique.** Respecter `robots.txt`, rate-limiter tout crawl maison, données réelles uniquement (jamais d'invention), pas de schema fake (`AggregateRating` seulement avec de vrais avis). En cas de doute sur une nouvelle automatisation, **relire les spam policies AVANT de coder** et préférer la prudence (noindex par défaut).

Principe directeur : si une tactique cherche à « tromper » Google plutôt qu'à servir un agent immobilier réel, on ne la fait pas. La cible est du trafic qualifié agences, obtenu proprement.

## Migrations / actions en attente

### Session 21/06/2026 (déployée sur main) — TUNNEL DE VENTE VALIDÉ
- ✅ **Génération réparée (cause racine).** Le défaut de la factory `IMAGE_PROVIDER || 'fal'` faisait échouer TOUTE génération web faute de `FAL_KEY` (Gemini est le moteur, pas FAL). Défaut désormais auto : gemini si `GEMINI_API_KEY` présente, sinon fal (`image-generator-factory.ts`). + bouton « Générer » enterré sous l'aperçu (page `/generate`) corrigé (aperçu plafonné 46vh + auto-scroll). + image résultat en `unoptimized`.
- ✅ **Tunnel de paiement validé bout en bout** (cause de mort n°1 du pré-mortem levée). Le blocage était 100% config Vercel (5 couches, cf. mémoire `stripe-prod-blockers`) : STRIPE_SECRET_KEY expirée (500), STRIPE_WEBHOOK_SECRET mismatch (400), mauvaise URL d'endpoint `/api/payments/webhook` vs `/api/v2/webhooks/stripe` (404), validation d'env exigeant `FAL_KEY` absent (500), puis bon secret après roll+redeploy (200). Fixes code livrés : alias `app/api/payments/webhook/route.ts` ; `env.ts` → `FAL_KEY`/`GEMINI_API_KEY`/`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` **optionnelles** ; `verifyWebhook` tolérant (multi-secrets séparés par virgule + trim).
- ✅ **Onglet « Abonnement »** (dashboard) + **portail Stripe** (`createBillingPortalSession` → use-case → `POST /api/v2/payments/portal`). Gère le plan/statut, bouton « Gérer mon abonnement ».
- ✅ **Page de validation premium** `/credits/success` (distingue crédits/abonnement via le success_url, attend vraiment l'activation par polling) + **emails de confirmation** (achat + abonnement) envoyés en best-effort par la route webhook (le use-case retourne une intention d'email, la route fait l'envoi).
- ✅ **Facturation B2B au checkout** (`StripePaymentService`) : `billing_address_collection`, `tax_id_collection`, `invoice_creation` (achat ponctuel), `customer_creation:'always'` + stockage du `stripe_customer_id`. `automatic_tax` **gaté par `STRIPE_TAX_ENABLED`** (off par défaut : exige Stripe Tax configuré, sinon casse le checkout — à activer quand prêt).
- ✅ **Affichage « Illimité »** pour les abonnés Pro/Agence (au lieu d'un solde de crédits) via le hook `hooks/use-plan.ts` (`usePlan`) : header dashboard + header marketing (desktop/mobile) + onglet compte.
- ✅ **Galerie refaite** : 30 rendus frais sur 30 pièces vides DIFFÉRENTES (QA visuelle parallèle, scripts `generate-gallery-30.ts`), + **filtre RGPD** : la galerie (page indexée) ne liste QUE le compte démo (`findPublicGallery` + SSR `galerie/page.tsx` filtrent `user_id`). DB nettoyée (toutes les générations < 1er juin supprimées + vieilles images démo remplacées).
- ✅ **Quiz** rendu crawlable SEO/GEO : `page.tsx` serveur (12 styles liés `/style/[slug]` + FAQ 6 Q→R + JSON-LD FAQPage/BreadcrumbList/Quiz), quiz interactif extrait dans `quiz-interactive.tsx`.
- ✅ **Header gardé sur `/exemples`** : exception CSS `data-keep-global-header` (la règle masquait header+footer sur les surfaces `data-prestige-root`).
- ✅ **Blog réparé** : `PrestigeRevealObserver` rendu résilient (IO sans condition + re-scans + MutationObserver) — les cartes streamées restaient armées-cachées (opacity 0) à vie.
- ⏳ **Items pré-mortem restants (non bloquants)** : compteur d'usage de l'illimité (fair-use/COGS, `GenerateDesignUseCase` met `chargesCredits=false` sans compter) ; dunning webhook (gérer `invoice.payment_failed` + `customer.subscription.updated`) ; re-consentement vieille cohorte ; activer `STRIPE_TAX_ENABLED` une fois Stripe Tax prêt ; aligner copy/CGV/privacy avec le code (promesses filigrane/export, ajouter Google Gemini aux sous-traitants).

### Session 19/06/2026 (déployée sur main)
- ✅ **Responsive mobile A à Z** : conventions à respecter pour tout nouveau code. Hauteur plein écran = `min-h-[100dvh]` (jamais `min-h-screen`/`100vh`) ; `100svh` pour les héros fixes pinnés. Safe-area = `viewportFit:'cover'` + utilitaires `pt-safe`/`pb-safe`/`pl-safe`/`pr-safe`/`px-safe` (globals.css). Breakpoint `xs:360px`, container padding fluide. Tout `pin`/`scrub` GSAP sous `gsap.matchMedia('(min-width:1024px)')` + fallback mobile ; Lenis off sur tactile (`isTouchPrimary()`). Inputs ≥16px sur mobile (anti-zoom iOS, `ui/input` en `text-base md:text-sm`). Hover-only visible au doigt via la variante `[@media(hover:hover)]:`.
- ✅ **Emails clients en DA prestige** (nuit+or, wordmark sérif, tables email-safe) : marketing-emails, guest-checkout, email-nurturing, page unsubscribe.
- ✅ **Zéro emoji affiché** : les emojis du copy VISIBLE sont remplacés par des icônes Lucide. Règle confirmée par l'user : emojis dans les textes ENVOYÉS (partage, sujets/corps d'emails) = TOLÉRÉS ; emojis AFFICHÉS en permanence = INTERDITS.
- ✅ **Sécurité** : `/api/v2/health` ne fuit plus longueur secrets/tables (diagnostic complet seulement avec Bearer CRON_SECRET). **Consentement RGPD** : GA+Meta Pixel+AdTracker gatés sur `useCookieConsent()==='granted'` (`lib/analytics/consent.ts`), bannière Accepter/Refuser, privacy alignée. Webhook : credits ∈ {10,25,50,100} avant de créditer (PAS d'assertion amountTotal : coupons→0 + annuel la casseraient). Deps : next 15.5.19 + vitest 4.1 + npm audit fix (21 vulns → 2 moderate).
- ✅ **Générations de preuves industrialisées** : `scripts/generate-proof-batch.ts` prend des pièces vides DIFFÉRENTES full HD (Pexels, re-uploadées sur input-images démo), génère via Gemini, **slugs VALIDES uniquement** (la table `generations` rejette scandinave/industriel ; OK : moderne/midcentury/japandi/boheme/coastal/artdeco/minimaliste/classique). 4 paires fraîches branchées (home, /exemples, galerie) ; image d'un autre compte retirée (RGPD).
- ⏳ **Restant audit (non bloquant)** : re-consentement de la cohorte `consent_marketing DEFAULT true` (avant 11/02/2026) avant tout email marketing ; centraliser `sanitizePaymentError` (erreurs <500) ; masquer les logs PII (email parrain, IP+fingerprint) ; CSP nonces (retirer unsafe-inline/eval) ; 2 vulns npm moderate (demandent --force).

- ✅ Appliqué (07/06/2026) : `20260606_rate_limits.sql`, `20260607_generation_ratings.sql`.
- ✅ Appliqué (07/06/2026) : `20260607_blog_language.sql` (colonne `language` + unicité slug par langue). ✅ Backfill fait : blog = 38 fr + 21 en + 20 de. `/en/blog` et `/de/blog` peuplés. (18/06) Anti-IA passé sur tout le blog : 0 tiret, 0 emoji, 0 placeholder ; 6 articles à tournures IA régénérés via `scripts/refresh-anti-ai.ts` ; 4 doublons FR archivés + 301 dans `next.config.js` (cannibalisation = zéro).
- ✅ Appliqué (18/06/2026) : `20260618_pseo_pages.sql` (table pSEO longue traîne, RLS lecture publique des publiés). Cf. section pSEO.
- ✅ Appliqué (14/06/2026) : `20260614_harden_cleanup_rate_limits_grants.sql` (REVOKE EXECUTE anon/authenticated sur `cleanup_rate_limits`, était ouvert à tous malgré le REVOKE FROM PUBLIC initial).
- ✅ Appliqué (15/06/2026) : `20260615_atomic_credit_ledger.sql`, fonctions `add_credits_with_ledger`/`deduct_credits_with_ledger` (solde + `credit_transactions` dans UNE transaction) + contrainte CHECK type élargie (+`generation`). Corrige 2 bugs qui rendaient le grand livre VIDE : colonne `stripe_session_id`→`stripe_payment_intent`, et type `'generation'` refusé. Le repo `SupabaseCreditRepository` passe désormais par ces RPC.
- 🔴✅ Appliqué (15/06/2026) : `20260615_harden_credit_ledger_grants.sql`, **FAILLE CRITIQUE fermée** : `add_credits_with_ledger`/`deduct_credits_with_ledger` étaient exécutables par `anon`+`authenticated` (la migration `atomic_credit_ledger` ne faisait que `REVOKE FROM PUBLIC`, insuffisant). N'importe qui pouvait s'auto-créditer via `/rest/v1/rpc/`. REVOKE EXECUTE FROM anon, authenticated appliqué. Vérifié : aucune exploitation (`credit_transactions` vide, 0 paiement Stripe réussi).
- ✅ Appliqué (15/06/2026) : `20260606_stripe_idempotency.sql` (nettoyée), crée `processed_stripe_events` (était ABSENTE → tout achat Stripe débité sans crédit, le webhook échouait sur `markProcessed`). Ne crée plus que la table (l'ancienne colonne morte `stripe_session_id` retirée ; alignement `credit_transactions` géré par `atomic_credit_ledger`).
- ✅ Appliqué (15/06/2026) : `20260615_db_perf_indexes_dedup_policy.sql`, index sur `credit_transactions(generation_id)` et `profiles(referred_by)` (FK non couvertes) + suppression de la policy SELECT doublon `Users can view own profile` (identique à `Users can read own profile`).
- ℹ️ Drift de tracking des migrations : `schema_migrations` ne track que 8 versions (≥20260607) ; 15 fichiers anciens appliqués mais non trackés. **Inerte** avec le workflow MCP `apply_migration`. Procédure de réconciliation documentée dans `docs/MIGRATIONS_DRIFT.md` (à faire seulement si retour à `supabase db push`).
- ⚠️ **Déploiement Vercel** : le réglage **« Require Verified Commits » a été désactivé (15/06)** car il annulait à 0 ms tous les commits non signés GPG (la prod était bloquée). Ne pas le réactiver sans signer les commits. Plan `main` = Hobby → garder peu de crons côté Vercel (stratégie : crons sur VPS Hetzner, cf. `docs/CRON_VPS_HETZNER.md`).
- ✅ `GEMINI_API_KEY` **régénérée (18/06/2026)** : nouvelle clé valide en `.env.local` + Vercel, ancienne supprimée. Génération blog + pSEO débloquée. Modèles 3.x dispos sur la clé : `gemini-3.1-pro-preview` (utilisé pour le pSEO), `gemini-2.5-pro` (blog, stable). ⚠️ Tarif preview de 3.1-pro inconnu → surveiller la conso AI Studio ; possibilité de basculer sur `gemini-3.1-flash` (10x moins cher) côté pSEO.
- ⏳ Roter `CRON_SECRET` (historiquement exposé) si pas déjà fait. Activer la « leaked password protection » dans le dashboard Supabase (Auth → Password security).
- ℹ️ Advisors sécurité restants (intentionnels, ne pas « corriger ») : `get_own_credits`/`get_own_role`/`is_admin` exposés à anon/authenticated = REQUIS par les policies RLS (profiles, blog_articles), sans fuite (ne renvoient que les données de l'appelant). `rate_limits`/`trial_usage` RLS sans policy = tables service-role-only (deny par défaut = posture sûre).
