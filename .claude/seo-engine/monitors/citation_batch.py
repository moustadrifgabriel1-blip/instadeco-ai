#!/usr/bin/env python3
"""citation_batch.py — Monitoring mensuel des citations LLM (seo-engine).

Rôle
----
Interroger les LLMs (OpenAI, Perplexity, …) avec les prompts définis dans
`.claude/seo-memory/serp-targets.md` (section « Prompts LLM — citation_batch »)
et mesurer si InstaDeco est cité. Écrit un citation-log dans `reports/`.
Fréquence : mensuelle (le 1er).

⚠️ SEUL POSTE PAYANT DU MOTEUR — GARDE-FOU BUDGET STRICT
-------------------------------------------------------
- `CITATION_BUDGET_CHF` (défaut 1.50) = cap mensuel STRICT.
- AVANT chaque appel LLM : on estime le coût de l'appel, on le convertit
  USD -> CHF (`USD_CHF_RATE`), et si `cumulé + prochain > budget` -> **STOP**
  immédiat, sortie propre, rapport partiel écrit. JAMAIS de dépassement.
- Aucun coût/citation inventé : credentials absents ou taux absent -> erreur.

Configuration (env / secrets GitHub)
------------------------------------
- OPENAI_API_KEY, PERPLEXITY_API_KEY : clés LLM (payant).
- CITATION_BUDGET_CHF : cap mensuel (CHF). Défaut 1.50.
- USD_CHF_RATE : taux de conversion (obligatoire, pas de fallback inventé).

TODO (points d'intégration)
---------------------------
- Renseigner la grille de coût par modèle (USD / 1k tokens) : COST_USD_PER_CALL.
- Brancher les appels réels OpenAI/Perplexity au point `# TODO: appel LLM réel`.
- Implémenter la détection de citation (mention "instadeco" / lien) dans la
  réponse, au point `# TODO: détection citation`.
"""

from __future__ import annotations

import datetime as _dt
import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass

_ENGINE_ROOT = Path(__file__).resolve().parent.parent
_REPORTS_DIR = _ENGINE_ROOT / "reports"
_SERP_TARGETS = _ENGINE_ROOT.parent / "seo-memory" / "serp-targets.md"

_DEFAULT_BUDGET_CHF = 1.50

# Estimation du coût d'UN appel par fournisseur, en USD.
# TODO: renseigner avec les vrais tarifs (modèle + tokens estimés).
COST_USD_PER_CALL: dict[str, float] = {
    # "openai": 0.0X,
    # "perplexity": 0.0X,
}

# Fournisseurs interrogés et leur variable d'environnement de clé.
PROVIDERS: dict[str, str] = {
    "openai": "OPENAI_API_KEY",
    "perplexity": "PERPLEXITY_API_KEY",
}


class BudgetExceeded(RuntimeError):
    """Levée quand le prochain appel dépasserait le cap. Arrêt propre."""


def _require_config() -> tuple[float, float, dict[str, str]]:
    """Charge budget, taux USD->CHF et clés. Sort proprement si incomplet."""
    budget_chf = float(os.environ.get("CITATION_BUDGET_CHF", _DEFAULT_BUDGET_CHF))

    rate_raw = os.environ.get("USD_CHF_RATE", "").strip()
    if not rate_raw:
        raise SystemExit(
            "[citation_batch] USD_CHF_RATE absent. Impossible de convertir les "
            "coûts en CHF — refus d'estimer le budget avec un taux inventé."
        )
    try:
        usd_chf = float(rate_raw)
    except ValueError:
        raise SystemExit(f"[citation_batch] USD_CHF_RATE invalide: {rate_raw!r}")
    if usd_chf <= 0:
        raise SystemExit("[citation_batch] USD_CHF_RATE doit être > 0.")

    keys: dict[str, str] = {}
    for provider, env_name in PROVIDERS.items():
        val = os.environ.get(env_name, "").strip()
        if val:
            keys[provider] = val
    if not keys:
        raise SystemExit(
            "[citation_batch] Aucune clé LLM configurée "
            f"({', '.join(PROVIDERS.values())}). Refus d'inventer des citations."
        )
    return budget_chf, usd_chf, keys


def _load_prompts() -> list[str]:
    """Extrait les prompts LLM depuis serp-targets.md. Lève si vide/absent."""
    if not _SERP_TARGETS.is_file():
        raise SystemExit(f"[citation_batch] serp-targets.md introuvable: {_SERP_TARGETS}")
    text = _SERP_TARGETS.read_text(encoding="utf-8")
    prompts: list[str] = []
    in_section = False
    for line in text.splitlines():
        if line.strip().startswith("## Prompts LLM"):
            in_section = True
            continue
        if in_section and line.strip().startswith("## "):
            break
        if in_section:
            stripped = line.strip()
            # Lignes numérotées "1. « ... »" ; on ignore les placeholders "(à enrichir)".
            if stripped and stripped[0].isdigit() and "." in stripped:
                content = stripped.split(".", 1)[1].strip()
                if content and not content.startswith("_(") and "à enrichir" not in content:
                    prompts.append(content)
    if not prompts:
        raise SystemExit("[citation_batch] Aucun prompt LLM valide dans serp-targets.md.")
    return prompts


def _estimate_cost_usd(provider: str) -> float:
    """Coût estimé d'un appel. Lève si non renseigné (pas de coût inventé)."""
    if provider not in COST_USD_PER_CALL:
        raise SystemExit(
            f"[citation_batch] Coût non renseigné pour '{provider}' "
            "(COST_USD_PER_CALL). Refus d'appeler sans connaître le coût."
        )
    return COST_USD_PER_CALL[provider]


def _query_llm(provider: str, api_key: str, prompt: str) -> str:
    """Interroge un LLM. Lève en cas d'erreur. Jamais de réponse simulée."""
    # TODO: appel LLM réel (openai / perplexity). Retourner le texte brut.
    raise NotImplementedError(
        f"citation_batch: appel {provider} non branché (cf. TODO)."
    )


def _is_cited(response_text: str) -> bool:
    """Détecte si InstaDeco est cité dans la réponse."""
    # TODO: détection citation — affiner (mention "instadeco", lien instadeco.app).
    return "instadeco" in response_text.lower()


def _write_log(lines: list[str]) -> Path:
    _REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    today = _dt.date.today().isoformat()
    path = _REPORTS_DIR / f"citation_log_{today}.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def run() -> Path:
    """Boucle prompts × fournisseurs avec garde-fou budget strict avant CHAQUE appel."""
    budget_chf, usd_chf, keys = _require_config()
    prompts = _load_prompts()

    today = _dt.date.today().isoformat()
    log = [
        f"# Citation log LLM — {today}",
        f"> Budget mensuel: {budget_chf:.2f} CHF · taux USD->CHF: {usd_chf}",
        "",
    ]
    spent_chf = 0.0
    stopped = False

    for prompt in prompts:
        if stopped:
            break
        for provider, api_key in keys.items():
            next_cost_chf = _estimate_cost_usd(provider) * usd_chf
            # Garde-fou STRICT : on vérifie AVANT d'appeler.
            if spent_chf + next_cost_chf > budget_chf:
                log.append(
                    f"\n**STOP budget** : prochain appel ({provider}, "
                    f"+{next_cost_chf:.4f} CHF) dépasserait le cap "
                    f"({spent_chf:.4f}/{budget_chf:.2f} CHF). Arrêt propre."
                )
                stopped = True
                break

            response = _query_llm(provider, api_key, prompt)  # peut lever -> propagé
            spent_chf += next_cost_chf
            cited = "OUI" if _is_cited(response) else "non"
            log.append(f"- [{provider}] cité={cited} · cumul={spent_chf:.4f} CHF · « {prompt} »")

    log.append(f"\n**Total dépensé** : {spent_chf:.4f} / {budget_chf:.2f} CHF.")
    return _write_log(log)


def main() -> None:
    """Entrée CLI : run mensuel du monitoring citations (capé)."""
    try:
        report = run()
    except (BudgetExceeded, RuntimeError, NotImplementedError) as exc:
        raise SystemExit(f"[citation_batch] ÉCHEC: {exc}")
    print(f"[citation_batch] Log écrit: {report}")


if __name__ == "__main__":
    main()
