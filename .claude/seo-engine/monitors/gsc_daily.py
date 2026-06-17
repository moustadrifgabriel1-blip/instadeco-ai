#!/usr/bin/env python3
"""gsc_daily.py — Snapshot quotidien Google Search Console (seo-engine).

Rôle
----
Interroger l'API Search Console (Search Analytics) via un **compte de service**
et écrire un rapport `reports/gsc_YYYY-MM-DD.md` (totaux + top requêtes / pages :
clics, impressions, CTR, position moyenne) sur 28 jours glissants, plus un
snapshot machine `data/gsc_YYYY-MM-DD.json` consommé par les autres outils.

Règles
------
- Credentials absents ou invalides -> `SystemExit` avec message clair.
- API en erreur -> erreur explicite, sortie non-zéro.
- AUCUNE donnée inventée : si l'API ne répond pas, pas de rapport bidon.

Configuration (env / secrets)
-----------------------------
- GOOGLE_APPLICATION_CREDENTIALS : chemin du JSON du compte de service.
- GSC_SITE_URL : propriété GSC. Préfixe d'URL `https://instadeco.app/`
  OU propriété domaine `sc-domain:instadeco.app` (l'e-mail du compte de
  service doit être ajouté en utilisateur de cette propriété).
- GSC_WINDOW_DAYS : fenêtre d'analyse (défaut 28).
- GSC_ROW_LIMIT : nombre de lignes top requêtes/pages (défaut 25).
"""

from __future__ import annotations

import datetime as _dt
import json as _json
import os
from pathlib import Path

try:  # python-dotenv est optionnel (en VPS/CI les vars viennent de l'env).
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPORTS_DIR = _ENGINE_ROOT / "reports"
_DATA_DIR = _ENGINE_ROOT / "data"

_GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
# GSC a ~2 à 3 jours de latence sur les données finales.
_GSC_LATENCY_DAYS = 3


def _require_credentials() -> tuple[str, str]:
    """Vérifie la présence des credentials. Sort proprement sinon."""
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    site_url = os.environ.get("GSC_SITE_URL", "").strip()

    if not creds_path:
        raise SystemExit(
            "[gsc_daily] GOOGLE_APPLICATION_CREDENTIALS absent. "
            "Configurer le compte de service (cf. docs/CRON_VPS_HETZNER.md). "
            "Aucune donnée inventée."
        )
    if not Path(creds_path).is_file():
        raise SystemExit(
            f"[gsc_daily] Fichier de credentials introuvable: {creds_path}"
        )
    if not site_url:
        raise SystemExit(
            "[gsc_daily] GSC_SITE_URL absent (ex: https://instadeco.app/ "
            "ou sc-domain:instadeco.app)."
        )
    return creds_path, site_url


def _build_service(creds_path: str):
    """Construit le client Search Console. Erreur explicite si deps absentes."""
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "[gsc_daily] Dépendances Google absentes. "
            "pip install -r .claude/seo-engine/requirements.txt"
        ) from exc

    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=[_GSC_SCOPE]
    )
    # cache_discovery=False : évite un warning et un cache inutile sur le VPS.
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def _query(service, site_url: str, body: dict) -> list[dict]:
    """Un appel searchanalytics().query(). Traduit les erreurs API en RuntimeError."""
    try:
        resp = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    except Exception as exc:  # googleapiclient.errors.HttpError et réseau
        raise RuntimeError(f"appel Search Analytics échoué: {exc}") from exc
    return resp.get("rows", [])


def fetch_search_analytics(creds_path: str, site_url: str) -> dict:
    """Interroge GSC (totaux + top requêtes + top pages). Lève en cas d'erreur."""
    window = int(os.environ.get("GSC_WINDOW_DAYS", "28") or "28")
    row_limit = int(os.environ.get("GSC_ROW_LIMIT", "25") or "25")
    end = _dt.date.today() - _dt.timedelta(days=_GSC_LATENCY_DAYS)
    start = end - _dt.timedelta(days=window - 1)
    base = {"startDate": start.isoformat(), "endDate": end.isoformat()}

    service = _build_service(creds_path)

    totals_rows = _query(service, site_url, {**base, "rowLimit": 1})
    totals = totals_rows[0] if totals_rows else {}

    queries = _query(
        service, site_url, {**base, "dimensions": ["query"], "rowLimit": row_limit}
    )
    pages = _query(
        service, site_url, {**base, "dimensions": ["page"], "rowLimit": row_limit}
    )

    return {
        "site_url": site_url,
        "start": base["startDate"],
        "end": base["endDate"],
        "window_days": window,
        "totals": {
            "clicks": totals.get("clicks", 0),
            "impressions": totals.get("impressions", 0),
            "ctr": totals.get("ctr", 0.0),
            "position": totals.get("position", 0.0),
        },
        "top_queries": queries,
        "top_pages": pages,
    }


def _fmt_rows(rows: list[dict], label: str) -> list[str]:
    if not rows:
        return [f"_Aucune {label} sur la période._", ""]
    out = [
        f"| {label} | clics | impressions | CTR | position |",
        "|---|---:|---:|---:|---:|",
    ]
    for r in rows:
        key = (r.get("keys") or ["?"])[0]
        out.append(
            f"| {key} | {int(r.get('clicks', 0))} | {int(r.get('impressions', 0))} "
            f"| {r.get('ctr', 0.0) * 100:.1f}% | {r.get('position', 0.0):.1f} |"
        )
    out.append("")
    return out


def _write_report(data: dict) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()

    # Snapshot machine (consommé par drift/scoreboard).
    (_DATA_DIR / f"gsc_{today}.json").write_text(
        _json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    t = data["totals"]
    lines = [
        f"# GSC, {data['site_url']}, {today}",
        "",
        f"Période : {data['start']} au {data['end']} ({data['window_days']} jours glissants).",
        "",
        "## Totaux",
        "| clics | impressions | CTR | position moyenne |",
        "|---:|---:|---:|---:|",
        f"| {int(t['clicks'])} | {int(t['impressions'])} "
        f"| {t['ctr'] * 100:.1f}% | {t['position']:.1f} |",
        "",
        "## Top requêtes",
        *_fmt_rows(data["top_queries"], "requête"),
        "## Top pages",
        *_fmt_rows(data["top_pages"], "page"),
    ]
    path = _REPORTS_DIR / f"gsc_{today}.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> None:
    """Entrée CLI : snapshot GSC du jour."""
    creds_path, site_url = _require_credentials()
    try:
        data = fetch_search_analytics(creds_path, site_url)
    except (RuntimeError, NotImplementedError) as exc:
        raise SystemExit(f"[gsc_daily] ÉCHEC API: {exc}")
    report = _write_report(data)
    t = data["totals"]
    print(
        f"[gsc_daily] OK. {int(t['clicks'])} clics / {int(t['impressions'])} "
        f"impressions sur {data['window_days']}j. Rapport: {report}"
    )


if __name__ == "__main__":
    main()
