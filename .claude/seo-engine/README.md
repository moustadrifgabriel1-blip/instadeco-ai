# seo-engine — Moteur SEO autonome InstaDeco

> Moteur de collecte de données SEO/GEO **gratuit** (ou quasi), piloté par
> **GitHub Actions** (pas de VPS). Alimente la mémoire partagée
> `.claude/seo-memory/*.md` et écrit ses sorties dans
> `.claude/seo-engine/reports/` (markdown) et `data/` (snapshots).

---

## Rôle du moteur

Le moteur regroupe les scripts qui collectent les **vraies** données SEO
nécessaires aux agents (`.claude/agents/`) :

- **monitors/** — surveillance récurrente (GSC, positions, drift on-page, citations LLM).
- **scrapers/** — collecte SERP & diff concurrents.
- **data/** — snapshots bruts + baselines de comparaison (`data/baselines/`).
- **reports/** — rapports markdown horodatés, consommés par `seo-chief` & co.

Les agents **ne collectent pas** la donnée eux-mêmes : ils lisent les rapports
produits ici. Ce moteur est la seule source de chiffres réels.

---

## Pourquoi GitHub Actions (et pas un VPS)

**Budget : ≤ 2 CHF/mois.** Un VPS, même le moins cher (~5 CHF/mois), casse à lui
seul le budget. GitHub Actions offre :

- des runners `ubuntu-latest` **gratuits** (2 000 min/mois sur repo privé,
  illimité sur repo public) — largement suffisant pour quelques crons légers ;
- des **secrets chiffrés** (repo settings → Secrets and variables → Actions) ;
- un planificateur cron intégré, **zéro infra à maintenir**.

Le **seul poste payant** du moteur = le monitoring des citations LLM
(`monitors/citation_batch.py`, appels OpenAI/Perplexity payants). Il est
**strictement plafonné à 1.50 CHF/mois** (voir plus bas). Tout le reste
(APIs Google GSC/GA4/PageSpeed, scraping SERP, GitHub Actions) est **gratuit**.

---

## Mode dormant → actif

Le moteur est livré **dormant** :

1. Le workflow `.github/workflows/seo-engine.yml` n'a que le déclencheur
   **manuel** (`workflow_dispatch`) actif. Le bloc `schedule:` (crons) est
   **présent mais commenté**.
2. Tant que les **secrets GitHub ne sont pas configurés**, les scripts
   **échouent proprement** (code non-zéro + message clair). C'est **voulu** :
   on ne veut aucune exécution silencieuse sans vraies credentials.

**Pour activer :**

1. Configurer les secrets GitHub (ci-dessous).
2. Décommenter le bloc `schedule:` dans `.github/workflows/seo-engine.yml`.
3. (Optionnel) lancer un run manuel via l'onglet *Actions* pour valider.

---

## Secrets à configurer (GitHub repo secrets)

`Settings → Secrets and variables → Actions → New repository secret` :

| Secret | Usage | Gratuit ? |
|---|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Contenu JSON du compte de service Google (GSC, GA4). Le workflow l'écrit dans un fichier temporaire. | ✅ |
| `GSC_SITE_URL` | `https://instadeco.app` (ou variable repo). | ✅ |
| `GA4_PROPERTY_ID` | ID de la propriété GA4. | ✅ |
| `PAGESPEED_API_KEY` | Clé API PageSpeed Insights. | ✅ |
| `OPENAI_API_KEY` | Citations LLM (poste payant, capé). | ⚠️ payant |
| `PERPLEXITY_API_KEY` | Citations LLM (poste payant, capé). | ⚠️ payant |
| `USD_CHF_RATE` | Taux USD→CHF pour le calcul du cap citations. | ✅ |

> Aucune valeur réelle n'est commitée. `.env.example` ne contient que des
> placeholders. En local, copier `.env.example` → `.env` (gitignoré).

---

## Règle d'or : JAMAIS de chiffre inventé

**Tout script qui ne peut pas obtenir une VRAIE donnée lève une erreur
explicite et sort en code non-zéro.**

- API down → erreur, pas de valeur de remplacement.
- Credentials absents → `SystemExit` avec message clair.
- SERP bloquée / captcha → erreur, pas de fake.

Aucun fallback fictif, aucune estimation « plausible ». Un rapport vide ou
absent vaut mieux qu'un rapport faux : les décisions SEO se prennent sur des
chiffres réels.

---

## Cap budget citations : ≤ 1.50 CHF/mois

`monitors/citation_batch.py` est le **seul** script à coût variable. Garde-fous :

- `CITATION_BUDGET_CHF=1.50` (cap mensuel strict).
- **Avant chaque appel LLM**, le script estime le coût et vérifie le cumul.
  Si le prochain appel risque de dépasser le cap → **STOP**, sortie propre,
  rapport partiel écrit.
- Coûts convertis **USD → CHF** via `USD_CHF_RATE`.
- Exécution **mensuelle uniquement** (le 1er du mois).

---

## Fréquences des scripts

| Script | Fréquence | Cron (commenté dans le workflow) |
|---|---|---|
| `monitors/gsc_daily.py` | Quotidien | `0 6 * * *` (06h UTC) |
| `monitors/drift_check.py` | Quotidien | `0 6 * * *` |
| `monitors/rank_tracker.py` | Hebdo (lundi) | `0 7 * * 1` |
| `scrapers/competitor_diff.py` | Hebdo (dimanche) | `0 7 * * 0` |
| `monitors/citation_batch.py` | Mensuel (1er) | `0 8 1 * *` |

`scrapers/serp_scraper.py` n'est pas planifié seul : c'est une brique utilisée
par `rank_tracker.py`.

---

## Exécution locale (dev / debug)

```bash
cd .claude/seo-engine
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # puis remplir les vraies valeurs (gitignoré)

python monitors/gsc_daily.py          # exige les credentials Google
python scrapers/competitor_diff.py    # exige un accès réseau
python monitors/citation_batch.py     # exige clés LLM + respecte le cap
```

Un script sans credentials sort en erreur : c'est le comportement attendu.
