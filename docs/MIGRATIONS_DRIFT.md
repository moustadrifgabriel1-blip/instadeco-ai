# Drift de tracking des migrations Supabase

> État au 2026-06-15 (audit). À lire avant tout `supabase db push`.

## Constat

`supabase_migrations.schema_migrations` (prod `tocgrsdlegabfkykhdrz`) ne contient que
**8 versions**, toutes ≥ `20260607`, alors que `supabase/migrations/` contient **22 fichiers**.
Les **15 fichiers antérieurs** (`00001_initial_schema` → `20260419_seo_health_reports`) ne sont
**pas trackés** — pourtant leur DDL **est bien en prod** (toutes les tables/fonctions existent).
Ils ont été appliqués avant l'usage du MCP `apply_migration` (SQL editor / `db push` initial)
sans enregistrement dans `schema_migrations`.

### Migrations trackées en prod

| version (remote) | name |
|---|---|
| 20260607172440 | rate_limits |
| 20260607172612 | generation_ratings |
| 20260607190430 | blog_language |
| 20260614115103 | harden_cleanup_rate_limits_grants |
| 20260615114212 | atomic_credit_ledger |
| 20260615114734 | credit_transactions_type_check_superset |
| 20260615150459 | harden_credit_ledger_grants |
| 20260615150716 | stripe_idempotency |

### Fichiers locaux NON trackés (DDL déjà en prod)

`00001_initial_schema`, `20260120_create_blog_articles`, `20260130_app_settings`,
`20260130_audit_logs`, `20260131_fix_blog_rls`, `20260208_backlink_outreach`,
`20260209_atomic_credits`, `20260209_referral_system`, `20260211_fix_function_search_path`,
`20260211_fix_profiles_rls_recursion`, `20260211_revoke_increment_credits`,
`20260211_rgpd_consent_marketing`, `20260212_trial_usage`, `20260215_create_leads`,
`20260419_seo_health_reports`.

## Pourquoi ce n'est PAS auto-réparé

1. **Collisions de version locales.** Plusieurs fichiers partagent le même préfixe
   numérique : `20260130_*` (×2), `20260209_*` (×2), `20260211_*` (×3), `20260606_*` (×2).
   La CLI Supabase dérive la version du préfixe du nom de fichier → ces doublons cassent
   `supabase db push` **côté local**, avant même de comparer au remote. Il faut d'abord
   **renommer** ces fichiers en timestamps 14 chiffres uniques.
2. **Risque de corruption.** Insérer des versions devinées dans `schema_migrations` peut
   désynchroniser davantage le tracking. Une réparation doit être faite avec la CLI officielle.
3. **Le workflow actuel ne déclenche pas le bug.** On applique les migrations via le MCP
   `apply_migration` (SQL inline + enregistrement automatique), qui n'utilise pas les fichiers
   locaux. Le drift est donc **inerte** tant qu'on ne lance pas `supabase db push`.

## Procédure de réconciliation (quand on voudra revenir à `db push`)

Pré-requis : `supabase` CLI lié au projet (`supabase link --project-ref tocgrsdlegabfkykhdrz`).

1. **Renommer** les fichiers à préfixe en collision pour leur donner un timestamp
   14 chiffres unique et croissant (garder l'ordre chronologique d'application).
   Ex : `20260211_fix_function_search_path.sql` → `20260211090000_fix_function_search_path.sql`,
   `20260211_fix_profiles_rls_recursion.sql` → `20260211090100_...`, etc.
2. **Rendre idempotent** tout DDL non idempotent de ces fichiers (`CREATE TABLE IF NOT EXISTS`,
   `CREATE OR REPLACE FUNCTION`, `DROP ... IF EXISTS`) — filet en cas de ré-exécution.
3. **Marquer comme appliquées** sans rejouer le DDL (le schéma est déjà en prod) :
   ```bash
   supabase migration repair --status applied <version1> <version2> ...
   ```
   (une version par fichier non tracké, dans l'ordre).
4. **Vérifier** : `supabase migration list` doit montrer Local == Remote, et
   `supabase db push --dry-run` ne doit plus proposer aucune migration.

## Recommandation

Tant qu'on reste sur le MCP `apply_migration`, ne rien changer : continuer à écrire le `.sql`
dans `supabase/migrations/` (source de vérité versionnée) puis appliquer via le MCP.
N'engager la réconciliation ci-dessus que si l'équipe rebascule sur `supabase db push`/CI DB.
