# Entity — InstaDeco

> Nœud Knowledge Graph. Écrit/maintenu par `seo-entity-graph`. Objectif : entité reconnue (Google KG + LLMs).
> Dernier audit : 02/07/2026.

## Identité
- name : InstaDeco AI (legalName code = "InstaDeco AI" ; usage courant "InstaDeco", cf. gap NAP ci-dessous)
- domaine : https://instadeco.app
- secteur : décoration d'intérieur par IA (rendu photo avant/après), home staging virtuel B2B agents immo
- type : SaaS B2C freemium + abonnement Pro B2B (essai gratuit → crédits Stripe / abonnement)
- fondateur : Gabriel Moustadrif (byline blog + /a-propos, PAS reflété dans lib/seo/config.ts qui a encore `founders: ['InstaDeco Team']`)
- email pro : contact@instadeco.app (config Workspace en cours, cf. mémoire email-pro-instadeco)

## Wikidata
- Q-id : absent, aucune entité InstaDeco trouvée.
- Éligibilité (honnête) : NON éligible aujourd'hui. Wikidata autorise en théorie des entités non notables au sens strict wikipédien (moins strict que Wikipédia), mais exige des **sources secondaires indépendantes vérifiables** (presse, bases sectorielles) hors du site et des réseaux propres. InstaDeco n'a à ce jour aucune couverture presse/tierce identifiée. Créer la page maintenant = rejet probable (notabilité insuffisante) ou entité "orpheline" sans lien retour utile.
- Recommandation : reporter Wikidata après (a) au moins 1 à 2 mentions presse/annuaire indépendantes (Product Hunt feature, listicle sectoriel, article PropTech) et (b) profils sameAs établis à faire référencer en sources. Revisiter dans 2 à 3 mois.
- Alternative immédiate à plus fort ROI : **Google Business Profile** (entité locale/Knowledge Panel possible même sans Wikidata, si adresse pro dispo) et consolidation sameAs (le Knowledge Graph de Google peut reconnaître une entité via signaux sameAs + citations cohérentes sans passer par Wikidata en premier).

## Organization schema, gaps identifiés (code : lib/seo/config.ts + lib/seo/schemas.ts)
| attribut | état actuel | gap |
|---|---|---|
| name/legalName | "InstaDeco AI" | ok, mais vérifier cohérence avec usage "InstaDeco" seul ailleurs (cf. NAP) |
| url | instadeco.app | ok |
| logo | /images/logo-v3-house-sparkle.svg | ok (vérifier résolution absolue en JSON-LD) |
| description | présente (siteDescription) | ok |
| founder | `founders: ['InstaDeco Team']` | ❌ gap : à remplacer par Person "Gabriel Moustadrif" + `sameAs`/url vers /a-propos, cohérent avec le schema BlogPosting author déjà en place |
| foundingDate | '2025' | ok (vérifier année exacte réelle de fondation) |
| contactPoint | email = SEO_CONFIG.email (contact@instadeco.app), contactType customer service | ok une fois la config Workspace finalisée (DKIM/SPF) |
| areaServed | absent du schema Organization (existe seulement en `targetCountries` config, pas émis en JSON-LD) | ❌ gap : ajouter areaServed CH/FR/BE (+DE/EN comme marchés secondaires) |
| sameAs | 3 profils (Instagram, Facebook, Pinterest) | ❌ gap majeur : cible ≥10, il en manque 7 minimum |

## Cohérence NAP (Name / Address / Phone / brand)
| plateforme | name attendu | URL | cohérent ? |
|---|---|---|---|
| Site (référence) | InstaDeco AI | instadeco.app | ✅ |
| Instagram | @instadecoai | instagram.com/instadecoai | ✅ existant, à revérifier logo/bio à jour |
| Facebook | InstaDeco AI | facebook.com/people/InstaDeco-AI/61588194177866/ | ⚠️ URL avec ID numérique brut (page non-vanity), à surveiller si stabilité |
| Pinterest | InstadecoApp | pinterest.com/InstadecoApp/ | ⚠️ variante de nom ("InstadecoApp" collé) vs "InstaDeco AI", à harmoniser dans la bio au moins |
| Product Hunt | — | — | ❌ à créer |
| Trustpilot | — | — | ❌ à créer |
| Capterra | — | — | ❌ à créer |
| G2 | — | — | ❌ à créer |
| LinkedIn (company) | — | — | ❌ à créer |
| Crunchbase | — | — | ❌ à créer |
| Wikidata | — | — | ❌ non éligible pour l'instant |

## Profils tiers à créer (sameAs), priorisés
Voir `brand-presence-map.md` pour le plan détaillé plateforme par plateforme.
