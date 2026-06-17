#!/usr/bin/env python3
"""rank_tracker.py — Suivi hebdomadaire des positions (seo-engine).

Rôle
----
Suivre l'évolution des positions des requêtes pour lesquelles InstaDeco
apparaît, à partir des snapshots **GSC** produits par `gsc_daily.py`
(`data/gsc_*.json`). Pas de scraping Google : la position moyenne vient
directement de Search Console, gratuitement et fiablement.

Écrit `reports/rank_YYYY-MM-DD.md` (positions + évolution depuis le dernier
suivi) et un snapshot `data/ranks/rank_YYYY-MM-DD.json`.

Règles
------
- Aucune position inventée : tout vient des snapshots GSC réels.
- Si aucun snapshot GSC n'existe -> erreur explicite (lancer gsc_daily d'abord).
"""

from __future__ import annotations

import datetime as _dt
import json
from pathlib import Path

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPORTS_DIR = _ENGINE_ROOT / "reports"
_DATA_DIR = _ENGINE_ROOT / "data"
_RANKS_DIR = _DATA_DIR / "ranks"

# Seuil d'évolution notable (en positions) pour le résumé des mouvements.
_MOVE_THRESHOLD = 3.0


def _latest_gsc_snapshot() -> dict:
    """Charge le snapshot GSC le plus récent. Lève si aucun."""
    snaps = sorted(_DATA_DIR.glob("gsc_*.json"))
    if not snaps:
        raise SystemExit(
            "[rank_tracker] Aucun snapshot GSC (data/gsc_*.json). "
            "Lancer gsc_daily d'abord."
        )
    return json.loads(snaps[-1].read_text(encoding="utf-8"))


def _positions_from_snapshot(snap: dict) -> dict[str, dict]:
    """{requête: {position, clicks, impressions}} depuis un snapshot GSC."""
    out: dict[str, dict] = {}
    for row in snap.get("top_queries", []):
        key = (row.get("keys") or [None])[0]
        if not key:
            continue
        out[key] = {
            "position": round(row.get("position", 0.0), 1),
            "clicks": int(row.get("clicks", 0)),
            "impressions": int(row.get("impressions", 0)),
        }
    return out


def _previous_ranks(today: str) -> dict[str, dict] | None:
    """Charge le dernier snapshot de ranks antérieur à aujourd'hui (pour deltas)."""
    prev = [p for p in sorted(_RANKS_DIR.glob("rank_*.json")) if today not in p.name]
    if not prev:
        return None
    return json.loads(prev[-1].read_text(encoding="utf-8")).get("positions", {})


def _write_report(current: dict[str, dict], previous: dict[str, dict] | None) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    _RANKS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()

    # Snapshot machine.
    (_RANKS_DIR / f"rank_{today}.json").write_text(
        json.dumps({"date": today, "positions": current}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    # Tri par impressions décroissantes (les requêtes qui comptent en premier).
    ordered = sorted(current.items(), key=lambda kv: -kv[1]["impressions"])

    movers: list[str] = []
    rows: list[str] = ["| requête | position | évolution | clics | impressions |", "|---|---:|:--:|---:|---:|"]
    for kw, cur in ordered:
        delta_txt = "nouveau"
        if previous and kw in previous:
            delta = previous[kw]["position"] - cur["position"]  # + = monte
            if abs(delta) < 0.1:
                delta_txt = "="
            else:
                arrow = "▲" if delta > 0 else "▼"
                delta_txt = f"{arrow} {abs(delta):.1f}"
                if abs(delta) >= _MOVE_THRESHOLD:
                    sens = "gagne" if delta > 0 else "perd"
                    movers.append(f"- `{kw}` {sens} {abs(delta):.1f} (pos {cur['position']})")
        rows.append(
            f"| {kw} | {cur['position']} | {delta_txt} | {cur['clicks']} | {cur['impressions']} |"
        )

    lines = [f"# Positions (via GSC), {today}", ""]
    if previous:
        lines.append("## Mouvements notables (≥ 3 positions)")
        lines += movers if movers else ["_Aucun mouvement notable depuis le dernier suivi._"]
        lines.append("")
    else:
        lines += ["_Premier suivi : pas encore d'historique pour comparer._", ""]
    lines.append("## Toutes les requêtes suivies")
    lines += rows
    path = _REPORTS_DIR / f"rank_{today}.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> None:
    """Entrée CLI : suivi hebdomadaire des positions depuis GSC."""
    snap = _latest_gsc_snapshot()
    current = _positions_from_snapshot(snap)
    if not current:
        raise SystemExit("[rank_tracker] Snapshot GSC sans requêtes exploitables.")
    today = _dt.date.today().isoformat()
    report = _write_report(current, _previous_ranks(today))
    print(f"[rank_tracker] OK. {len(current)} requêtes suivies. Rapport: {report}")


if __name__ == "__main__":
    main()
