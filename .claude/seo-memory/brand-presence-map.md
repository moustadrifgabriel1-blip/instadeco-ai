# Brand presence — InstaDeco

> Objectif : taper « InstaDeco » dans Google = 10/10 résultats possédés ou contrôlés. Écrit par `seo-entity-graph` (plan sameAs) / `seo-brand-outreach` (exécution outreach).
> Dernier audit : 02/07/2026.

## SERP de marque « InstaDeco »
| slot | type | url | status |
|---|---|---|---|
| 1 | site officiel | https://instadeco.app | ✅ owned |
| 2 | sitelinks | (auto Google) | ⏳ |
| 3 | Product Hunt | — | ❌ missing, PROPOSÉ prioritaire |
| 4 | LinkedIn company | — | ❌ missing, PROPOSÉ prioritaire |
| 5 | Crunchbase | — | ❌ missing, PROPOSÉ prioritaire |
| 6 | Capterra / G2 | — | ❌ missing, PROPOSÉ (angle agents immo) |
| 7 | Trustpilot | — | ❌ missing, PROPOSÉ (nécessite volume d'avis réels) |
| 8 | Wikidata / KG | — | ❌ non éligible actuellement (voir entity-graph.md) |
| 9 | Instagram / Pinterest / Facebook | existants | ✅ owned (3/3 déjà en sameAs) |
| 10 | presse / annuaire SaaS tiers | — | ❌ missing |

## Plan sameAs priorisé (profils réels à créer, PAS à créer par l'agent, proposition humaine)

| # | plateforme | angle InstaDeco | effort | valeur entité/citation | priorité |
|---|---|---|---|---|---|
| 1 | Product Hunt | Lancement produit SaaS déco IA, showcase avant/après, capte early-adopters + backlink DoFollow reconnu, citable par LLMs (PH est une source fréquemment indexée par les moteurs génératifs) | faible (compte gratuit, ~1-2h prépa assets) | haute | P0 |
| 2 | LinkedIn company page | Vitrine B2B officielle, indispensable pour crédibiliser l'entité auprès des agents immo (cible outbound), lien réciproque avec le profil perso de Gabriel Moustadrif | faible (30 min, gratuit) | haute (signal fort pour Google KG + confiance B2B) | P0 |
| 3 | Crunchbase | Fiche entreprise (fondateur, date de fondation, secteur PropTech/AI), référence standard pour bases "startup/SaaS" que les LLMs citent souvent en question "qui est InstaDeco" | faible (gratuit, self-serve) | moyenne haute | P0 |
| 4 | Capterra | Annuaire logiciels B2B, categorie "home staging virtuel"/"design software", cible directe agents immo/agences, avis clients possibles | moyen (process de vérification éditeur) | haute (trafic qualifié + signal G2/Capterra très regardé par acheteurs B2B) | P1 |
| 5 | G2 | Même logique que Capterra, catégorie design/real estate tech, avis vérifiés | moyen (process de vérification, nécessite des avis pour être utile) | moyenne haute | P1 |
| 6 | Trustpilot | Avis clients publics, renforce E-E-A-T "Confiance", MAIS n'a de valeur que si de vrais avis existent (ne pas créer un profil vide qui reste à 0 avis, mauvais signal) | faible à créer, mais dépend d'une base d'avis réels | moyenne (conditionnelle) | P2, séquencer après avoir des clients Pro actifs |
| 7 | Annuaire SaaS FR (ex. AppSumo, SaaSHub, GetApp, un annuaire francophone SaaS/PropTech) | Renforce le maillage sameAs francophone, cible CH/FR/BE | faible | moyenne | P2 |
| 8 | AlternativeTo | Positionnement face aux alternatives (utile pour requêtes comparatives type "alternative à HOQI"), profil gratuit | faible | moyenne | P2 |
| 9 | X/Twitter (@instadeco_ai, déjà réservé selon SEO_CONFIG.twitterHandle) | Vérifier si le compte est actif et à ajouter au sameAs (handle déjà configuré dans le code mais absent du sameAs schema actuel, à harmoniser avec seo-schema) | très faible (déjà existant probablement) | moyenne | P0 (quick win, juste ajouter au schema si le compte est réel et actif) |
| 10 | YouTube (si contenu démo/avant-après existe ou prévu) | Vidéos de démonstration produit, format très repris par les moteurs génératifs pour "comment ça marche" | moyen (nécessite production vidéo) | moyenne | P3 |

Note : Wikidata reste hors de ce tableau sameAs tant que la notabilité n'est pas établie (voir entity-graph.md). Ne pas créer de profil Trustpilot vide avant d'avoir des avis réels à afficher (risque de signal négatif "0 avis").

## Cohérence NAP à surveiller lors de la création
- Nom affiché : uniformiser "InstaDeco AI" (ou "InstaDeco" partout si c'est la forme préférée officiellement, actuellement les deux coexistent : legalName code dit "InstaDeco AI", Pinterest est en "InstadecoApp"). Recommandation : trancher UNE forme canonique et l'utiliser partout, y compris à retoucher légèrement la bio Pinterest existante.
- URL officielle unique partout : https://instadeco.app (pas de www, pas de variante trailing slash).
- Description courte cohérente à réutiliser telle quelle sur chaque profil (dérivée de `SEO_CONFIG.siteDescription`), pour éviter des descriptions divergentes qui diluent le signal d'entité.
- Logo : même fichier source (`/images/logo-v3-house-sparkle.svg` exporté en PNG) sur tous les profils.
- Chaque nouveau profil doit pointer vers instadeco.app en bio/site officiel (réciprocité), et les profils déjà en sameAs (Instagram, Facebook, Pinterest) doivent être vérifiés pour confirmer qu'ils pointent bien vers le domaine actuel.

## Mentions sans lien (à convertir)
| source | URL | mention | lien obtenu ? |
|---|---|---|---|
| — | — | — | — |

## Digital PR / outreach (propositions, l'humain envoie)
| cible | angle | statut |
|---|---|---|
| Product Hunt | Lancement "InstaDeco AI, home staging virtuel par IA pour agents immo" | proposé, à valider |
| LinkedIn | Company page + posts de lancement liés au profil perso de Gabriel Moustadrif | proposé, à valider |
| Presse/annuaires PropTech FR/BE/CH | Cible pour obtenir une 1ère mention tierce indépendante, prérequis Wikidata | proposé, hors périmètre agent (→ seo-brand-outreach) |

## Coordination
`sameAs` validés à transmettre à `seo-schema` pour intégration dans le JSON-LD Organization dès création réelle des profils (ne rien intégrer avant existence confirmée par WebFetch).
