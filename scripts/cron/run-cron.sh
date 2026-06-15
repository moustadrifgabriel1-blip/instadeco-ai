#!/usr/bin/env bash
#
# Lance UN cron InstaDeco depuis le VPS Hetzner (remplace les crons vercel.json).
# Usage : run-cron.sh <endpoint>          ex : run-cron.sh generate-articles
#
# Lit BASE_URL + CRON_SECRET depuis un fichier d'env (défaut /etc/instadeco-cron.env,
# override via INSTADECO_CRON_ENV). Voir docs/CRON_VPS_HETZNER.md.
#
set -euo pipefail

ENV_FILE="${INSTADECO_CRON_ENV:-/etc/instadeco-cron.env}"
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
fi

: "${BASE_URL:?BASE_URL manquant (ex: https://instadeco.app)}"
: "${CRON_SECRET:?CRON_SECRET manquant}"

endpoint="${1:?Usage: run-cron.sh <endpoint>}"
ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# -m 120 : marge > maxDuration ; on ne fait jamais échouer le shell (|| true) pour ne
# pas spammer le mail cron — on logue le code HTTP (200 attendu).
code=$(curl -sS -m 120 -o "/tmp/instadeco-cron-${endpoint//\//-}.out" -w "%{http_code}" \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "${BASE_URL}/api/cron/${endpoint}" || echo "000")

echo "$(ts) [cron:${endpoint}] HTTP ${code}"
[ "$code" = "200" ] || echo "$(ts) [cron:${endpoint}] ⚠️ non-200 — voir /tmp/instadeco-cron-${endpoint//\//-}.out"
