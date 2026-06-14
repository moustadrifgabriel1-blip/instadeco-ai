# Migration Cloudflare — POC & plan (pilier Coût → A+)

> **Statut : PLAN / POC — rien n'est déployé, la prod Vercel n'est pas touchée.**
> Objectif : sortir de **Vercel Pro 20$/mois** (forcé par les 10 crons + l'usage commercial interdit sur Hobby) pour tenir la contrainte **≤ 10.-/mois** (idéal < 2.-). Seul chemin conforme identifié dans CLAUDE.md.

## 1. Pourquoi
- Vercel **Hobby interdit l'usage commercial** (ToS) → on est captif de **Pro 20$/mois** = 2× le budget.
- Ce qui force Pro : **10 crons** (`vercel.json`) + `maxDuration` élevés. Le free tier Vercel plafonne à ~2 crons quotidiens.
- Cloudflare : **Workers/Pages gratuits** (100k req/jour), **Cron Triggers gratuits et illimités** (granularité fine), **R2** (egress gratuit), **D1** possible. Coût cible réel ≈ **0–5.-/mois**.

## 2. Stack cible
| Brique | Aujourd'hui (Vercel) | Cible (Cloudflare) |
|---|---|---|
| App Next.js 15 | Vercel | **`@opennextjs/cloudflare`** → Workers (Pages) |
| Crons (×10) | Vercel Cron (force Pro) | **Cron Triggers** (gratuits, illimités) + 1 Worker dispatcher |
| Storage images | Supabase Storage | **R2** (egress gratuit) — ou garder Supabase au début |
| DB / Auth | Supabase | **inchangé** (Supabase reste) |
| Emails (Resend), Stripe, FAL/Gemini | inchangés | inchangés |

## 3. POC — étapes (à exécuter quand tu valides, branche dédiée `poc/cloudflare`)
```bash
# 1. Adapter OpenNext pour Cloudflare
npm i -D @opennextjs/cloudflare wrangler
# 2. Config : copier le template versionné
cp wrangler.toml.example wrangler.toml   # puis remplir les bindings/secrets
# 3. Build + preview local Workers
npx opennextjs-cloudflare build
npx wrangler dev
# 4. Déploiement preview (compte Cloudflare requis)
npx wrangler deploy
```

## 4. Points de vigilance (spécifiques à ce projet)
1. **Génération `fal.run` SYNCHRONE** : les Workers ont des limites CPU différentes de Vercel (`maxDuration`). Tester que la génération (qui peut durer 60–120 s) passe — sinon activer le mode **Workers + Queues** ou garder cette route critique sur un compute compatible. ⚠️ Ne JAMAIS repasser sur `fal.queue.submit` (ré-exécute le modèle, double le coût — cf. CLAUDE.md).
2. **Webhooks Stripe idempotents** : runtime edge → vérifier que `processed_stripe_events` (verrou) + la lecture du `body` brut pour la signature fonctionnent (pas de `req.text()` consommé deux fois).
3. **Routes `nodejs`** : certaines routes déclarent `runtime = 'nodejs'`. OpenNext mappe vers le runtime Workers — auditer les API Node utilisées (crypto, Buffer).
4. **CRON_SECRET** : les Cron Triggers appellent les routes en interne ; conserver l'auth `Authorization: Bearer ${CRON_SECRET}` (ne jamais faire confiance à un header de plateforme seul).
5. **Variables d'env** : remapper toutes les env Vercel vers `wrangler secret put` / bindings. Attention au bug connu : `NEXT_PUBLIC_APP_URL` ne doit PAS contenir de retour-ligne (déjà durci côté code par `.trim()`).
6. **R2** : si on bascule le storage, adapter `SupabaseStorageService` (ou créer `R2StorageService` derrière le port `IStorageService`) + migrer les URLs signées + conserver le cron de purge.

## 5. Consolidation des crons (gain immédiat, même AVANT Cloudflare)
Indépendamment de Cloudflare, **réduire 10 → ≤2 crons** suffit à sortir de Pro :
- Fusionner les crons quotidiens (`check-milestones`, `maintenance-reminder`, `email-nurturing`) en **1 cron orchestrateur** qui dispatche selon l'heure/jour (modèle de rotation déjà utilisé dans `generate-articles`).
- Externaliser les crons non critiques (`pinterest-post`, `backlink-outreach`, `seo-health-check`) vers **cron-job.org** (gratuit) appelant les routes protégées par `CRON_SECRET`.
- Y intégrer la **réconciliation des générations zombies** (rembourser les générations bloquées `processing` > 5 min → évite les crédits perdus) au lieu d'ajouter un 11ᵉ cron.

## 6. Rollback
La migration se fait sur branche + preview Cloudflare. Tant que le DNS/instadeco.app pointe sur Vercel, **aucun risque prod**. Bascule DNS = dernière étape, réversible (re-pointer sur Vercel).

## 7. Décision
- [ ] Valider le POC sur `poc/cloudflare` (compute génération OK ? coût réel ?)
- [ ] Étape 1 sans risque : consolider les crons (≤2) sur Vercel → sortir de Pro tout de suite
- [ ] Étape 2 : bascule complète Cloudflare quand le POC est concluant
