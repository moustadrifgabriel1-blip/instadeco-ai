#!/usr/bin/env python3
"""serp_scraper.py — Brique de scraping SERP rate-limitée pour seo-engine.

Rôle
----
Récupérer les résultats organiques d'une page de moteur de recherche pour un
mot-clé donné, de façon **respectueuse** (rate-limit) et **honnête** : si la
SERP est bloquée (captcha, page de consentement, HTTP non-200), on **lève une
erreur**. JAMAIS de résultat inventé, jamais de fallback fictif.

Cette brique est utilisée par `monitors/rank_tracker.py`. Elle n'est pas
planifiée seule dans le workflow.

Règles
------
- Rate-limit : au moins 1 requête / 3 secondes (constante MIN_INTERVAL_S).
- Détection de blocage : captcha / consentement / status != 200 -> exception.
- Aucune donnée simulée : si on ne peut pas parser de vrais résultats, on lève.

TODO (points d'intégration)
---------------------------
- Brancher un vrai endpoint (API SERP payante OU HTML moteur) au point marqué
  `# TODO: requête réelle`. Privilégier une source gratuite/officielle.
- Adapter les sélecteurs CSS du parsing à la source choisie.
"""

from __future__ import annotations

import sys
import time
from dataclasses import dataclass

# Intervalle minimal entre deux requêtes SERP (anti-abus / politesse).
MIN_INTERVAL_S: float = 3.0

# Marqueurs de blocage à détecter dans la réponse HTML.
_BLOCK_MARKERS = (
    "captcha",
    "unusual traffic",
    "détecté un trafic inhabituel",
    "consent.google",
    "before you continue",
)


@dataclass(frozen=True)
class SerpResult:
    """Un résultat organique unique."""

    position: int
    url: str
    title: str


class SerpBlockedError(RuntimeError):
    """Levée quand la SERP est bloquée (captcha, consentement, status != 200).

    On NE renvoie PAS de résultat partiel ou inventé dans ce cas.
    """


class _RateLimiter:
    """Garantit un intervalle minimal entre deux requêtes successives."""

    def __init__(self, min_interval_s: float) -> None:
        self._min_interval_s = min_interval_s
        self._last_call: float | None = None

    def wait(self) -> None:
        if self._last_call is not None:
            elapsed = time.monotonic() - self._last_call
            remaining = self._min_interval_s - elapsed
            if remaining > 0:
                time.sleep(remaining)
        self._last_call = time.monotonic()


_rate_limiter = _RateLimiter(MIN_INTERVAL_S)


def _detect_block(html: str) -> bool:
    """Retourne True si la réponse ressemble à une page de blocage."""
    lowered = html.lower()
    return any(marker in lowered for marker in _BLOCK_MARKERS)


def fetch_serp(keyword: str, market: str = "fr", max_results: int = 20) -> list[SerpResult]:
    """Récupère les résultats organiques pour `keyword` sur `market`.

    Lève SerpBlockedError si la SERP est bloquée, ou RuntimeError si aucun
    résultat réel ne peut être parsé. Ne retourne JAMAIS de fausse donnée.
    """
    if not keyword or not keyword.strip():
        raise ValueError("keyword vide : impossible de scraper une SERP sans mot-clé.")

    _rate_limiter.wait()

    # TODO: requête réelle — brancher la source SERP ici.
    #   import requests
    #   resp = requests.get(<endpoint>, params={...}, headers={...}, timeout=20)
    #   if resp.status_code != 200:
    #       raise SerpBlockedError(f"HTTP {resp.status_code} pour '{keyword}'")
    #   html = resp.text
    #   if _detect_block(html):
    #       raise SerpBlockedError(f"SERP bloquée (captcha/consentement) pour '{keyword}'")
    #   results = _parse(html, max_results)   # via BeautifulSoup/lxml
    #   if not results:
    #       raise RuntimeError(f"Aucun résultat parsé pour '{keyword}' — refus d'inventer.")
    #   return results
    raise NotImplementedError(
        "serp_scraper.fetch_serp : source SERP non branchée. "
        "Brancher un endpoint réel avant utilisation (cf. TODO). "
        "Refus explicite de retourner des résultats fictifs."
    )


def main() -> None:
    """Entrée CLI de debug : scrape un mot-clé passé en argument."""
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: python serp_scraper.py \"<mot-clé>\" [marché]\n"
            "Exemple: python serp_scraper.py \"décoration intérieur IA\" fr"
        )
    keyword = sys.argv[1]
    market = sys.argv[2] if len(sys.argv) > 2 else "fr"
    try:
        results = fetch_serp(keyword, market)
    except (SerpBlockedError, RuntimeError, NotImplementedError) as exc:
        # Erreur explicite + sortie non-zéro. Pas de donnée inventée.
        raise SystemExit(f"[serp_scraper] ÉCHEC: {exc}")
    for r in results:
        print(f"{r.position:>2}. {r.url}  —  {r.title}")


if __name__ == "__main__":
    main()
