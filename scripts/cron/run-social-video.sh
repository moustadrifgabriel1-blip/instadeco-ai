#!/usr/bin/env bash
#
# run-social-video.sh — Lance la publication video sociale (Reel IG + video FB) avec un
# TOURNUS d'heure : le cron declenche en debut de fenetre, ce script dort un delai
# ALEATOIRE, donc l'heure reelle de publication varie chaque jour dans la fenetre.
#
# Usage : run-social-video.sh [maxDelaySeconds]   (defaut 36000 = 10h)
# Exemple cron (06:01 UTC = 08:01 Paris l'ete) :
#   1 6 * * * /opt/instadeco/instadeco-ai/scripts/cron/run-social-video.sh 36600 >> /var/log/instadeco-cron.log 2>&1
#
# Env (overridables) :
#   INSTADECO_APP_DIR   defaut /opt/instadeco/instadeco-ai
#   INSTADECO_SOCIAL_ENV defaut /etc/instadeco-social.env (secrets Supabase + Meta)
#   FFMPEG_PATH         defaut /opt/instadeco/bin/ffmpeg
set -uo pipefail

APP_DIR="${INSTADECO_APP_DIR:-/opt/instadeco/instadeco-ai}"
ENV_FILE="${INSTADECO_SOCIAL_ENV:-/etc/instadeco-social.env}"
FFMPEG_BIN="${FFMPEG_PATH:-/opt/instadeco/bin/ffmpeg}"
MAX_DELAY="${1:-36000}"

# Delai aleatoire uniforme 0..MAX_DELAY. shuf evite le plafond de $RANDOM (32767).
DELAY="$(shuf -i 0-"${MAX_DELAY}" -n 1 2>/dev/null || echo 0)"
echo "$(date -u +%FT%TZ) [social-video] tournus : sleep ${DELAY}s avant publication"
sleep "${DELAY}"

cd "${APP_DIR}" || { echo "APP_DIR introuvable: ${APP_DIR}"; exit 1; }
echo "$(date -u +%FT%TZ) [social-video] publication"
# Le script charge les secrets via dotenv (SOCIAL_ENV_FILE), pas par sourcing shell.
SOCIAL_ENV_FILE="${ENV_FILE}" FFMPEG_PATH="${FFMPEG_BIN}" exec node_modules/.bin/tsx scripts/social-video-publish.ts
