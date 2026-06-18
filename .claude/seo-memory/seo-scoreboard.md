# SEO Scoreboard — InstaDeco

> Tableau de bord central. Écrit par `seo-chief` après chaque audit. Source de vérité partagée.
> Statut système : **ACTIF (Google-safe, croissance progressive)** — installé le 2026-06-14.
> Dernier audit : **2026-06-18** (sur données GSC réelles du VPS Hetzner).

## KPIs (28 jours glissants — GSC réel, période 2026-05-19 → 2026-06-15)
| métrique | valeur | cible | trend | source |
|---|---|---|---|---|
| Clics organiques (GSC) | **8** | ↗ | nouveau (1er relevé) | gsc_2026-06-18 |
| Impressions (GSC) | **299** | ↗ | nouveau | gsc_2026-06-18 |
| CTR moyen | **2.7%** | >3% | nouveau | gsc_2026-06-18 |
| Position moyenne | **19.6** | <15 | nouveau | gsc_2026-06-18 |
| Pages indexées | ~228 URLs au sitemap (dont 57 villes fr) | =sitemap | — | sitemap.xml live |
| Drift on-page (10 pages clés) | 0 anomalie | 0 | stable | drift_2026-06-18 |
| Citations LLM (mentions) | non mesuré | ↗ | — | seo-geo-citation (dormant) |
| Articles blog publiés (fr/en/de) | 38 / 0 / 0 | parité | — | code |

### Lecture des KPIs
- **Site jeune** : 8 clics réels. Les clics vont à `/fr` (5), `/quiz` (2), `/solution/avant-apres-decoration` (1). Aucune page ville ne convertit en clic.
- **Marque** : « instadeco » pos 7.5, « insta deco » pos 2.7 — la marque émerge.
- **Poche pSEO « architecte d'intérieur » identifiée** : 57 pages villes indexées, impressions réelles, **0 clic**. Deux régimes :
  - Bonnes positions sous-exploitées (CTR 0) : Amiens 4.2, Annecy 5.0, Uccle 6.7, Nice 7.7, Neuchâtel 9.5, Louvain-la-Neuve 9.9, Liège 10.3, Yverdon 10.5 → impressions mais 0 clic = **problème de title/CTR + intention**.
  - Poche profonde mal classée : tout le cluster « architecte d'intérieur Genève » est en **position 79–85** (14 impressions sur la requête principale) malgré une page dédiée → **mismatch d'intention + page trop faible pour une requête concurrentielle**.

## Dépenses (CHF/mois) — total ≤ 2 CHF
| poste | coût | budget | statut |
|---|---|---|---|
| Agents (Claude Code) | 0 | — | inclus abo |
| APIs Google (GSC/PSI/CrUX/GA4) | 0 | 0 | gratuit |
| Cron (VPS Hetzner mutualisé) | 0 | 0 | déjà payé, partagé 3 projets |
| Scraping SERP/concurrents | 0 | 0 | bande passante |
| **Monitoring citations LLM** | 0 | 1.50 | seul poste payant (dormant) |
| **TOTAL** | **0** | **2.00** | sous budget |

## Triggers d'upgrade (budget piloté par le revenu SEO)
| seuil revenu SEO/mois | nouveau plafond budget | débloque |
|---|---|---|
| > 200 CHF | 5 CHF | citations + fréquentes, + prompts |
| > 500 CHF | 15 CHF | API SERP payante (rangs précis) |
| > 1000 CHF | 30 CHF | VPS cron dédié, monitoring temps réel |

## Issues — état réel au 2026-06-18

### Closes depuis l'audit du 14/06 (vérifiées vivantes/mortes ce jour)
| # | issue | statut 18/06 | preuve |
|---|---|---|---|
| 1 | Sitemap malformé (`\n` dans `<loc>`) | **FERMÉ** | sitemap.xml live : 228 `<loc>` propres, 0 `\n` |
| 2 | /fr/essai canonical → home | **FERMÉ** | corrigé code, déployé |
| 3 | /fr/blog = 404 | **FERMÉ** | blog déployé, /fr/blog répond 200 |
| 4 | og-image 404 | **FERMÉ** | route /api/og en place |
| 5 | canonicals programmatiques sans locale | **FERMÉ** (template ville) | `frOnlyProgrammaticMeta` : canonical fr + noindex en/de |
| 6 | FAQ schema neutralisée par sanitizer | **FERMÉ** | FAQPage live sur /fr (5 Q/R) + pages villes (2 Q/R) |
| 7 | BlogPosting url/@id vides | **FERMÉ** | aucun url/@id vide détecté live |
| 8 | SoftwareApplication injecté 2× | **FERMÉ** | dédup par @id stable dans le @graph |

### P0 — pSEO, money-critical (chantier business n°1)
| # | issue | preuve | fix proposé | google_risk |
|---|---|---|---|---|
| P0-1 | **57 pages villes = thin / quasi-duplicate** : ~0 mot réellement unique. Contenu 100% statique + nom de ville interpolé. Le paragraphe « local » = 1 texte parmi 6 partagé par archStyle (cases `brick`/`timber` n'injectent même pas le nom de ville). Risque index bloat + dévaluation site entier. | `cities.ts` = 6 champs (name, slug, region, zip générique, country, archStyle). `getArchitectureContent` = switch 6 cas. | Barrière qualité AVANT toute nouvelle page (voir Plan pSEO). Enrichir données par ville (vraies données locales) OU noindex la longue traîne faible et ne garder en index qu'une 1re vague qualifiée. | **HIGH si on ne corrige pas** |
| P0-2 | **0 clic malgré impressions** : titles avec tiret de séparation + intention mismatch. La requête « architecte d'intérieur Genève » cherche un PRO local ; on sert un SaaS IA → faible CTR + Google enfonce (pos 80+). | title = `Architecte d'intérieur IA à {ville} ({zip}) - Rénovation & Déco`. | Réécrire title/meta orientés intention réelle + bénéfice (voir plan). Reframe la promesse : « visualisez avant de payer un architecte ». | med |
| P0-3 | **Tiret de séparation dans les `<title>`** des villes ET du hub | `... ({zip}) - Rénovation` et `Ville - IA & Décoration \| InstaDeco` | remplacer ` - ` par ` : ` ou `\|` (règle projet zéro tiret, marqueur IA) | low |
| P0-4 | **Page hub `/architecte-interieur` sans noindex en/de ni canonical localisé** : `/en/architecte-interieur` et `/de/architecte-interieur` servent du FR mais sont indexables. Sitemap les déclare en 3 locales (`withAlternatesForAllLocales`). | `export const metadata` statique, canonical `https://instadeco.app/architecte-interieur` sans `/fr`. | Appliquer `frOnlyProgrammaticMeta` au hub + `frOnlySitemap`. | med |

### P1 — pSEO maillage + schema
| # | issue | fix proposé | google_risk |
|---|---|---|---|
| P1-1 | **Maillage inter-villes faible** : liens uniquement intra-région. Villes seules dans leur région = quasi-orphelines. | maillage par proximité géo + cross-pays limité, + lien hub→ville réciproque renforcé. | low |
| P1-2 | **URL du `Service` schema fausse** pour villes à accents/tirets (recalcule slug depuis `name`) : Genève→`genève`, Saint-Étienne, Liège, Nîmes, Besançon, Neuchâtel, Yverdon, Orléans. | utiliser `city.slug` au lieu de `name.toLowerCase().replace()`. | low |
| P1-3 | **Prix générique « 150€–300€ » identique partout**, y compris villes CH (devise affichée CHF). Incohérence = signal de qualité faible + risque crédibilité. | retirer le prix chiffré inventé OU le rendre réel par pays. **Pas d'invention de chiffres.** | med |
| P1-4 | **Emojis drapeaux** dans le copy du hub (`France 🇫🇷`...) | remplacer par icônes/texte (règle zéro emoji). | low |

### P1 — GEO (préparation citabilité IA)
| # | issue | fix proposé | google_risk |
|---|---|---|---|
| G-1 | **`llms.txt` absent** (404 live, aucune route code) | créer `app/llms.txt/route.ts` ou `public/llms.txt` : index des pages clés + 1 phrase de description par page. | low |
| G-2 | **`sameAs` = 3** (Twitter, Instagram, Pinterest) vs cible ≥10 | ajouter profils RÉELS uniquement (LinkedIn, Facebook, YouTube, Product Hunt, etc. créés). Pas de profil fictif. | low |
| G-3 | **Articles blog sans `FAQPage`** : 38 articles FR = gros gisement citable non structuré | ajouter FAQPage (2-3 Q/R, réponses 40-60 mots) en fin d'article, sur vrai contenu. | low |
| G-4 | **`availableLanguage` figé `["French"]`** sur /en /de (Organization + Service) | propager la locale (déjà fait pour `inLanguage`). | low |
| G-5 | **Pas de `HowTo`** (workflow photo→style→rendu) | ajouter HowTo sur /generate ou home (4 étapes réelles). | low |
| G-6 | Réponses FAQ souvent <40 mots ; home n'expose que 5 Q/R | viser 40-60 mots, format Q→réponse directe, sur pages money. | low |

### P2 — hérité du 14/06 (encore à traiter, hors pSEO/GEO immédiat)
| # | issue | fix |
|---|---|---|
| 11 | Blog → /pricing : 0 lien interne | CTA blog→/pricing |
| 12 | `InternalLinksService` casse l'i18n + ne cible jamais /essai | préfixer locale + cibler /essai |
| 13 | /parrainage orpheline | 1 lien Footer |
| 14 | Cannibalisations (home staging Genève ×2, plantes ×2, home office ×2) | fusion + 301 |
| 16 | en/de blog vide mais indexable | backfill (runbook) ou noindex temporaire |
| 17 | Claim « 20+ styles » vs 11 documentés | vérifier catalogue réel |
| 18 | AggregateRating interdit (table vide) — comportement actuel correct | préserver, brancher quand vrais avis |

> Points solides confirmés live : robots.txt n'entrave aucun crawler IA, sitemap propre (228 URLs), `inLanguage` localisé, @graph dédupliqué par @id, ImageObject avant/après réel sur `/g/[id]`, page `/fr/architecte-interieur/geneve` a un @graph riche et valide (Service + City + FAQPage + ImageObject), aucun AggregateRating factice.

## Historique des audits
| date | agents lancés | findings | patchs appliqués |
|---|---|---|---|
| 2026-06-14 | technical, content, schema, cluster, link-graph (sans GSC) | 18 issues (5 P0, 5 P1, 8 P2) | P0 #1,2,4,5 + P1 #6,7,8 appliqués (code). |
| 2026-06-18 | seo-chief + 2 explorations (pSEO deep-dive + GEO/schema), sur GSC réel | 8 issues du 14/06 fermées. Nouveau focus : pSEO (P0-1→P0-4, P1-1→P1-4) + GEO (G-1→G-6). | aucun (audit lecture seule, patchs proposés au human). |
