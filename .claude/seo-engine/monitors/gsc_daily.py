#!/usr/bin/env python3
"""gsc_daily.py — Snapshot quotidien Google Search Console (seo-engine).

Rôle
----
Interroger l'API Search Console (Search Analytics) via un **compte de service**
et écrire un rapport quotidien `reports/gsc_YYYY-MM-DD.md` (top requêtes / pages,
clics, impressions, CTR, position moyenne).

Règles
------
- Credentials absents ou invalides -> `SystemExit` avec message clair.
- API en erreur -> erreur explicite, sortie non-zéro.
- AUCUNE donnée inventée : si l'API ne répond pas, pas de rapport bidon.

Configuration (env / secrets GitHub)
------------------------------------
- GOOGLE_APPLICATION_CREDENTIALS : chemin du JSON du compte de service.
- GSC_SITE_URL : ex. https://instadeco.app

TODO (points d'intégration)
---------------------------
- Construire le client `googleapiclient` avec le scope
  https://www.googleapis.com/auth/webmasters.readonly et appeler
  searchanalytics().query() au point `# TODO: appel API réel`.
"""

from __future__ import annotations

import datetime as _dt
import os
from pathlib import Path

try:  # python-dotenv est optionnel en CI (les vars viennent des secrets).
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPORTS_DIR = _ENGINE_ROOT / "reports"

_GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"


def _require_credentials() -> tuple[str, str]:
    """Vérifie la présence des credentials. Sort proprement sinon."""
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    site_url = os.environ.get("GSC_SITE_URL", "").strip()

    if not creds_path:
        raise SystemExit(
            "[gsc_daily] GOOGLE_APPLICATION_CREDENTIALS absent. "
            "Configurer le compte de service (cf. README). Aucune donnée inventée."
        )
    if not Path(creds_path).is_file():
        raise SystemExit(
            f"[gsc_daily] Fichier de credentials introuvable: {creds_path}"
        )
    if not site_url:
        raise SystemExit(
            "[gsc_daily] GSC_SITE_URL absent (ex: https://instadeco.app)."
        )
    return creds_path, site_url


def fetch_search_analytics(creds_path: str, site_url: str) -> list[dict]:
    """Interroge Search Analytics. Lève en cas d'erreur. Jamais de fake."""
    # TODO: appel API réel.
    #   from google.oauth2 import service_account
    #   from googleapiclient.discovery import build
    #   creds = service_account.Credentials.from_service_account_file(
    #       creds_path, scopes=[_GSC_SCOPE])
    #   service = build("searchconsole", "v1", credentials=creds)
    #   end = _dt.date.today() - _dt.timedelta(days=1)   # GSC a ~2j de latence
    #   start = end - _dt.timedelta(days=1)
    #   body = {"startDate": start.isoformat(), "endDate": end.isoformat(),
    #           "dimensions": ["query", "page"], "rowLimit": 100}
    #   resp = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    #   return resp.get("rows", [])
    raise NotImplementedError(
        "gsc_daily.fetch_search_analytics : appel API non branché (cf. TODO). "
        "Refus de produire un rapport sans données GSC réelles."
    )


def _write_report(site_url: str, rows: list[dict]) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    path = _REPORTS_DIR / f"gsc_{today}.md"
    lines = [f"# GSC — {site_url} — {today}", ""]
    # TODO: formater les lignes (top requêtes/pages, clics, impressions, CTR, pos).
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> None:
    """Entrée CLI : snapshot GSC du jour."""
    creds_path, site_url = _require_credentials()
    try:
        rows = fetch_search_analytics(creds_path, site_url)
    except (RuntimeError, NotImplementedError) as exc:
        raise SystemExit(f"[gsc_daily] ÉCHEC API: {exc}")
    report = _write_report(site_url, rows)
    print(f"[gsc_daily] Rapport écrit: {report}")


if __name__ == "__main__":
    main()
