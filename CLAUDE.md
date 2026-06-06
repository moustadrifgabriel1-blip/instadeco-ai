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
- Garder `maxDuration ≤ 60`, peu de crons. ⚠️ **Vercel Hobby interdit l'usage commercial** (ToS) → la voie strictement <10.-/mois conforme = **Cloudflare (Pages/Workers + R2)** (migration future).

## Pièges / fichiers sensibles
- Liens internes : utiliser `Link` de `@/i18n/navigation` (ou `next/link`), **jamais `<a href>` vers une page interne** (casse le build via ESLint + le routing i18n).
- `app/api/trial/generate/route.ts` : route critique (essai gratuit anti-abus). Préserver la logique `fal.run` synchrone.
- Le blog est sous `app/[locale]/(marketing)/blog/` (migré, localisé).
- Migrations Supabase dans `supabase/migrations/` : **les écrire mais demander à l'utilisateur de les appliquer** (pas d'accès DB en agent).

## Migrations / actions en attente
- Appliquer `supabase/migrations/20260606_rate_limits.sql` (sinon fallback mémoire automatique).
- Roter les secrets historiquement exposés (CRON_SECRET, GEMINI_API_KEY) si pas déjà fait.
