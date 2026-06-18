#!/usr/bin/env python3
"""ctr_optimizer.py — Boucle d'auto-optimisation CTR (seo-engine).

Rôle
----
Détecter les pages qui rankent en page 1 de Google mais ne reçoivent AUCUN clic
(title hors requête), et leur proposer un title aligné sur la requête réellement
tapée par les internautes. Le title est template-déterministe (pas d'IA libre),
donc honnête par construction et conforme aux spam policies Google (cf. CLAUDE.md).

Boucle
------
1. GSC Search Analytics, dimensions [page, query] sur 28 jours glissants.
2. Agrégation par page : clics, impressions, requête dominante (top impressions),
   position de cette requête.
3. Candidate = page 1 (position <= SEUIL_POSITION), 0 clic, impressions >= SEUIL_IMPR,
   et chemin dans PATH_PREFIXES (pages dont generateMetadata lit les overrides).
4. Title déterministe à partir de la requête dominante.
5. POST des overrides à {BASE_URL}/api/cron/ctr-optimize (Bearer CRON_SECRET).
   Si BASE_URL/CRON_SECRET absents -> mode DRY-RUN : on écrit seulement le rapport.
6. Rapport `reports/ctr_YYYY-MM-DD.md`.

Règles
------
- AUCUNE donnée inventée : sans credentials GSC -> SystemExit clair.
- L'application ne touche QUE des pages à 0 clic (rien à perdre, zéro régression).
- L'endpoint re-valide chaque title (anti-IA, longueur) côté serveur.

Configuration (env)
-------------------
- GOOGLE_APPLICATION_CREDENTIALS, GSC_SITE_URL : comme gsc_daily.
- GSC_WINDOW_DAYS (défaut 28).
- INSTADECO_BASE_URL : ex https://instadeco.app (pour POST des overrides).
- CRON_SECRET : Bearer de l'endpoint cron.
- CTR_MIN_IMPRESSIONS (défaut 5), CTR_MAX_POSITION (défaut 10.5).
"""

from __future__ import annotations

import datetime as _dt
import json as _json
import os
import urllib.request
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPO_ROOT = _ENGINE_ROOT.parent.parent  # .claude/seo-engine -> repo
_REPORTS_DIR = _ENGINE_ROOT / "reports"
_DATA_DIR = _ENGINE_ROOT / "data"
_CITIES_TS = _REPO_ROOT / "src" / "shared" / "constants" / "cities.ts"

_GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
_GSC_LATENCY_DAYS = 3

# Pages dont generateMetadata lit les overrides (seules ciblées en v1).
PATH_PREFIXES = ("/architecte-interieur/",)
# Petits mots gardés en minuscule dans le title-case.
_SMALL_WORDS = {
    "de", "d", "du", "des", "la", "le", "les", "à", "a", "en", "et",
    "un", "une", "pour", "sur", "au", "aux", "par",
}


def _require_credentials() -> tuple[str, str]:
    creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    site_url = os.environ.get("GSC_SITE_URL", "").strip()
    if not creds_path or not Path(creds_path).is_file():
        raise SystemExit(
            "[ctr_optimizer] GOOGLE_APPLICATION_CREDENTIALS absent ou introuvable "
            "(cf. docs/CRON_VPS_HETZNER.md). Aucune donnée inventée."
        )
    if not site_url:
        raise SystemExit("[ctr_optimizer] GSC_SITE_URL absent.")
    return creds_path, site_url


def _build_service(creds_path: str):
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "[ctr_optimizer] Dépendances Google absentes. "
            "pip install -r .claude/seo-engine/requirements.txt"
        ) from exc

    creds = service_account.Credentials.from_service_account_file(
        creds_path, scopes=[_GSC_SCOPE]
    )
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def _fetch_page_query_rows(creds_path: str, site_url: str) -> list[dict]:
    window = int(os.environ.get("GSC_WINDOW_DAYS", "28") or "28")
    end = _dt.date.today() - _dt.timedelta(days=_GSC_LATENCY_DAYS)
    start = end - _dt.timedelta(days=window - 1)
    body = {
        "startDate": start.isoformat(),
        "endDate": end.isoformat(),
        "dimensions": ["page", "query"],
        "rowLimit": 2000,
    }
    service = _build_service(creds_path)
    try:
        resp = service.searchanalytics().query(siteUrl=site_url, body=body).execute()
    except Exception as exc:
        raise RuntimeError(f"appel Search Analytics échoué: {exc}") from exc
    return resp.get("rows", [])


def _path_from_url(url: str) -> str | None:
    """https://instadeco.app/fr/architecte-interieur/nice -> /architecte-interieur/nice."""
    marker = "instadeco.app"
    if marker not in url:
        return None
    tail = url.split(marker, 1)[1]  # /fr/architecte-interieur/nice
    for loc in ("/fr", "/en", "/de"):
        if tail == loc or tail.startswith(loc + "/"):
            tail = tail[len(loc):] or "/"
            break
    tail = tail.split("?")[0].split("#")[0].rstrip("/")
    return tail or "/"


def _title_case(query: str) -> str:
    out = []
    for i, w in enumerate(query.split()):
        lw = w.lower()
        core = lw.strip("'")
        if i > 0 and core in _SMALL_WORDS:
            out.append(lw)
        else:
            out.append(lw[:1].upper() + lw[1:])
    return " ".join(out)


_CITY_BY_SLUG: dict[str, str] | None = None


def _load_cities() -> dict[str, str]:
    """Mapping slug -> nom de ville ACCENTUÉ, lu depuis cities.ts (source de vérité).

    GSC renvoie les requêtes sans accents ; on reconstruit donc le nom propre depuis
    le repo pour produire un title de qualité (« Neuchâtel », pas « neuchatel »).
    """
    global _CITY_BY_SLUG
    if _CITY_BY_SLUG is not None:
        return _CITY_BY_SLUG
    mapping: dict[str, str] = {}
    try:
        import re

        text = _CITIES_TS.read_text(encoding="utf-8")
        # Chaque entrée : { name: 'Xxx', slug: 'xxx', ... } (name avant slug).
        for name, slug in re.findall(r"name:\s*'([^']+)'[^}]*?slug:\s*'([^']+)'", text):
            mapping[slug] = name
    except Exception:
        mapping = {}
    _CITY_BY_SLUG = mapping
    return mapping


def _metier(query: str) -> str:
    """Métier déduit de la requête réelle (GSC, sans accents)."""
    q = query.lower()
    if "decorateur" in q or "décorateur" in q or "decoration" in q or "décoration" in q:
        return "Décorateur d'intérieur"
    if "design" in q:
        return "Designer d'intérieur"
    return "Architecte d'intérieur"


def _build_title(path: str, query: str) -> str:
    """Title propre. Pages villes : nom accentué + métier aligné sur la requête.
    Sinon, repli sur un title-case de la requête."""
    if path.startswith("/architecte-interieur/"):
        slug = path.rsplit("/", 1)[-1]
        name = _load_cities().get(slug)
        if name:
            return f"{_metier(query)} à {name} : visualisez votre déco par IA"[:68]
    base = _title_case(query.strip())
    return f"{base} : le rendu déco par IA"[:68]


def _aggregate(rows: list[dict]) -> dict[str, dict]:
    by_page: dict[str, dict] = {}
    for r in rows:
        keys = r.get("keys") or []
        if len(keys) < 2:
            continue
        url, query = keys[0], keys[1]
        path = _path_from_url(url)
        if not path or not path.startswith(PATH_PREFIXES):
            continue
        clicks = int(r.get("clicks", 0))
        impr = int(r.get("impressions", 0))
        pos = float(r.get("position", 0.0))
        agg = by_page.setdefault(
            path, {"clicks": 0, "impressions": 0, "top_query": None, "top_impr": 0, "top_pos": 0.0}
        )
        agg["clicks"] += clicks
        agg["impressions"] += impr
        if impr > agg["top_impr"]:
            agg["top_impr"] = impr
            agg["top_query"] = query
            agg["top_pos"] = pos
    return by_page


def _candidates(by_page: dict[str, dict]) -> list[dict]:
    min_impr = int(os.environ.get("CTR_MIN_IMPRESSIONS", "5") or "5")
    max_pos = float(os.environ.get("CTR_MAX_POSITION", "10.5") or "10.5")
    out = []
    for path, a in by_page.items():
        if a["clicks"] == 0 and a["impressions"] >= min_impr and 0 < a["top_pos"] <= max_pos and a["top_query"]:
            out.append(
                {
                    "path": path,
                    "title": _build_title(path, a["top_query"]),
                    "source_query": a["top_query"],
                    "clicks": a["clicks"],
                    "impressions": a["impressions"],
                    "position": round(a["top_pos"], 1),
                }
            )
    out.sort(key=lambda x: x["impressions"], reverse=True)
    return out


def _post_overrides(overrides: list[dict]) -> str:
    base = os.environ.get("INSTADECO_BASE_URL", "").strip().rstrip("/")
    secret = os.environ.get("CRON_SECRET", "").strip()
    if not base or not secret:
        return "DRY-RUN (INSTADECO_BASE_URL ou CRON_SECRET absent, aucun POST)"
    payload = _json.dumps({"overrides": overrides}).encode("utf-8")
    req = urllib.request.Request(
        f"{base}/api/cron/ctr-optimize",
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {secret}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return f"POST {resp.status}: {resp.read().decode('utf-8')[:200]}"
    except Exception as exc:
        return f"POST échoué: {exc}"


def _write_report(candidates: list[dict], post_result: str) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    lines = [
        f"# CTR optimizer, {today}",
        "",
        f"{len(candidates)} page(s) page 1 sans clic détectée(s). Application : {post_result}",
        "",
    ]
    if candidates:
        lines += ["| page | requête dominante | impr | position | title proposé |", "|---|---|---:|---:|---|"]
        for c in candidates:
            lines.append(
                f"| {c['path']} | {c['source_query']} | {c['impressions']} | {c['position']} | {c['title']} |"
            )
    else:
        lines.append("_Aucune page candidate sur la période._")
    lines.append("")
    path = _REPORTS_DIR / f"ctr_{today}.md"
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


def main() -> None:
    creds_path, site_url = _require_credentials()
    try:
        rows = _fetch_page_query_rows(creds_path, site_url)
    except RuntimeError as exc:
        raise SystemExit(f"[ctr_optimizer] ÉCHEC API: {exc}")
    candidates = _candidates(_aggregate(rows))
    post_result = _post_overrides(candidates) if candidates else "rien à appliquer"
    report = _write_report(candidates, post_result)
    print(f"[ctr_optimizer] OK. {len(candidates)} candidate(s). {post_result}. Rapport: {report}")


if __name__ == "__main__":
    main()
