# SEO Scoreboard — InstaDeco

> Tableau de bord central. Écrit par `seo-chief` après chaque audit. Source de vérité partagée.
> Statut système : **ACTIF (Google-safe, croissance progressive)** — installé le 2026-06-14.

## KPIs (28 jours glissants)
| métrique | valeur | cible | trend | source |
|---|---|---|---|---|
| Clics organiques (GSC) | — | ↗ | — | seo-google |
| Impressions (GSC) | — | ↗ | — | seo-google |
| Position moyenne | — | <15 | — | seo-google |
| Pages indexées | — | =sitemap | — | seo-google |
| LCP / INP / CLS (CrUX) | — | bon | — | seo-technical |
| Citations LLM (mentions) | — | ↗ | — | seo-geo-citation |
| Articles blog publiés (fr/en/de) | 38 / 0 / 0 | parité | — | code |

## Dépenses (CHF/mois) — total ≤ 2 CHF
| poste | coût | budget | statut |
|---|---|---|---|
| Agents (Claude Code) | 0 | — | inclus abo |
| APIs Google (GSC/PSI/CrUX/GA4) | 0 | 0 | gratuit |
| Cron (GitHub Actions) | 0 | 0 | gratuit |
| Scraping SERP/concurrents | 0 | 0 | bande passante |
| **Monitoring citations LLM** | 0 | 1.50 | seul poste payant |
| **TOTAL** | **0** | **2.00** | ✅ sous budget |

## Triggers d'upgrade (budget piloté par le revenu SEO)
| seuil revenu SEO/mois | nouveau plafond budget | débloque |
|---|---|---|
| > 200 CHF | 5 CHF | citations + fréquentes, + prompts |
| > 500 CHF | 15 CHF | API SERP payante (rangs précis) |
| > 1000 CHF | 30 CHF | VPS cron dédié, monitoring temps réel |

## Issues prioritaires (audit 2026-06-14 — par impact business)

### P0 — VÉRIFIÉS EN PROD par seo-chief (cassent indexation / money pages)
| # | issue | preuve | fix | statut |
|---|---|---|---|---|
| 1 | **Sitemap malformé** : `\n` littéral dans chaque `<loc>`+hreflang → ~393 URLs invalides | `curl sitemap.xml` : `<loc>https://instadeco.app⏎/fr</loc>` | `NEXT_PUBLIC_APP_URL` (Vercel) a un retour-ligne final → durci à la source dans `lib/seo/config.ts` (.trim) | ✅ corrigé code (redeploy requis) + nettoyer l'env Vercel |
| 2 | **/fr/essai canonical → home** (`/fr`) : money page désindexée | `curl /fr/essai` canonical=`/fr` | `generateMetadata` + `getLocalizedCanonicalUrl(locale,'/essai')` + hreflang | ⏳ à corriger |
| 3 | **/fr/blog = 404** : hub blog inaccessible + 0 article au sitemap | `curl /fr/blog` HTTP 404 | lié au déploiement du blog localisé (branche feat non mergée) | ⏳ déployer + vérifier route |
| 4 | **og-image.png = 404** : aperçus sociaux/IA cassés | `curl /og-image.png` 404 | redéployer le fichier `public/og-image.png` | ⏳ |
| 5 | **~370 pages programmatiques** : canonical sans locale → 307 + 0 hreflang | seo-technical (live /fr/style/moderne) | `getCanonicalUrl`→`getLocalizedCanonicalUrl` partout | ⏳ |

### P1 — Schema / structured data (code, high-confidence)
| # | issue | agent | fix |
|---|---|---|---|
| 6 | **FAQ schema neutralisée** : sanitizer strippe itemscope/itemprop/itemtype → 0 rich result FAQ sur 38 articles + perte citabilité LLM | seo-content | JSON-LD FAQPage côté template (hors sanitizer) |
| 7 | BlogPosting `url`/`@id` = chaînes vides → schéma invalide | seo-schema | renseigner l'URL canonique |
| 8 | SoftwareApplication injecté 2× sur /generate | seo-schema | une seule instance `@id #software` |
| 9 | HowTo absent (flux upload→style→avant/après) ; ImageObject avant/après manquant | seo-schema | ajouter snippets (brouillon `schema-proposals.md`) |
| 10 | sameAs = 3 (cible ≥10) ; `inLanguage` figé 'fr' sur /en /de | seo-schema | profils réels + inLanguage par locale |

### P2 — Maillage / clusters / contenu
| # | issue | agent | fix |
|---|---|---|---|
| 11 | Blog → /pricing : **0 lien interne** | seo-link-graph | CTA/sidebar blog→/pricing |
| 12 | `InternalLinksService` casse l'i18n (URLs sans locale) + ne cible jamais /essai | seo-link-graph | préfixer locale + cibler /essai |
| 13 | /parrainage orpheline (0 lien entrant) | seo-link-graph | 1 lien Footer |
| 14 | Cannibalisations : home staging Genève ×2, plantes vertes ×2, home office ×2 | seo-cluster | fusion + 301 |
| 15 | Pillars (hubs) manquants sur 5 clusters ; home staging & déco IA sous-couverts | seo-cluster | créer 2 pillars proches money pages |
| 16 | en/de blog vide mais indexable → thin | seo-content/cluster | backfill (runbook) ou noindex temporaire |
| 17 | Claim « 20+ styles » alors que 11 documentés | seo-content | vérifier le catalogue réel /generate |
| 18 | AggregateRating INTERDIT (table generation_ratings vide) — comportement actuel correct | seo-schema | préserver, brancher quand vrais avis |

> Note transverse : plusieurs P0/P1 viennent du **gap de déploiement** — la branche `feat/conversion-blog-i18n-ratings-guest-checkout` (blog localisé, fixes) n'est pas en prod. Déployer en résout une partie (dont /fr/blog).

## Historique des audits
| date | agents lancés | findings | patchs appliqués |
|---|---|---|---|
| 2026-06-14 | technical, content, schema, cluster, link-graph (sans GSC) | 18 issues (5 P0 vérifiés prod, 5 P1, 8 P2) | **P0** : #1 sitemap (.trim config), #2 /essai canonical, #4 og→/api/og, #5 canonicals localisés (12 pages + generate). **P1** : #6 FAQ sanitizer, #7 BlogPosting url/@id, #8 SoftwareApp dédup (@id). Tout vert (tsc+lint+115 tests). Restent : #3 blog 404 (=déploiement), inLanguage/locale, HowTo, sameAs (profils réels). |
