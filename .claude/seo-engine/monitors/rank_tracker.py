#!/usr/bin/env python3
"""rank_tracker.py — Suivi hebdomadaire des positions mots-clés (seo-engine).

Rôle
----
Suivre les positions des mots-clés cibles listés dans
`.claude/seo-memory/serp-targets.md`, en utilisant `scrapers/serp_scraper.py`.
Écrit un rapport `reports/rank_YYYY-MM-DD.md` et un snapshot dans
`data/ranks/`. Fréquence : hebdomadaire (lundi).

Règles
------
- Les mots-clés viennent du VRAI fichier serp-targets.md (pas de liste codée
  en dur ; si le fichier est absent ou ne contient aucun mot-clé -> erreur).
- Toute position provient de serp_scraper (vraie SERP). Si le scraper lève
  (blocage/captcha) -> erreur explicite, sortie non-zéro. Jamais de rang inventé.

TODO (points d'intégration)
---------------------------
- Affiner le parsing de serp-targets.md (table markdown) au point `# TODO: parse`.
- Brancher la résolution de position d'InstaDeco dans les résultats SERP.
"""

from __future__ import annotations

import datetime as _dt
from pathlib import Path

# Import de la brique SERP partagée (même paquet seo-engine).
import sys

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_ENGINE_ROOT))

from scrapers.serp_scraper import (  # noqa: E402
    SerpBlockedError,
    fetch_serp,
)

_REPORTS_DIR = _ENGINE_ROOT / "reports"
_RANKS_DIR = _ENGINE_ROOT / "data" / "ranks"
_SERP_TARGETS = _ENGINE_ROOT.parent / "seo-memory" / "serp-targets.md"

# Domaine dont on cherche la position dans la SERP.
_OWN_DOMAIN = "instadeco.app"


def _load_keywords() -> list[tuple[str, str]]:
    """Lit les (mot-clé, marché) depuis serp-targets.md. Lève si vide/absent."""
    if not _SERP_TARGETS.is_file():
        raise SystemExit(
            f"[rank_tracker] serp-targets.md introuvable: {_SERP_TARGETS}. "
            "Aucun mot-clé à suivre — refus de continuer."
        )
    text = _SERP_TARGETS.read_text(encoding="utf-8")
    keywords: list[tuple[str, str]] = []
    # TODO: parse — extraire les lignes du tableau "Mots-clés cibles" :
    #   | # | mot-clé | marché | intent | volume | position | priorité |
    #   Ignorer l'en-tête, le séparateur, et les lignes placeholder ("…").
    for line in text.splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3:
            continue
        kw, market = cells[1], cells[2]
        if not kw or kw in {"mot-clé", "…"} or set(kw) <= {"-"}:
            continue
        keywords.append((kw, market))

    if not keywords:
        raise SystemExit(
            "[rank_tracker] Aucun mot-clé valide trouvé dans serp-targets.md."
        )
    return keywords


def _find_position(keyword: str, market: str) -> int | None:
    """Retourne la position d'InstaDeco pour un mot-clé, ou None si absent.

    Propage SerpBlockedError/RuntimeError : on n'invente jamais de position.
    """
    results = fetch_serp(keyword, market)
    for r in results:
        if _OWN_DOMAIN in r.url:
            return r.position
    return None  # absent du top scrapé = vraie info (pas un fake)


def _write_report(rows: list[tuple[str, str, int | None]]) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    path = _REPORTS_DIR / f"rank_{today}.md"
    lines = [f"# Positions mots-clés — {today}", "", "| mot-clé | marché | position |", "|---|---|---|"]
    for kw, market, pos in rows:
        lines.append(f"| {kw} | {market} | {pos if pos is not None else 'hors top'} |")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def run() -> Path:
    """Suit toutes les positions et écrit le rapport. Lève si SERP indispo."""
    keywords = _load_keywords()
    rows: list[tuple[str, str, int | None]] = []
    for kw, market in keywords:
        pos = _find_position(kw, market)  # peut lever (blocage) -> on propage
        rows.append((kw, market, pos))
    return _write_report(rows)


def main() -> None:
    """Entrée CLI : run hebdomadaire du rank tracker."""
    try:
        report = run()
    except (SerpBlockedError, RuntimeError, NotImplementedError) as exc:
        raise SystemExit(f"[rank_tracker] ÉCHEC: {exc}")
    print(f"[rank_tracker] Rapport écrit: {report}")


if __name__ == "__main__":
    main()
