# Flotte SEO/GEO — InstaDeco

Vue d'ensemble des agents SEO/GEO du projet. Tous sont orchestrés par
**`seo-chief`** : c'est le **seul point d'entrée**. On ne lance jamais un
sous-agent en direct — on demande à `seo-chief`.

> Les agents **lisent** les rapports produits par le moteur
> `.claude/seo-engine/` (vraies données) et écrivent la mémoire partagée
> `.claude/seo-memory/*.md`. Ils ne fabriquent jamais de chiffre.

---

## Comment utiliser le système

Exemples de demandes adressées à `seo-chief` :

- « **seo-chief**, fais-moi un **audit complet** » → il parallélise le
  diagnostic (lecture seule), séquence l'exécution (écriture), puis synthétise
  le scoreboard et propose les patchs à valider.
- « **seo-chief**, audit technique uniquement » → route vers l'escouade Diagnostic.
- « **seo-chief**, où en sont mes citations LLM ce mois-ci ? » → `seo-geo-citation`.

`seo-chief` route vers **4 escouades** : Diagnostic, Sémantique, Médias,
Exécution / Présence.

---

## Les 18 agents (seo-chief + escouades)

**Orchestrateur (1)**
1. `seo-chief` — orchestrateur, seul point d'entrée (model: opus).

**Escouade Diagnostic — lecture seule (6)**
2. `seo-technical` — audit SEO technique.
3. `seo-google` — KPIs Google réels via APIs (GSC, PSI, CrUX, Indexing, GA4).
4. `seo-competitor` — veille concurrentielle (5 concurrents, diff hebdo, gap topical).
5. `seo-drift` — détection de régressions (baselines + diff + algo updates).
6. `seo-sxo-decay` — mismatch d'intent SERP + pages en chute → plan de refresh.

**Escouade Sémantique — lecture seule (sauf seo-memory) (6)**
7. `seo-cluster` — clusters thématiques & maillage (overlap SERP).
8. `seo-content` — qualité de contenu, E-E-A-T, citabilité LLM.
9. `seo-geo-serp` — GEO & SERP reverse, alimente serp-targets.md.
10. `seo-schema` — JSON-LD & données structurées.
11. `seo-entity-graph` — graphe d'entité & présence de marque (Wikidata, sameAs).

**Escouade Médias (2)**
12. `seo-images` — alt text, WebP/AVIF, ImageObject, anti-CLS (cœur produit).
13. `seo-geo-citation` — monitoring mensuel des citations LLM. **SEUL poste
    payant**, cap STRICT ≤ 1.50 CHF (hard stop).

**Escouade Exécution / Présence (4)**
14. `seo-money-page-auditor` — audit/correction des money pages (/pricing, /essai).
15. `seo-i18n` — hreflang/x-default, sitemaps par locale (fr/en/de).
16. `seo-link-graph` — maillage interne (PageRank interne, ancres, orphelines).
17. `seo-brand-outreach` — SERP de marque & digital PR (HARO, broken-link, mentions).
18. `seo-community` — veille communautés & contributions utiles (max 1/site/mois).

> Total = **18 agents** présents dans ce dossier.

---

## Les 3 agents DÉSACTIVÉS pour InstaDeco

Ces agents font partie du modèle générique de flotte SEO mais sont **non
pertinents** pour InstaDeco, donc **non générés** (absents de ce dossier) :

| Agent | Pourquoi désactivé pour InstaDeco |
|---|---|
| `seo-aso` | **Pas d'app mobile** (App Store / Play Store). InstaDeco est un SaaS web. |
| `seo-video` | **Pas de vidéo** (YouTube SEO, video schema). Pas de contenu vidéo. |
| `seo-crawl-budget` | **Pas de logs nginx** : hébergé sur **Vercel**, pas d'accès aux logs serveur bruts nécessaires à l'analyse de crawl budget. |

### Comment les activer plus tard

1. Créer le fichier d'agent correspondant dans ce dossier
   (`seo-aso.md` / `seo-video.md` / `seo-crawl-budget.md`), au même format
   front-matter que les autres (`name`, `description`, `tools`, `model`).
2. Réunir le prérequis manquant :
   - `seo-aso` : publier une app mobile + accès aux stores ;
   - `seo-video` : produire du contenu vidéo (chaîne YouTube) ;
   - `seo-crawl-budget` : disposer de vrais logs serveur (migration Cloudflare
     Workers/Pages prévue au CLAUDE.md, ou export de logs).
3. Le déclarer dans le routage de `seo-chief` (escouade adéquate).

---

## Rappels (non négociables)

- **Budget ≤ 2 CHF/mois.** Le seul poste payant est `seo-geo-citation` /
  `monitors/citation_batch.py`, capé STRICT à **1.50 CHF/mois** (hard stop
  avant chaque appel). Tout le reste est gratuit.
- **Jamais de chiffre inventé.** Si une vraie donnée n'est pas disponible
  (API down, credentials absents), on lève une erreur — on n'estime pas.
- **Site live intouchable sans validation.** Les agents en mode écriture
  **proposent** des patchs ; aucune modification du site en production n'est
  appliquée sans validation humaine explicite. Les exceptions (corrections
  sûres et réversibles) sont déclarées dans le front-matter de l'agent concerné.
