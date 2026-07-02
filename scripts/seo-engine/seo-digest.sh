#!/usr/bin/env bash
#
# Digest SEO hebdomadaire : rassemble les derniers résumés JSON (gsc/drift/rank/ctr,
# écrits par les monitors dans .claude/seo-engine/reports/*.summary.json) et les
# POSTe à /api/cron/seo-digest, qui envoie un email HTML (DA prestige) via Resend.
#
# Lit sa config depuis le même fichier d'env que run-seo-engine.sh (défaut
# /etc/instadeco-seo.env, override via INSTADECO_SEO_ENV). Voir docs/CRON_VPS_HETZNER.md.
#
set -euo pipefail

ENV_FILE="${INSTADECO_SEO_ENV:-/etc/instadeco-seo.env}"
if [ -f "$ENV_FILE" ]; then
  set -a; . "$ENV_FILE"; set +a
fi

: "${REPO_DIR:?REPO_DIR manquant (ex: /opt/instadeco/instadeco-ai)}"
: "${INSTADECO_BASE_URL:?INSTADECO_BASE_URL manquant (ex: https://instadeco.app)}"
: "${CRON_SECRET:?CRON_SECRET manquant}"

REPORTS_DIR="$REPO_DIR/.claude/seo-engine/reports"
PAYLOAD_FILE="$(mktemp /tmp/instadeco-seo-digest-XXXXXX.json)"
trap 'rm -f "$PAYLOAD_FILE"' EXIT

python3 - "$REPORTS_DIR" > "$PAYLOAD_FILE" <<'PY'
import json, sys, glob, os, datetime

reports_dir = sys.argv[1]


def latest(prefix):
    files = sorted(glob.glob(os.path.join(reports_dir, f"{prefix}_*.summary.json")))
    if not files:
        return None
    with open(files[-1], encoding="utf-8") as f:
        return json.load(f)


payload = {
    "weekOf": datetime.date.today().isoformat(),
    "gsc": latest("gsc"),
    "drift": latest("drift"),
    "rank": latest("rank"),
    "ctr": latest("ctr"),
}
print(json.dumps(payload, ensure_ascii=False))
PY

if [ ! -s "$PAYLOAD_FILE" ] || ! grep -q '"gsc"' "$PAYLOAD_FILE"; then
  echo "[seo-digest] aucun résumé trouvé dans $REPORTS_DIR, rien à envoyer"
  exit 0
fi

curl -sS -X POST "$INSTADECO_BASE_URL/api/cron/seo-digest" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  --data-binary "@$PAYLOAD_FILE"
echo
