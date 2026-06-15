# CLAUDE.md — InstaDeco AI

Guide pour Claude Code sur ce projet. Lis-le avant toute modification.

## Projet
SaaS B2C de **décoration d'intérieur par IA** : l'utilisateur upload une photo de pièce, choisit un style, et reçoit un rendu "avant/après". Modèle freemium (essai gratuit → crédits payants Stripe). Objectif : 2000.-/mois de revenu. Domaine : instadeco.app.

## Stack
- **Next.js 15** (App Router) + **TypeScript strict** + **React 18**
- **next-intl** (i18n : `fr` / `en` / `de`, `localePrefix: 'always'`, défaut `fr`)
- **Supabase** (auth, Postgres, storage `input-images` / `output-images`)
- **Stripe** (paiements/crédits) · **Resend** (emails) · **Gemini** (articles blog)
- **Génération d'images** : FAL.ai (Flux) ou Google Gemini 2.5 Flash Image — voir ci-dessous
- **Tailwind** + shadcn/ui · **Vitest** (tests) · déploiement **Vercel**

## Commandes
```bash
npm run dev          # dev local
npm run build        # build prod (lance ESLint — un lint rouge CASSE le build)
npm run lint         # ESLint (next lint)
npm run type-check   # tsc --noEmit
npm run test:run     # Vitest (doit rester vert — bloquant en CI)
```
Avant tout commit : `npm run type-check && npm run lint && npm run test:run` doivent être **verts**. Le CI (`.github/workflows/ci.yml`) les impose (tsc + lint + tests bloquants).

## Architecture (clean architecture sous `src/`)
- `src/domain/` — entités, ports (interfaces), erreurs. **Ne dépend de rien d'externe.**
- `src/application/use-cases/` — logique métier orchestrée.
- `src/infrastructure/` — adapters (repos Supabase, services Fal/Gemini/Stripe), `config/di-container.ts` (singleton d'injection).
- `app/` — routes Next (App Router). Les routes `app/api/**` doivent passer par les **use-cases via le DI container**, pas appeler Supabase/Fal en direct.
- `components/`, `hooks/` (racine = cross-cutting : auth, supabase browser) · `src/presentation/hooks/` (use-cases métier côté client).
- Langue UI : **français** (textes, commentaires).

## Génération d'images — système de provider
- Sélection via env **`IMAGE_PROVIDER`** = `fal` (défaut) ou `gemini`. Factory : `src/infrastructure/services/image-generator-factory.ts`, branchée dans le DI container.
- Les deux implémentent `IImageGeneratorService` (`generate()` synchrone).
- **FAL** : `fal.run()` SYNCHRONE uniquement (JAMAIS `fal.queue.submit` → ré-exécute le modèle). Toujours `fal.storage.upload()` avant. ControlNet depth désactivé (bug tenseur 14/02/2026).
- **Gemini** ("Nano Banana", `gemini-2.5-flash-image`) : REST pur, édite la photo en préservant la structure. Override modèle via `GEMINI_IMAGE_MODEL`.
- Presets/prompts centralisés : `src/shared/constants/interior-design.ts` (style/pièce/mobilier), `flux-presets.ts`, `gemini-image-presets.ts`.

## Sécurité — règles
- **Aucun secret dans le repo.** Secrets uniquement en `.env.local` (gitignoré) + Vercel env. Ne jamais committer de valeur réelle (un secret déjà commité = compromis → roter). Cf. `VERCEL_ENV_SETUP.md` (placeholders only).
- **SSRF** : tout `fetch()` serveur d'une URL utilisateur passe par `safeFetchImage` / `assertSafeImageUrl` (`src/shared/utils/safe-url.ts`) — bloque IP internes/metadata.
- **CRON** : routes `app/api/cron/**` protégées par `Authorization: Bearer ${CRON_SECRET}`. Ne JAMAIS faire confiance à `x-vercel-signature` seul (spoofable).
- **Rate-limiting** : `checkRateLimitDistributed` (table Supabase partagée, RPC `increment_rate_limit`) avec fallback mémoire + timeout court. Le `Map` mémoire seul est contournable en serverless.
- **Upload** : valider taille + magic-bytes (`isSupportedImageBase64`).
- **Crédits = argent** : déduction/remboursement idempotents. Webhook Stripe idempotent (table `processed_stripe_events`). Toute modif de logique crédit doit être testée.

## Contrainte coût (≤ 10.-/mois fixe visé)
- Unit economics excellentes (~96% marge ; COGS génération ~0,025€/image). Le poste qui casse le budget = **Vercel Pro 20$** (forcé par crons + maxDuration élevés).
- Garder `maxDuration ≤ 60`, peu de crons. ⚠️ **Vercel Hobby interdit l'usage commercial** (ToS).
- **Stratégie crons retenue (15/06/2026) : VPS Hetzner** (déjà payé ~12 CHF, mutualisable pour les 3 projets) fait tourner tous les crons en appelant `/api/cron/*` (Bearer `CRON_SECRET`). Outillage : `scripts/cron/` + `docs/CRON_VPS_HETZNER.md`. → retire la pression « Pro forcé par crons » **sans migration Cloudflare**. Après validation VPS, vider `crons` de `vercel.json`. Le POC Cloudflare (`docs/CLOUDFLARE_MIGRATION.md`) reste un plan B, non prioritaire.

## Pièges / fichiers sensibles
- Liens internes : utiliser `Link` de `@/i18n/navigation` (ou `next/link`), **jamais `<a href>` vers une page interne** (casse le build via ESLint + le routing i18n).
- `app/api/trial/generate/route.ts` : route critique (essai gratuit anti-abus). Préserver la logique `fal.run` synchrone.
- Le blog est sous `app/[locale]/(marketing)/blog/` (migré, localisé).
- Migrations Supabase dans `supabase/migrations/` : **l'agent PEUT les appliquer directement via le MCP Supabase** (`apply_migration`) sur le projet prod `tocgrsdlegabfkykhdrz`. Toujours écrire le fichier `.sql` dans `supabase/migrations/` d'abord (source de vérité versionnée), puis appliquer. Écrire des migrations **idempotentes** (`IF NOT EXISTS` / `CREATE OR REPLACE`). Pour un DDL **destructif** sur une table live (DROP de colonne/table/contrainte, ALTER de type), prévenir l'utilisateur dans la réponse avant d'appliquer.

## Système SEO/GEO multi-agents (`.claude/`)
- Installé le 14/06/2026. **Point d'entrée UNIQUE** : agent `seo-chief` (`.claude/agents/seo-chief.md`). Il route vers 17 sous-agents (escouades Diagnostic / Sémantique / Exécution / Présence / Médias), parallélise le diagnostic (lecture seule), synthétise `.claude/seo-memory/seo-scoreboard.md` et **PROPOSE** des patchs (validation humaine avant toute écriture sur le site live). Ne JAMAIS lancer un agent d'escouade en direct.
- Usage : demander « lance seo-chief pour un audit complet » (ou ciblé). NB : les fichiers `.claude/agents/` ne deviennent des *types* d'agent qu'au (re)démarrage de session — en cours de session, faire exécuter un agent en lui faisant lire sa définition.
- Mémoire partagée : `.claude/seo-memory/*.md` (scoreboard, entity-graph, topical-coverage, serp-targets, brand-presence-map, citation-log, schema-proposals).
- Moteur cron : `.claude/seo-engine/` (scripts Python) + `.github/workflows/seo-engine.yml` — **DORMANT** (workflow_dispatch only, `schedule` commenté). Pas de VPS → GitHub Actions. Requiert des secrets absents par défaut (GSC service account, GA4, clés LLM) ; sinon les jobs échouent proprement. **Aucun connecteur GSC dispo** → fournir un compte de service Google.
- **Budget STRICT ≤ 2 CHF/mois** : tout à 0 € (agents via Claude Code, APIs Google + GitHub Actions gratuits) sauf `seo-geo-citation` (monitoring LLM, cap ≤ 1.50 CHF, hard-stop codé). Désactivés (web-only) : `seo-aso`, `seo-video`, `seo-crawl-budget`.
- Règles : croissance **Google-safe** (pas d'écriture massive, rate-limiting scrape), **données réelles uniquement** (jamais d'invention), pas de schema fake (`AggregateRating` seulement avec `generation_ratings`).

## Migrations / actions en attente
- ✅ Appliqué (07/06/2026) : `20260606_rate_limits.sql`, `20260607_generation_ratings.sql`.
- ✅ Appliqué (07/06/2026) : `20260607_blog_language.sql` (colonne `language` + unicité slug par langue). ⚠️ Le schéma est prêt mais le blog ne contient encore que du `fr` (38 articles) → `/en/blog` et `/de/blog` sont VIDES tant qu'on n'a pas backfillé. Script prêt : `scripts/backfill-blog.ts` (nécessite une `GEMINI_API_KEY` valide + `SUPABASE_SERVICE_ROLE_KEY` en local).
- ✅ Appliqué (14/06/2026) : `20260614_harden_cleanup_rate_limits_grants.sql` (REVOKE EXECUTE anon/authenticated sur `cleanup_rate_limits` — était ouvert à tous malgré le REVOKE FROM PUBLIC initial).
- 🔴 `GEMINI_API_KEY` **révoquée par Google** (« reported as leaked ») et toujours en clair dans `.env.local` → créer une nouvelle clé, supprimer l'ancienne, mettre à jour `.env.local` + Vercel. Bloque toute génération de blog.
- ⏳ Roter `CRON_SECRET` (historiquement exposé) si pas déjà fait. Activer la « leaked password protection » dans le dashboard Supabase (Auth → Password security).
- ℹ️ Advisors sécurité restants (intentionnels, ne pas « corriger ») : `get_own_credits`/`get_own_role`/`is_admin` exposés à anon/authenticated = REQUIS par les policies RLS (profiles, blog_articles), sans fuite (ne renvoient que les données de l'appelant). `rate_limits`/`trial_usage` RLS sans policy = tables service-role-only (deny par défaut = posture sûre).
