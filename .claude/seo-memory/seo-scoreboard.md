# SEO Scoreboard — InstaDeco

> Tableau de bord central. Écrit par `seo-chief` après chaque audit. Source de vérité partagée.
> Statut système : **ACTIF (Google-safe, croissance progressive)** — installé le 2026-06-14.
> Dernier audit : **2026-07-02** (audit COMPLET, 11 escouades Diagnostic + Sémantique en parallèle, GSC live via ADC + URL Inspection API).

## Audit 2026-07-02 (complet, GSC live + URL Inspection)

### KPIs mesurés (GSC réel, 28 j glissants, période 2026-06-04 → 2026-07-01)
| métrique | valeur | période préc. (07/05→03/06) | baseline 19/06 | source |
|---|---|---|---|---|
| Clics organiques | **10** | 8 | 7 | GSC searchanalytics |
| Impressions | **416** | 245 | 305 | GSC searchanalytics |
| CTR moyen | **2.4%** | 3.27% | 2.3% | GSC |
| Position moyenne | **9.73** | 24.46 | 18.5 | GSC |

Lecture : croissance saine et Google-safe (impressions +70%, position moyenne 24,5→9,7). Tirée par la marque (« instadeco » pos 6, « insta deco » pos 2.1) et le contenu déco générique, **PAS** par le cluster Pro. Le CTR baisse mécaniquement (plus d'impressions longue-traîne). Aucune retouche de titre avant la re-mesure J+30 (~19/07) : le gel est justifié, la tendance est positive.

### Indexation money pages (URL Inspection API, autoritaire)
| page | statut | note |
|---|---|---|
| `/fr/pro` | **NON indexée** — « Duplicate, Google chose different canonical » vers `/pro` (sans /fr) | crawl 23/06, avant pleine propagation du fix fr-only. **Cause racine identifiée cet audit : `/pro` fait un 307 temporaire, pas un 301 permanent.** |
| `/solution/home-staging-virtuel-agents-immobiliers` | **indexée (PASS)** | hub du cluster, seule page Pro indexée |
| `/solution/home-staging-virtuel-prix` | URL unknown to Google | publiée 28/06, jamais crawlée (site jeune, crawl 2-4 sem) |
| `/solution/home-staging-virtuel-belgique` | URL unknown | idem |
| `/solution/home-staging-virtuel-suisse-romande` | URL unknown | idem |
| `/solution/home-staging-virtuel-legal` | URL unknown | idem |
| `/blog/meilleur-logiciel-home-staging-virtuel-2026` | crawlée, 8 impr dès le 01/07 | fraîcheur OK |

Money pages GSC : **0 impression, 0 clic** sur toutes (/fr/pro, 4×/solution/home-staging-virtuel-*, /essai). Seule requête thématique active : « logiciel home staging à partir d'une photo » pos 11.2 sur `/solution/logiciel-home-staging` (0 clic).

### Diagnostic synthétique par axe

**Technique** — Socle sain (robots, sitemap, headers sécurité, 301 clusters déjà posés, hreflang réciproques HTML corrects). Trou majeur : `/pro` sans 301 permanent (oublié du fix du 23/06 qui a couvert /solution, /architecte-interieur, etc.). Header HTTP `Link` hreflang (généré par next-intl) contredit la stratégie fr-only de /pro (annonce en/de + x-default vers /pro bare) alors que le `<head>` HTML est correct : signal contradictoire, risque modéré (pages en/de/pro portent noindex).

**Contenu / E-E-A-T** — Bon socle (auteur Gabriel Moustadrif en Person, disclaimer de conflit d'intérêt dans le comparatif = signal de confiance rare à préserver). Trous : (1) `/pro` affiche les prix en EUR seulement alors que le marché CH est ciblé (page suisse-romande cite des CHF) → friction ; (2) zéro preuve sociale sur /pro (`generation_ratings` = 0 ligne, confirmé DB, donc AUCUN AggregateRating autorisé) ; (3) plusieurs réponses FAQ < 40 mots, sous-optimales pour la citation LLM autonome.

**Maillage / autorité** — Le VRAI frein reste l'autorité off-site (0 backlink méritant, 0 profil tiers). En interne : 5 `relatedArticles` du hub agents-immobiliers pointent vers des slugs blog dont 4 ne sont PAS encore écrits (liens morts en attente de contenu, cf. P0 contenu). Risque de cannibalisation entre `/solution/home-staging-virtuel` (générique, intention B2C, CTA /generate) et `home-staging-virtuel-agents-immobiliers` (pro, CTA /pro) sur le mot-clé pivot exact.

**GEO / AEO / citations LLM** — llms.txt orienté agents immo OK, FAQPage sur /pro et articles blog OK. Gaps citabilité : passages Q→R 40-60 mots autonomes manquants sur (a) le prix, (b) la légalité par pays (BE et CH restent génériques, non différenciés), (c) le comparatif « meilleur logiciel pour agent immo ». Les 8 pages /solution sont 100% texte : rien à indexer sur Google Images / AI Overviews visuels. Citation réelle jamais mesurée (relève de seo-geo-citation, dormant, cap 1.50 CHF).

**Local / geo FR-BE-CH** — Pages Belgique/Suisse romande créées mais ancrage local générique (pas de spécificité vérifiable par marché). Prix /pro non converti en CHF. Pas de Google Business Profile.

**Entité / marque** — sameAs = 3 profils réels (Instagram, Facebook, Pinterest) sur 10 visés, aucun profil B2B (LinkedIn, Product Hunt, Crunchbase). `founder = ['InstaDeco Team']` (string générique) incohérent avec la byline Gabriel Moustadrif ET avec le copy /a-propos qui évoque un couple fondateur (à trancher). `areaServed` absent du schema Organization. `twitterHandle` configuré mais absent de sameAs (compte à vérifier). Wikidata : notabilité insuffisante aujourd'hui, à revisiter dans 2-3 mois.

**Images** — Socle solide (AVIF/WebP, sitemap-images propre, unoptimized bien confiné aux previews). Gaps GEO : avant/après de /pro sans ImageObject, 8 pages /solution sans aucune image, alt des rendus peu descriptifs pour « home staging virtuel », galerie sans `priority` sur le LCP.

**Concurrence** — HOQI (hoqi.app) : 19,99€/mois (moins cher que notre Pro 49€), multilingue natif, feature image→vidéo absente chez nous, preuve sociale nommée (logos Century21/Efficity/Noovimo). Styldod/Virtual Staging AI couvrent la disclosure légale IA et le ROI chiffré.

**Drift** — Aucune régression on-page. Deux points de veille : « June 2026 spam update » (24/06) chevauche la fenêtre des commits cluster (corréler à la re-mesure du 19/07) ; hreflang absent sur les nouveaux articles blog fr-only (confirmer que c'est voulu).

## Issues priorisées — 2026-07-02

### P0 — impact money direct, exécutable maintenant (code/DB), Google-safe
| # | issue | owner | fix | google_risk | ETA |
|---|---|---|---|---|---|
| A1 | `/pro` (bare) = 307 temporaire, pas 301 permanent → Google canonicalise vers `/pro` et laisse `/fr/pro` NON indexée. Cause racine du non-index de la money page n°1. | seo-technical (next.config.js) | ajouter `{source:'/pro',destination:'/fr/pro',permanent:true}` dans le bloc redirects existant | low | 15 min |
| A2 | 4 `relatedArticles` du hub pointent vers slugs blog non écrits (liens morts) : home-staging-virtuel-ou-physique-comparatif, home-staging-vend-il-plus-vite, photos-annonce-immobiliere-qui-font-visiter, vendre-bien-vide-ou-meuble-virtuellement | seo-content + humain (relecture) | écrire les articles (1-2/sem max, gate anti-IA, angle unique, pas de stat inventée) OU retirer temporairement les liens non résolus | med (scaled content si dump) | échelonné |
| A3 | Passages Q→R 40-60 mots autonomes manquants : prix, légalité BE, légalité CH, « meilleur logiciel pour agent immo ». Gain citation LLM direct. | seo-content (intent-pages-data.ts corps FAQ, PAS les titles) | ajouter 1 passage citable par gap, entité complète dans la réponse | low | 1-2 h |

### P1 — schema / entité / images, exécutable maintenant
| # | issue | owner | fix | google_risk |
|---|---|---|---|---|
| B1 | `founder = ['InstaDeco Team']` incohérent (Person Gabriel Moustadrif ailleurs) + copy /a-propos évoque un couple | seo-schema + humain | trancher 1 ou 2 fondateurs réels, émettre `founder` Person(s) | low |
| B2 | `areaServed` absent du schema Organization | seo-schema | ajouter Country FR/CH/BE (DE seulement si marché actif confirmé) | low |
| B3 | /pro sans BreadcrumbList ; /essai sans aucun JSON-LD | seo-schema | ajouter BreadcrumbList /pro + BreadcrumbList/WebPage /essai | low |
| B4 | avant/après de /pro sans ImageObject (modèle réutilisable existe sur /g/[id]) | seo-images | ajouter ImageObject par rendu de REAL_RENDERS | none |
| B5 | galerie sans `priority` sur les 2-4 premières cartes (LCP) ; alt peu descriptifs pour « home staging virtuel » | seo-images | priority index<4 + alt fidèle enrichi | none |
| B6 | HowTo sur 3/9 pages solution seulement | seo-schema | flip `howTo:true` au cas par cas si le flux est réellement décrit (pas en masse) | low |

### P1 — off-site (LE vrai levier d'autorité, actions humaines)
| # | action | angle | rythme |
|---|---|---|---|
| C1 | Créer profils B2B réels : LinkedIn company, Product Hunt, Crunchbase (P0 entité) | présence entité + sameAs | 1/semaine |
| C2 | Se faire lister dans les listicles « meilleur logiciel home staging virtuel » (cf. plan off-site) | outil FR/BE/CH pour agents immo | 1 pitch utile/site/mois |
| C3 | Google Business Profile si adresse pro dispo | local FR/CH | 1× |
| C4 | Trustpilot/Capterra/G2 : SÉQUENCER après avoir de vrais clients Pro (profil vide = signal négatif) | preuve sociale | P2 |

### P2 — à planifier APRÈS la re-mesure du 19/07 (gel des titres)
| # | item |
|---|---|
| D1 | Réévaluer CTA + hiérarchie hub/spoke de `/solution/home-staging-virtuel` (cannibalisation avec agents-immobiliers) une fois l'intention SERP dominante confirmée |
| D2 | Ajouter affichage CHF sur /pro pour le marché suisse (friction conversion, pas SEO) |
| D3 | Preuve sociale sur /pro dès qu'il y a de vrais avis (`generation_ratings`) |
| D4 | Nouveaux spokes : workflow agence multi-mandats, comparatif nommé vs HOQI (revérifier prix à la rédaction), location, extérieur (valider capacité produit avant) |
| D5 | Enrichir sitemap-images (visuels /solution + /g/[id]) ; noms de fichiers parlants pour NOUVELLES images marketing |
| D6 | Header HTTP hreflang contradictoire sur /pro (investiguer next-intl) |

### Infra
| # | item |
|---|---|
| E1 | **Pipeline GSC (gsc_daily) n'a rien écrit depuis le 18/06 (17 j de trou)** : cron VPS possiblement cassé (CRON_SECRET désynchro ou erreur silencieuse). À réparer sinon la détection de drift/decay reste aveugle. Accès local via ADC gcloud OK (mécanisme validé). |

## Dépenses (CHF/mois) — total ≤ 2 CHF
| poste | coût | budget | statut |
|---|---|---|---|
| Agents (Claude Code) | 0 | — | inclus abo |
| APIs Google (GSC/Inspection via ADC) | 0 | 0 | gratuit |
| Cron VPS Hetzner | 0 | 0 | déjà payé |
| Monitoring citations LLM | 0 | 1.50 | dormant, pas lancé cet audit |
| **TOTAL** | **0** | **2.00** | sous budget |

## Prompts LLM proposés pour le futur batch seo-geo-citation (20, fr, marché immo)
Voir serp-targets.md (mis à jour par seo-geo-serp). Prioritaires : meilleur logiciel home staging virtuel agent immo 2026 ; légal FR/BE/CH ; combien coûte ; virtuel ou physique ; moins cher pour agence ; InstaDeco fiable pro.

## Historique des audits
| date | agents lancés | findings | patchs appliqués |
|---|---|---|---|
| 2026-06-14 | technical, content, schema, cluster, link-graph | 18 issues | P0 #1,2,4,5 + P1 #6,7,8 (code). |
| 2026-06-18 | seo-chief + 2 explorations, GSC réel | 8 fermées, focus pSEO+GEO | aucun (lecture seule). |
| 2026-06-22 | audit cadre v2, GSC live | CTR titles, /pro fr-only, pivot intention, E-E-A-T blog | 8 commits (344616d→30082da). |
| 2026-06-23 | suite, GSC live | PR6 maillage, 30s, enrichissement, fix duplicate canonical, money page au Footer | 5 commits (89cd549→8912e1d). |
| 2026-07-02 | **audit COMPLET : technical, google, drift, sxo-decay, competitor, content, cluster, schema, geo-serp, entity-graph, images (11 escouades parallèles)** | GSC +70% impr / pos 9,7 (sain, tiré par la marque). /pro toujours non indexée (307 au lieu de 301 = cause racine). Cluster Pro quasi non crawlé (jeune). Gaps : liens blog morts, passages Q→R BE/CH/prix, founder incohérent, sameAs 3/10, /pro sans preuve sociale ni CHF, images absentes des /solution. Pipeline GSC muet depuis le 18/06. | aucun (audit lecture seule, patchs proposés au human ci-dessous). |
