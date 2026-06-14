#!/usr/bin/env python3
"""competitor_diff.py — Diff hebdomadaire des pages concurrentes (seo-engine).

Rôle
----
Comparer les pages clés des concurrents InstaDeco entre la semaine N et la
semaine N-1 (changements de titres, meta, contenu structurant) et produire un
rapport markdown dans `reports/`. Sert à repérer ce que bougent les concurrents.

Concurrents suivis
------------------
reimaginehome.ai, interiorai.com, spacely.ai, collov.ai, decormatters.com

Règles
------
- Rate-limit : au moins 1 requête / 5 secondes (constante MIN_INTERVAL_S).
- Si une page est indisponible (HTTP != 200, réseau down) -> erreur explicite,
  sortie non-zéro. Aucun diff inventé, aucune page simulée.
- Le snapshot de la semaine précédente est lu dans data/competitors/.
  S'il manque (première exécution), on écrit le snapshot courant et on signale
  qu'aucun diff n'est possible (pas de comparaison fictive).

TODO (points d'intégration)
---------------------------
- Brancher le fetch réel (requests + safe-url) au point `# TODO: fetch réel`.
- Définir, par concurrent, la liste des URLs clés à surveiller.
- Implémenter l'extraction des champs comparés (title/meta/H1/sections).
"""

from __future__ import annotations

import datetime as _dt
import sys
import time
from pathlib import Path

MIN_INTERVAL_S: float = 5.0

# Racine du moteur (ce fichier est dans scrapers/).
_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPORTS_DIR = _ENGINE_ROOT / "reports"
_SNAPSHOTS_DIR = _ENGINE_ROOT / "data" / "competitors"

COMPETITORS: tuple[str, ...] = (
    "reimaginehome.ai",
    "interiorai.com",
    "spacely.ai",
    "collov.ai",
    "decormatters.com",
)


class CompetitorFetchError(RuntimeError):
    """Levée quand une page concurrente est indisponible. Pas de diff fictif."""


class _RateLimiter:
    def __init__(self, min_interval_s: float) -> None:
        self._min_interval_s = min_interval_s
        self._last_call: float | None = None

    def wait(self) -> None:
        if self._last_call is not None:
            remaining = self._min_interval_s - (time.monotonic() - self._last_call)
            if remaining > 0:
                time.sleep(remaining)
        self._last_call = time.monotonic()


_rate_limiter = _RateLimiter(MIN_INTERVAL_S)


def _fetch_competitor_snapshot(domain: str) -> dict[str, str]:
    """Récupère un snapshot des champs surveillés pour un concurrent.

    Lève CompetitorFetchError si la page est indisponible. Jamais de fake.
    """
    _rate_limiter.wait()
    # TODO: fetch réel — récupérer les URLs clés du concurrent et extraire
    #   title / meta description / H1 / sections via BeautifulSoup+lxml.
    #   Toujours passer par un fetch sûr (timeout, status check) :
    #   if resp.status_code != 200:
    #       raise CompetitorFetchError(f"{domain}: HTTP {resp.status_code}")
    raise NotImplementedError(
        f"competitor_diff: fetch non branché pour {domain} (cf. TODO). "
        "Refus de produire un diff sans données réelles."
    )


def _write_report(lines: list[str]) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    path = _REPORTS_DIR / f"competitor_diff_{today}.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def run_diff() -> Path:
    """Exécute le diff N vs N-1 et écrit le rapport. Lève en cas d'indispo."""
    _SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    lines = [f"# Diff concurrents — {today}", ""]

    for domain in COMPETITORS:
        # TODO: charger le snapshot N-1 depuis data/competitors/<domain>.json,
        #   récupérer le snapshot courant via _fetch_competitor_snapshot(),
        #   comparer champ par champ, écrire les deltas. Si pas de snapshot
        #   précédent : écrire le snapshot courant + noter "baseline créée".
        _fetch_competitor_snapshot(domain)  # lève tant que non branché

    return _write_report(lines)


def main() -> None:
    """Entrée CLI : lance le diff hebdomadaire."""
    try:
        report = run_diff()
    except (CompetitorFetchError, RuntimeError, NotImplementedError) as exc:
        raise SystemExit(f"[competitor_diff] ÉCHEC: {exc}")
    print(f"[competitor_diff] Rapport écrit: {report}")


if __name__ == "__main__":
    main()
