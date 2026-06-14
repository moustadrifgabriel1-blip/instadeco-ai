# Topical map — InstaDeco

> Autorité thématique. Écrit par `seo-cluster` + `seo-content`. Hub-and-spoke autour de la déco par IA.

## Pilliers candidats (secteur déco)
> Aligné sur les thèmes du générateur blog (`src/shared/constants/blog-themes.ts`).

### Cluster 1 : Styles de décoration
- pillar : _(à définir)_ · intent : informationnel → transactionnel · coverage : —
- spokes : scandinave, japandi, industriel, bohème, minimaliste, art déco, cottagecore, maximaliste…
- | sous-sujet | page | langue | ranking | gap |
  | scandinave salon | blog | fr | — | — |

### Cluster 2 : Pièces
- spokes : salon, chambre, cuisine, salle de bain, bureau/home-office, entrée, buanderie, sous-sol…

### Cluster 3 : Couleurs & matières
- spokes : vert sauge, tons neutres, palettes, peinture…

### Cluster 4 : Home staging & immobilier (money intent fort)
- spokes : ranger avant visite, valoriser avant vente/location, staging virtuel → **lien direct vers /essai et /pricing**

### Cluster 5 : Déco par IA (différenciateur produit)
- spokes : visualiser avant d'acheter, IA vs décorateur, rendu avant/après, comment ça marche

## Gap analysis vs concurrents
> Rempli par `seo-competitor` + `seo-cluster` : sujets couverts par reimaginehome/interiorai/spacely/collov/decormatters mais absents chez nous.
| sujet concurrent | qui le couvre | priorité InstaDeco |
|---|---|---|
| — | — | — |

## Maillage interne — audit seo-link-graph (2026-06-14, analyse statique du code)

### Méthode
Mesuré par `grep` sur `Link` de `@/i18n/navigation` + `href` (objets + JSX) dans `app/` et `components/`. Le **corps des articles blog** est rendu en HTML via `dangerouslySetInnerHTML` (marked) avec liens en `<a href>` BRUTS (`blog/[slug]/page.tsx` l.281-288) — donc HORS i18n `Link` et non comptés ici (mesuré, pas inféré). 31 routes ; 124 liens internes statiques relevés.

### Liens entrants par cible (nb de fichiers sources distincts — mesuré)
| cible | sources distinctes | canaux principaux |
|---|---|---|
| /generate | 20 | Header, Footer, blog CTA, hubs, deco |
| /essai | 12 | Header, BlogCtaBanner, deco, quiz, pricing, a-propos, parrainage, galerie |
| /pricing | 10 | Header, Footer, solutions, solution/[slug], exemples |
| /blog | 10 | Header, Footer, articles |
| /styles | 9 | Footer, hubs |
| /pieces | 6 | Footer, hubs, page accueil |
| /solutions | 6 | Footer, hubs |

### Pages orphelines / sous-maillées (mesuré)
| page | liens entrants internes | sévérité | note |
|---|---|---|---|
| /parrainage | 0 (auto-référence seule) | high | absente sitemap + header + footer |
| /tiktok-generator | 0 éditorial (sitemap seul) | med | aucun lien depuis header/footer/contenu |
| /g/[id] | 0 (pages de partage) | low | orphelines by-design (partage social) |
| /a-propos | 1 (Footer uniquement) | low | OK mais peu profond |

### Money pages — état du flux blog → /essai et /pricing
- blog → **/essai** : 1 seul chemin via `BlogCtaBanner` (inline, par article). Bon point d'ancrage. Ancres variées par tag (bon).
- blog → **/pricing** : **0 lien** depuis le blog (ni body, ni CTA, ni sidebar). **Gap principal.**
- blog body CTA (`blog/[slug]` l.498) pointe vers **/generate**, pas /essai ni /pricing.
- `InternalLinksService.ts` (générateur de liens markdown) pointe vers /generate, /exemples, /pricing — **jamais /essai** ; et génère des URLs SANS préfixe locale (casse i18n pour /en, /de).

### Matrice hub-and-spoke proposée (Google-safe : 1-2 liens/page, vélocité limitée)
| de (hub/spoke) | vers | ancre suggérée (variée) | priorité |
|---|---|---|---|
| /blog (sidebar/contenu) | /pricing | "voir nos offres de crédits" | high |
| article cluster Home-staging | /pricing | "tarifs home staging IA" | high |
| article cluster Styles | /style/{slug} | nom du style (ex. "salon scandinave") | med |
| article cluster Pièces | /piece/{slug} | nom de la pièce | med |
| /styles, /pieces, /solutions (hubs) | /essai | "essayer gratuitement" | med |
| Footer/Header (nouveau) | /parrainage | "parrainage" (sortir de l'orphelinat) | med |
| /quiz (résultat) | /pricing | "débloquer plus de crédits" | low |

### Actions correctives prioritaires (à valider par l'humain — pas d'application en masse)
1. **InternalLinksService** : préfixer les URLs par la locale OU passer par `Link` i18n ; ajouter une entrée `/essai` (mot-clé "essai gratuit"). `src/infrastructure/services/InternalLinksService.ts`.
2. Ajouter un lien blog → **/pricing** (sidebar `blog/[slug]` ou un 2e CTA contextuel), ancre non sur-optimisée.
3. Maillage **/parrainage** : l'ajouter au Footer (1 lien) pour le sortir de l'orphelinat.
4. (Optionnel) lier **/tiktok-generator** depuis une page produit pertinente.

> Vélocité : ajouter ces liens progressivement (quelques-uns par déploiement), pas en bloc.
