#!/usr/bin/env bash
#
# run-social-pinterest.sh — Publie un pin avant/apres sur Pinterest avec un TOURNUS
# d'heure (delai aleatoire avant publication, comme la video sociale). Horaire de cron
# distinct des posts Meta pour etaler la cadence.
#
# Usage : run-social-pinterest.sh [maxDelaySeconds]   (defaut 36000 = 10h)
# Exemple cron (10:07 UTC = 12:07 Paris ete, + delai aleatoire) :
#   7 10 * * * /opt/instadeco/instadeco-ai/scripts/cron/run-social-pinterest.sh 28800 >> /var/log/instadeco-cron.log 2>&1
set -uo pipefail

APP_DIR="${INSTADECO_APP_DIR:-/opt/instadeco/instadeco-ai}"
ENV_FILE="${INSTADECO_SOCIAL_ENV:-/etc/instadeco-social.env}"
MAX_DELAY="${1:-36000}"

DELAY="$(shuf -i 0-"${MAX_DELAY}" -n 1 2>/dev/null || echo 0)"
echo "$(date -u +%FT%TZ) [social-pinterest] tournus : sleep ${DELAY}s avant publication"
sleep "${DELAY}"

cd "${APP_DIR}" || { echo "APP_DIR introuvable: ${APP_DIR}"; exit 1; }
echo "$(date -u +%FT%TZ) [social-pinterest] publication"
SOCIAL_ENV_FILE="${ENV_FILE}" exec node_modules/.bin/tsx scripts/social-pinterest-publish.ts --limit=1
