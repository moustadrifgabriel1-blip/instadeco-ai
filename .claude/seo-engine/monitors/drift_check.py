#!/usr/bin/env python3
"""drift_check.py — Détection quotidienne des régressions on-page (seo-engine).

Rôle
----
Comparer les éléments SEO-critiques des pages clés d'InstaDeco
(title, meta description, H1, canonical, hreflang, schema JSON-LD) à des
baselines stockées dans `data/baselines/`, et alerter sur les régressions dans
`reports/drift_YYYY-MM-DD.md`. C'est le « git diff » du SEO on-page.

Règles
------
- Si une page est indisponible (HTTP != 200, réseau down) -> erreur explicite,
  sortie non-zéro. Aucun diff inventé.
- Première exécution sans baseline : on écrit la baseline courante et on note
  « baseline créée » (pas de comparaison fictive).
- On ne fabrique aucune valeur attendue : la baseline EST la vérité de référence.

TODO (points d'intégration)
---------------------------
- Définir la liste réelle des URLs clés à surveiller (PAGES).
- Brancher le fetch + extraction des champs au point `# TODO: fetch + extract`.
- Comparer champ par champ et classer chaque écart en régression / changement.
"""

from __future__ import annotations

import datetime as _dt
import json
import os
from pathlib import Path

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPORTS_DIR = _ENGINE_ROOT / "reports"
_BASELINES_DIR = _ENGINE_ROOT / "data" / "baselines"

_BASE_URL = os.environ.get("GSC_SITE_URL", "").replace("sc-domain:", "").strip().rstrip("/")
if not _BASE_URL.startswith("http"):
    _BASE_URL = "https://instadeco.app"
_TIMEOUT = 20
_UA = "Mozilla/5.0 (compatible; InstaDecoSEO/1.0; +https://instadeco.app)"

# Pages clés surveillées (money pages + hubs). Chemins relatifs au domaine.
PAGES: tuple[str, ...] = (
    "/fr",
    "/en",
    "/de",
    "/fr/essai",
    "/fr/pricing",
    "/fr/pro",
    "/fr/quiz",
    "/fr/galerie",
    "/fr/blog",
    "/fr/solution/avant-apres-decoration",
)

# Champs SEO-critiques comparés à la baseline.
TRACKED_FIELDS: tuple[str, ...] = (
    "title",
    "meta_description",
    "h1",
    "canonical",
    "hreflang",
    "schema",
)


class PageFetchError(RuntimeError):
    """Levée quand une page surveillée est indisponible. Pas de diff fictif."""


def _baseline_path(page: str) -> Path:
    slug = page.strip("/").replace("/", "_") or "root"
    return _BASELINES_DIR / f"{slug}.json"


def _extract_seo_fields(page: str) -> dict[str, str]:
    """Récupère et extrait les champs SEO d'une page. Lève si indisponible."""
    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "[drift_check] Dépendances absentes. "
            "pip install -r .claude/seo-engine/requirements.txt"
        ) from exc

    url = f"{_BASE_URL}{page}"
    try:
        resp = requests.get(url, timeout=_TIMEOUT, headers={"User-Agent": _UA})
    except requests.RequestException as exc:
        raise PageFetchError(f"{url} injoignable: {exc}") from exc
    if resp.status_code != 200:
        raise PageFetchError(f"{url} a renvoyé HTTP {resp.status_code}")

    soup = BeautifulSoup(resp.text, "lxml")

    def _meta(name: str, attr: str = "name") -> str:
        tag = soup.find("meta", attrs={attr: name})
        return (tag.get("content") or "").strip() if tag else ""

    title = (soup.title.string or "").strip() if soup.title else ""
    h1 = soup.find("h1")
    canonical = soup.find("link", rel="canonical")

    # hreflang : ensemble trié "lang=url" pour un diff stable.
    hreflangs = sorted(
        f"{l.get('hreflang')}={l.get('href')}"
        for l in soup.find_all("link", rel="alternate")
        if l.get("hreflang")
    )

    # schema : types @type de tous les blocs JSON-LD, triés.
    schema_types: list[str] = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except (ValueError, TypeError):
            continue
        for node in data if isinstance(data, list) else [data]:
            if isinstance(node, dict) and node.get("@type"):
                t = node["@type"]
                schema_types.extend(t if isinstance(t, list) else [t])

    return {
        "title": title,
        "meta_description": _meta("description"),
        "h1": h1.get_text(strip=True) if h1 else "",
        "canonical": (canonical.get("href") or "").strip() if canonical else "",
        "hreflang": " | ".join(hreflangs),
        "schema": ", ".join(sorted(schema_types)),
    }


def _diff_fields(baseline: dict[str, str], current: dict[str, str]) -> list[dict[str, str]]:
    """Retourne les écarts structurés : [{field, old, new}, ...]."""
    diffs: list[dict[str, str]] = []
    for field in TRACKED_FIELDS:
        old = baseline.get(field)
        new = current.get(field)
        if old != new:
            diffs.append({"field": field, "old": old or "", "new": new or ""})
    return diffs


def _write_report(sections: list[str]) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    path = _REPORTS_DIR / f"drift_{today}.md"
    body = [f"# Drift on-page — {today}", ""] + sections
    path.write_text("\n".join(body) + "\n", encoding="utf-8")
    return path


def _write_summary(
    today: str,
    anomalies: int,
    regressions: list[dict],
    unavailable: list[dict],
    baselines_created: list[str],
) -> None:
    """Résumé structuré pour le digest email. Consommé par seo-digest.sh."""
    summary = {
        "date": today,
        "pages_checked": len(PAGES),
        "anomalies": anomalies,
        "regressions": regressions,
        "unavailable": unavailable,
        "baselines_created": baselines_created,
    }
    (_REPORTS_DIR / f"drift_{today}.summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def run() -> tuple[Path, int]:
    """Compare chaque page à sa baseline et écrit le rapport.

    Résilient : une page indisponible est SIGNALÉE (c'est un drift) sans tuer
    le run. Retourne (chemin du rapport, nombre de pages en anomalie).
    """
    _BASELINES_DIR.mkdir(parents=True, exist_ok=True)
    sections: list[str] = []
    anomalies = 0
    regressions: list[dict] = []
    unavailable: list[dict] = []
    baselines_created: list[str] = []

    for page in PAGES:
        try:
            current = _extract_seo_fields(page)
        except PageFetchError as exc:
            anomalies += 1
            sections.append(f"## {page} — INDISPONIBLE\n- {exc}\n")
            unavailable.append({"page": page, "error": str(exc)})
            continue

        bpath = _baseline_path(page)
        if not bpath.exists():
            bpath.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
            sections.append(f"## {page}\nBaseline créée (aucune comparaison ce run).\n")
            baselines_created.append(page)
            continue
        baseline = json.loads(bpath.read_text(encoding="utf-8"))
        diffs = _diff_fields(baseline, current)
        if diffs:
            anomalies += 1
            diff_lines = [f"- **{d['field']}** : `{d['old']}` -> `{d['new']}`" for d in diffs]
            sections.append(f"## {page} — RÉGRESSIONS DÉTECTÉES\n" + "\n".join(diff_lines) + "\n")
            regressions.append({"page": page, "changes": diffs})
        else:
            sections.append(f"## {page}\nAucun changement.\n")

    header = (
        f"{anomalies} page(s) en anomalie sur {len(PAGES)} surveillées.\n"
        if anomalies
        else f"Aucune anomalie sur {len(PAGES)} pages surveillées.\n"
    )
    today = _dt.date.today().isoformat()
    _write_summary(today, anomalies, regressions, unavailable, baselines_created)
    return _write_report([header] + sections), anomalies


def main() -> None:
    """Entrée CLI : run quotidien du drift check."""
    try:
        report, anomalies = run()
    except (RuntimeError, NotImplementedError) as exc:
        raise SystemExit(f"[drift_check] ÉCHEC: {exc}")
    print(f"[drift_check] OK. {anomalies} anomalie(s). Rapport: {report}")


if __name__ == "__main__":
    main()
