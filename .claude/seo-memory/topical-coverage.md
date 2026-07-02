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

## Veille concurrentielle — 2026-07-02 (seo-competitor, marché home staging virtuel agents immo FR/BE/CH)

> Sources : Common Crawl index CC-MAIN-2026-25 (inventaire URLs, gratuit) + WebFetch ciblé (2 pages HOQI, rate-limit respecté ≥5s). Domaines inaccessibles à date : `hoqi.io` (aucune capture Common Crawl, le vrai domaine est `hoqi.app`). Périmètre élargi (demande seo-chief) au-delà des 5 concurrents déco IA génériques : HOQI, BoxBrownie, Virtual Staging AI, ApplyDesign, Styldod, spécialisés home staging immo, plus pertinents que reimaginehome/interiorai/spacely/collov/decormatters pour ce cluster.

### HOQI (hoqi.app) — concurrent direct le plus pertinent géographiquement
- **Prix affiché** (2026-07-02, page `/tarifs`) : Freemium 7 jours (5 photos, 2 vidéos) → **Access 19,99€/mois** (utilisateurs additionnels +10€ HT, photos/rendus illimités) → **Premium 24,99€/mois** (+15€ HT/utilisateur, génération vidéo illimitée + image-to-video). Sans engagement, résiliable à tout moment.
- **Gap topical vs InstaDeco** : (1) génération **image-vers-vidéo** pour les biens (annoncée en avant-page, zéro équivalent chez nous) ; (2) **multilingue natif** FR/EN/ES/DE/PT/IT avec URLs localisées par marché (`/de/preise`, `/it/prezzi`) alors que notre `/pro` est fr-only ; (3) **preuve sociale nommée** : témoignages d'agents avec métriques concrètes (« 2x plus de mandats », logos clients Century21/Efficity/Noovimo/CTI) ; (4) note "4.9/5" + "+35K téléchargements" affichés en hero.
- **Notre avantage mesuré** : HOQI reste France-only sur le positionnement (adresse Paris, aucune mention Belgique/Suisse sur la home), alors qu'InstaDeco a déjà des pages dédiées `/solution/home-staging-virtuel-belgique` et `/solution/home-staging-virtuel-suisse-romande`. Gap géo à exploiter, pas à combler.
- **Prix** : HOQI Access (19,99€) est moins cher que notre palier Pro (49€ illimité), déjà noté dans `seo-cluster-pro.md`. Confirmation factuelle du jour.

### Styldod (styldod.com) — leader contenu/blog (marché US mais structure copiable)
- Volume de blog considérable centré immobilier (guides agents, "X best real estate agents [ville]", floor plans, drone photography, MLS disclosure IA en Californie AB-723). **Gap topical majeur** : aucun contenu InstaDeco sur (a) guides pratiques agents immo au-delà de la déco (mise en valeur photo, visite virtuelle 360, plans 2D/3D), (b) angle réglementaire/disclosure sur les images retouchées par IA en immobilier (pertinent FR/BE/CH aussi : obligation de mentionner un rendu virtuel, déjà en germe avec notre page `/solution/home-staging-virtuel-legal`, à enrichir avec cet angle comparatif).
- Format `AI vs interior designer` et `AI real estate close deals faster` : angles ROI/comparatif que nous n'avons qu'en partie (`meilleur-logiciel-home-staging-virtuel-2026` existe déjà, bon point).

### Virtual Staging AI (virtualstagingai.app)
- Page dédiée **`/virtual-staging-pricing`** et **`/virtual-staging-how-to`** séparées de la home : architecture en pages piliers par intention (prix / mode d'emploi) que nous répliquons déjà partiellement via `/solution/home-staging-virtuel-prix`.
- Blog orienté ROI vendeur : "how much does it cost to sell a house", "how much does it cost to stage a house", "housing market predictions". **Gap** : aucun contenu chiffré côté InstaDeco sur le coût du home staging physique vs virtuel en euros CH/FR/BE (angle très money-intent, proche de nos pages Pro).
- Programme d'affiliation actif (`/affiliate`, paramètres `?via=`) : signal d'un canal d'acquisition partenaire que nous n'avons pas encore structuré.

### ApplyDesign (applydesign.io)
- Contenu "top 5 virtual digital staging companies to watch in 2026" (listicle auto-promotionnel) et "virtual staging apps vs virtual staging services". Confirme que le format comparatif/listicle est un standard du secteur, cohérent avec notre article déjà publié.

### BoxBrownie
- Essentiellement des pages de commande/panier (`/360/?c=...`) indexées en masse, pas de contenu éditorial visible dans l'échantillon Common Crawl. Pas de gap topical identifiable depuis cette source ; à ignorer pour cette itération (pas de contenu comparable trouvé, aucune donnée inventée).

### Gaps prioritaires proposés à seo-chief (pertinence marché FR/BE/CH × proximité money page × faisabilité)
1. **Angle légal/disclosure home staging IA** (comme Styldod AB-723) : enrichir `/solution/home-staging-virtuel-legal` avec un comparatif des obligations de mention par pays (France/Belgique/Suisse), sourcé réel, pas inventé. Proximité money page : haute (déjà lié au cluster /pro).
2. **Page ROI chiffrée "coût home staging physique vs virtuel en France/Belgique/Suisse"** (angle Virtual Staging AI) : contenu chiffré sourcé (pas d'invention de tarifs, citer des fourchettes publiques vérifiables) pointant vers `/pro`.
3. **Preuve sociale nommée sur `/pro`** (comme HOQI) : témoignages agents avec nom + métrique réelle si disponibles côté InstaDeco (aucune donnée inventée si absente, sinon différer).
4. **Génération image-vers-vidéo** (feature gap HOQI) : hors périmètre contenu, à signaler à seo-chief comme gap produit potentiel, pas une action SEO.
5. **Multilingue `/pro` DE** : HOQI et le marché suisse-alémanique sont couverts par HOQI en DE, `/pro` est fr-only actuellement (choix delibéré noté dans les mémoires, à reconfirmer avec seo-chief vu ce signal concurrent).

### Cibles d'autorité off-site nommées (listicles/annuaires/médias immo FR-BE-CH où figurer)
- Listicles à cibler pour inclusion InstaDeco : pages "top 5 virtual staging companies" type ApplyDesign (chercher équivalents FR), comparatifs "meilleur logiciel home staging" (déjà notre propre article publié, cible = backlinks vers lui).
- Annuaires SaaS immo francophones et médias immo BE/CH (non vérifiés cette itération, nécessite recherche dédiée hors Common Crawl, à confier à `seo-brand-outreach` ou itération suivante avec accès presse immo).
