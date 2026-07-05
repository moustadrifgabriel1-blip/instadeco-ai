#!/usr/bin/env bash
#
# Lance UN job du moteur SEO depuis le VPS Hetzner (remplace GitHub Actions).
# Usage : run-seo-engine.sh <job>
#   jobs : gsc_daily | drift_check | rank_tracker | ctr_optimizer | competitor_diff | citation_batch
#
# Pourquoi le VPS plutot que GitHub Actions :
#   - horaires fiables (Actions retarde les crons et les coupe apres 60j sans commit),
#   - VPS deja paye (cout marginal nul), tout centralise au meme endroit que les crons app.
#
# Lit sa config depuis un fichier d'env (defaut /etc/instadeco-seo.env, override via
# INSTADECO_SEO_ENV). Voir docs/CRON_VPS_HETZNER.md (section moteur SEO).
#
set -euo pipefail

ENV_FILE="${INSTADECO_SEO_ENV:-/etc/instadeco-seo.env}"
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
fi

# Variables attendues dans le fichier d'env :
#   REPO_DIR=/opt/instadeco/instadeco-ai           # clone git du repo
#   VENV_DIR=/opt/instadeco/seo-venv               # venv python (cree une fois)
#   GOOGLE_APPLICATION_CREDENTIALS=/etc/instadeco-gsc.json  # cle du compte de service
#   GSC_SITE_URL=https://instadeco.app
#   GA4_PROPERTY_ID=...        # optionnel
#   PAGESPEED_API_KEY=...      # optionnel
#   OPENAI_API_KEY=...         # citation_batch seulement
#   PERPLEXITY_API_KEY=...     # citation_batch seulement
#   USD_CHF_RATE=0.88          # optionnel
#   PUSH_REPORTS=1             # 1 = commit+push des rapports apres le run, 0 = local seul
#   INSTADECO_BASE_URL=https://instadeco.app   # ctr_optimizer : POST des overrides
#   CRON_SECRET=...            # ctr_optimizer : Bearer de l'endpoint /api/cron/ctr-optimize
: "${REPO_DIR:?REPO_DIR manquant (ex: /opt/instadeco/instadeco-ai)}"
: "${VENV_DIR:?VENV_DIR manquant (ex: /opt/instadeco/seo-venv)}"
: "${GSC_SITE_URL:?GSC_SITE_URL manquant (ex: https://instadeco.app)}"
export GOOGLE_APPLICATION_CREDENTIALS GSC_SITE_URL GA4_PROPERTY_ID PAGESPEED_API_KEY \
       OPENAI_API_KEY PERPLEXITY_API_KEY USD_CHF_RATE \
       INSTADECO_BASE_URL CRON_SECRET CTR_MIN_IMPRESSIONS CTR_MAX_POSITION

job="${1:?Usage: run-seo-engine.sh <gsc_daily|drift_check|rank_tracker|ctr_optimizer|competitor_diff|citation_batch>}"
ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

cd "$REPO_DIR"

# Repo a jour (les scripts evoluent ; on tire main avant chaque run).
git pull --ff-only origin main >/dev/null 2>&1 || echo "$(ts) [seo:${job}] pull ignore (repo local modifie ?)"

# shellcheck disable=SC1091
. "$VENV_DIR/bin/activate"

case "$job" in
  gsc_daily)       script="monitors/gsc_daily.py" ;;
  drift_check)     script="monitors/drift_check.py" ;;
  rank_tracker)    script="monitors/rank_tracker.py" ;;
  ctr_optimizer)   script="monitors/ctr_optimizer.py" ;;
  competitor_diff) script="scrapers/competitor_diff.py" ;;
  citation_batch)  script="monitors/citation_batch.py" ;;
  *) echo "$(ts) [seo:${job}] job inconnu" && exit 1 ;;
esac

# Heartbeat : signale au site que ce job a tourne (rend le moteur VISIBLE malgre
# des rapports gitignores restes sur le VPS). Best-effort : ne fait JAMAIS
# echouer le job. Cf. app/api/cron/seo-heartbeat + table seo_engine_heartbeats.
send_heartbeat() {
  local status="$1"
  if [ -z "${INSTADECO_BASE_URL:-}" ] || [ -z "${CRON_SECRET:-}" ]; then
    echo "$(ts) [seo:${job}] heartbeat ignore (INSTADECO_BASE_URL/CRON_SECRET absent)"
    return 0
  fi
  if curl -sS -m 15 -X POST "$INSTADECO_BASE_URL/api/cron/seo-heartbeat" \
      -H "Authorization: Bearer $CRON_SECRET" \
      -H "Content-Type: application/json" \
      --data "{\"job\":\"${job}\",\"status\":\"${status}\"}" >/dev/null 2>&1; then
    echo "$(ts) [seo:${job}] heartbeat ${status} envoye"
  else
    echo "$(ts) [seo:${job}] heartbeat non envoye (endpoint injoignable)"
  fi
}

echo "$(ts) [seo:${job}] start"
if python ".claude/seo-engine/$script"; then
  echo "$(ts) [seo:${job}] OK"
  send_heartbeat ok
else
  echo "$(ts) [seo:${job}] ECHEC (voir sortie ci-dessus)"
  send_heartbeat error
  exit 1
fi

# Rapports : les renvoyer dans le repo pour que seo-chief les lise.
if [ "${PUSH_REPORTS:-0}" = "1" ]; then
  git add .claude/seo-engine/reports .claude/seo-engine/data .claude/seo-memory 2>/dev/null || true
  if ! git diff --cached --quiet; then
    git -c user.name="seo-engine" -c user.email="seo-engine@instadeco.app" \
      commit -q -m "chore(seo-engine): rapport ${job} ($(ts))" || true
    git push -q origin main 2>&1 | tail -2 || echo "$(ts) [seo:${job} push echec (droits git du VPS ?)"
    echo "$(ts) [seo:${job}] rapports pousses"
  else
    echo "$(ts) [seo:${job}] aucun changement de rapport"
  fi
fi
