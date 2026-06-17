#!/usr/bin/env bash
#
# Lance UN job du moteur SEO depuis le VPS Hetzner (remplace GitHub Actions).
# Usage : run-seo-engine.sh <job>
#   jobs : gsc_daily | drift_check | rank_tracker | competitor_diff | citation_batch
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
: "${REPO_DIR:?REPO_DIR manquant (ex: /opt/instadeco/instadeco-ai)}"
: "${VENV_DIR:?VENV_DIR manquant (ex: /opt/instadeco/seo-venv)}"
: "${GSC_SITE_URL:?GSC_SITE_URL manquant (ex: https://instadeco.app)}"
export GOOGLE_APPLICATION_CREDENTIALS GSC_SITE_URL GA4_PROPERTY_ID PAGESPEED_API_KEY \
       OPENAI_API_KEY PERPLEXITY_API_KEY USD_CHF_RATE

job="${1:?Usage: run-seo-engine.sh <gsc_daily|drift_check|rank_tracker|competitor_diff|citation_batch>}"
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
  competitor_diff) script="scrapers/competitor_diff.py" ;;
  citation_batch)  script="monitors/citation_batch.py" ;;
  *) echo "$(ts) [seo:${job}] job inconnu" && exit 1 ;;
esac

echo "$(ts) [seo:${job}] start"
if python ".claude/seo-engine/$script"; then
  echo "$(ts) [seo:${job}] OK"
else
  echo "$(ts) [seo:${job}] ECHEC (voir sortie ci-dessus)"; exit 1
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
