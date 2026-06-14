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
from pathlib import Path

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPORTS_DIR = _ENGINE_ROOT / "reports"
_BASELINES_DIR = _ENGINE_ROOT / "data" / "baselines"

# Pages clés à surveiller (chemins relatifs au domaine instadeco.app).
# TODO: compléter avec les vraies money pages / pages localisées.
PAGES: tuple[str, ...] = (
    "/fr",
    "/en",
    "/de",
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
    # TODO: fetch + extract — récupérer https://instadeco.app{page},
    #   vérifier le status (sinon PageFetchError), parser via BeautifulSoup/lxml
    #   pour extraire TRACKED_FIELDS. Toujours via un fetch sûr (timeout).
    raise NotImplementedError(
        f"drift_check: extraction non branchée pour {page} (cf. TODO). "
        "Refus de comparer sans données réelles."
    )


def _diff_fields(baseline: dict[str, str], current: dict[str, str]) -> list[str]:
    """Retourne la liste des écarts (champ: ancien -> nouveau)."""
    diffs: list[str] = []
    for field in TRACKED_FIELDS:
        old = baseline.get(field)
        new = current.get(field)
        if old != new:
            diffs.append(f"- **{field}** : `{old}` -> `{new}`")
    return diffs


def _write_report(sections: list[str]) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    path = _REPORTS_DIR / f"drift_{today}.md"
    body = [f"# Drift on-page — {today}", ""] + sections
    path.write_text("\n".join(body) + "\n", encoding="utf-8")
    return path


def run() -> Path:
    """Compare chaque page à sa baseline et écrit le rapport. Lève si indispo."""
    _BASELINES_DIR.mkdir(parents=True, exist_ok=True)
    sections: list[str] = []

    for page in PAGES:
        current = _extract_seo_fields(page)  # lève tant que non branché
        bpath = _baseline_path(page)
        if not bpath.exists():
            bpath.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
            sections.append(f"## {page}\nBaseline créée (aucune comparaison ce run).\n")
            continue
        baseline = json.loads(bpath.read_text(encoding="utf-8"))
        diffs = _diff_fields(baseline, current)
        if diffs:
            sections.append(f"## {page} — RÉGRESSIONS DÉTECTÉES\n" + "\n".join(diffs) + "\n")
        else:
            sections.append(f"## {page}\nAucun changement.\n")

    return _write_report(sections)


def main() -> None:
    """Entrée CLI : run quotidien du drift check."""
    try:
        report = run()
    except (PageFetchError, RuntimeError, NotImplementedError) as exc:
        raise SystemExit(f"[drift_check] ÉCHEC: {exc}")
    print(f"[drift_check] Rapport écrit: {report}")


if __name__ == "__main__":
    main()
