# Observabilité — InstaDeco

## En place : alerte email sur erreur CRITICAL (zéro coût)

L'audit a relevé que les erreurs CRITICAL (échec de remboursement de crédit, échec
webhook) étaient loggées en console **sans alerte** — personne n'est prévenu si un
crédit/paiement casse.

Correctif (`lib/notifications/critical-alert.ts` + hook dans
`src/infrastructure/services/logger/ConsoleLoggerService.ts`) :
tout `logger.error('CRITICAL: ...')` envoie un email à l'admin via **Resend**
(déjà configuré). Couvre automatiquement les 4 sites CRITICAL existants
(remboursements dans `GenerateDesignUseCase`, `GetGenerationStatusUseCase`,
`ReconcileStuckGenerationsUseCase`).

Garde-fous : no-op hors production, no-op sans `RESEND_API_KEY`, anti-spam mémoire
(1 email max / 10 min par message), ne jette jamais, ne reboucle jamais dans le logger.

### Variables d'env (optionnelles)

| Variable | Défaut | Rôle |
|---|---|---|
| `ADMIN_ALERT_EMAIL` | `ADMIN_EMAIL` puis `moustadrifgabriel1@gmail.com` | Destinataire des alertes CRITICAL |
| `RESEND_API_KEY` | — | Sans elle, les alertes sont silencieusement ignorées |
| `RESEND_FROM_EMAIL` | `InstaDeco AI <contact@instadeco.app>` | Expéditeur |

Rien à faire si Resend est déjà configuré en prod : les alertes partent toutes seules.

## Plus tard (optionnel) : Sentry free tier

Pour un suivi d'erreurs plus riche (toutes les exceptions, pas seulement CRITICAL,
breadcrumbs, releases), Sentry a un palier gratuit (5 000 erreurs/mois) compatible
avec la contrainte ≤10.-/mois. Procédure :

1. Créer un projet Sentry (compte gratuit) → récupérer le **DSN**.
2. `npm i @sentry/nextjs` puis `npx @sentry/wizard@latest -i nextjs` (génère
   `sentry.{client,server,edge}.config.ts` + `instrumentation.ts`).
3. Mettre `SENTRY_DSN` (et `NEXT_PUBLIC_SENTRY_DSN`) dans Vercel env.
4. Dans `ConsoleLoggerService.error`, ajouter `Sentry.captureException(error)` à côté
   de l'alerte email (garder l'email pour les CRITICAL « argent »).

> Non installé par défaut : ajoute une dépendance + un plugin webpack (upload de
> source maps) qui alourdit le build et complique la future migration Cloudflare.
> À activer seulement si le volume d'erreurs le justifie. L'alerte email couvre déjà
> le risque principal (être prévenu quand un crédit/paiement échoue).
