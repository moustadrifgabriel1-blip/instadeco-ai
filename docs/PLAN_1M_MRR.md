# Plan 1M MRR, 2026 → 2031 (5-7 ans)

Mis à jour : 04/07/2026. Point de départ RÉEL : 21 utilisateurs, 1 abonné Pro, ≈49 € MRR, 4 essais/30 j, 7 clics SEO/28 j. Contrainte : **0 budget pub avant décembre 2026, puis 1 000/mois**. Mono-fondateur assisté par agents Claude. Ce plan est le document de pilotage : chaque trimestre, on le confronte aux chiffres réels et on ajuste (jamais les garde-fous, seulement les tactiques).

Compagnon : `docs/PREMORTEM_1M_MRR.md` (les 10 causes de mort et leurs signaux). Boussole héritée du CLAUDE.md : chaque action doit répondre « comment ça aide le MRR Pro ? ».

## La math à rebours (mix ARPU réaliste)

ARPU cible pondéré ≈ 55 € (mix Solo 19 / Pro 49 / Agence 99 / API-entreprise plus tard, annuel −30 % compris). 1M MRR ≈ **18 000 comptes payants** (ou moins si l'ARPU monte via Agence/API). Avec churn mensuel ≤ 3 % à maturité, il faut ~550 nouveaux comptes nets/mois en régime de croisière final.

| Fin d'année | MRR cible | Comptes payants ≈ | Multiplicateur annuel |
|---|---|---|---|
| 2026 (déc.) | 1 000 | 20 | ×20 (base minuscule) |
| 2027 | 10 000 | 200 | ×10 |
| 2028 | 40 000 | 750 | ×4 |
| 2029 | 130 000 | 2 400 | ×3,2 |
| 2030 | 400 000 | 7 500 | ×3 |
| 2031 | 1 000 000 | 18 000 | ×2,5 |

Les multiplicateurs décroissent (normal : petits nombres faciles, gros nombres durs). Si 2027 finit à 6k au lieu de 10k, on ne panique pas : on diagnostique le canal en retard, on double dessus, et le plan glisse vers l'horizon 7 ans (2033). **Kill criteria honnête : si déc. 2027 < 3k MRR malgré exécution réelle (outbound envoyé + SEO vivant + ads testées), pivot d'offre obligatoire (voir « pivots pré-autorisés »).**

## Phase 0 · Juil.-nov. 2026 : « Prouver la machine à la main » (0 pub)

Objectif : **20 abonnés payants (≈1k MRR) au 31 déc. 2026**, prouver qu'un canal reproductible convertit.

Acquisition (80 % de l'énergie) :
- **Outbound agents immo = levier n°1** : envoyer ENFIN le kit lot 1 (60 agents, visuels avant/après personnalisés). Cadence 20 emails/jour ouvré via contact@instadeco.app (finir DKIM/SPF, mémoire `email-pro-instadeco`). Mesurer réponses → démos → abonnements. Itérer le message toutes les 2 semaines sur les données.
- **SEO/AEO compounding** : moteur seo-engine RÉPARÉ et sous heartbeat (audit 04/07 : à l'arrêt depuis le 18/06). Drip pSEO + blog continue (gates qualité). Outils gratuits (4 en ligne) poussés : Request Indexing, 2-3 backlinks mérités/mois (annuaire proptech, articles invités utiles).
- **Leads → nurturing** : les emails capturés par les outils partent dans la séquence Resend (réparée le 02/07). Vérifier la délivrabilité mensuellement.
- **Preuve sociale réelle** : collecter les premiers avis (RatingStars) et 2-3 mini-études de cas d'agents (avec accord). Zéro chiffre inventé, jamais.

Produit/tech (20 %) :
- Fix heartbeat crons + backup storage S3 (cause de mort n°2 et n°7).
- Extraction god files /generate + /essai (chantier structure n°1) pour fiabiliser LE tunnel qui gagne l'argent.
- Tests auth/RLS/idempotence paiement (chantier n°2, sécurité argent).
- Rien d'autre. Pas de nouvelle feature avant 10 abonnés.

Jalons : sept. = 5 payants ; oct. = 10 ; déc. = 20 (1k MRR). Signal rouge : < 5 payants au 30 sept. → le message outbound est faux, atelier copy complet avant d'augmenter le volume.

## Phase 1 · Déc. 2026-déc. 2027 : « Trouver le canal qui scale » (1k/mois de pub)

Objectif : **10k MRR fin 2027** (≈200 comptes). Le 1k/mois de pub sert à ACHETER DE L'APPRENTISSAGE, pas du volume.

- **Ads discipliné** : 1 000/mois → Google Search intent chaud uniquement (« home staging virtuel », « logiciel home staging », marché FR/BE/CH). CPC estimé 1-3 € → 300-800 clics/mois → cible : CAC < 3 mois d'ARPU (≈150 €). Si CAC > 150 € après 3 mois d'itération, couper et remettre sur Meta retargeting des visiteurs outils/essai. Tracking déjà en place (GA4 + Pixel + events).
- **Outbound industrialisé** : passer de 20/jour manuel à séquences semi-automatisées (relances J+3/J+10), 2e et 3e lots Vibe Prospecting, extension Belgique + Romandie. 1 canal humain : 5 appels/démos par semaine.
- **SEO composé** : c'est l'année où les 233+ URLs, les outils et les backlinks commencent à payer (12-18 mois d'ancienneté). Cible fin 2027 : 3 000 clics/mois. AEO : être cité sur « home staging virtuel » dans AI Overviews/Perplexity (citation_batch enfin implémenté pour MESURER).
- **Rétention dès maintenant** : mesurer le churn mensuel, interviews des churns, feature « stock d'annonces » (re-staging régulier) pour rendre l'usage récurrent. Cible churn < 4 %.
- **Partenariats amorcés** : 2-3 accords avec formateurs immo, réseaux de mandataires (IAD, SAFTI...), logiciels de transaction : commission 20-30 % récurrente. C'est le 3e canal (cause de mort n°4).
- Tech : pagination API, E2E smoke post-deploy, CSP nonces. Embaucher personne ; augmenter le levier agents Claude.

Jalons trimestriels 2027 : mars = 2,5k ; juin = 4,5k ; sept. = 7k ; déc. = 10k MRR.

## Phase 2 · 2028 : « Sortir du marché francophone » → 40k MRR

- **Lancement DE + EN sérieux** : le produit est déjà i18n (fr/en/de). Traduire les money pages + outils + 30 contenus piliers par langue (natif, gate anti-IA). Marchés : Allemagne/Autriche/Suisse alémanique (de) + UK/international (en). Répliquer le playbook outbound sur les portails locaux (ImmoScout24, Rightmove).
- **Offre Agence poussée** (99 €, 3 sièges, puis paliers 199/499 multi-agences) : l'ARPU doit monter, c'est mathématiquement obligatoire (pré-mortem cause n°9).
- **Budget pub** : réinvestir ~15-20 % du MRR (6-8k/mois fin 2028) sur les canaux au CAC prouvé.
- **Produit** : API v1 (génération programmatique pour portails/CRM immo), exports intégrés, watermark optionnel B2B.
- Tech : queue de génération (BullMQ/Redis), dual-région, monitoring pro (Sentry). Premier freelance support/CS à ~25k MRR.

## Phase 3 · 2029 : « Distribution par les plateformes » → 130k MRR

- **Intégrations natives** : plugins/apps dans les CRM immo et portails (marketplace ImmoScout, apps SeLoger pro, Immoweb) : l'acquisition ne dépend plus de nous. L'API devient une offre (facturation à l'usage, ARPU entreprise 500-2000/mois).
- **Équipe minimale** : 1 sales/partnerships + 1 dev + support externalisé. Marge brute ~90 % le permet à 60k MRR.
- **Marque** : études de cas chiffrées réelles, présence salons immo (RENT, MIPIM stand partagé), programme ambassadeurs agents.

## Phase 4 · 2030-2031 : « Compounding » → 400k puis 1M MRR

- Les 4 moteurs tournent ensemble : SEO multi-langue ancien (gratuit), partenariats/API (récurrent), ads au CAC maîtrisé (scalable), bouche-à-oreille pro (gratuit). La croissance devient additive.
- Élargissement produit adjacent au même client : visites virtuelles enrichies, vidéo de bien auto-générée, saisonnalité des annonces. Uniquement ce que les clients paient déjà ailleurs.
- Équipe 5-8 personnes max (ARR ~12M, ratio sain). Option : levée de croissance OU rester profitable indépendant : décision en 2030, pas avant.

## Règles permanentes (ne changent jamais)
1. **Chaque semaine commence par l'acquisition** (quota outbound/partenariats), le code vient après. Jusqu'à 10k MRR minimum.
2. **Google-safe absolu** : publication lente, people-first, gates qualité. Automatiser l'optimisation, jamais la mass-génération.
3. **Aucune stat inventée, jamais** : la preuve sociale attend les vraies données.
4. **Tout moteur automatisé a un heartbeat** ; sans rapport frais de < 7 jours, il est réputé mort et se répare en priorité.
5. **CAC < 3 mois d'ARPU** sinon le canal se coupe ; **churn < 4 %** sinon la rétention devient LE chantier.
6. **COGS < 15 % du MRR** (fair-use + multi-provider).
7. Revue trimestrielle de ce plan avec les chiffres réels (agent `growth-chief`).

## Pivots pré-autorisés (si kill criteria déclenché fin 2027)
- **Pivot ARPU** : abandonner le B2C résiduel, offre 100 % agences à 149-299 €/mois avec onboarding humain (moins de clients, plus de valeur).
- **Pivot canal** : white-label pour réseaux immo (leur marque, notre moteur), vendu en central à 2-5k/mois par réseau.
- **Pivot produit** : suite « annonce parfaite » (staging + description + diffusion) au lieu du staging seul.

## Rôle des agents Claude dans ce plan
- `growth-chief` (NOUVEAU, opus) : pilote ce plan. Revue hebdo des KPIs réels (SQL Supabase + GSC + log outbound), écarts vs jalons, 3 actions max recommandées, tient `docs/PLAN_1M_MRR.md` à jour trimestriellement.
- `seo-chief` (opus) : inchangé, l'organe SEO/GEO. Doit tourner sur des données FRAÎCHES (heartbeat).
- Escouades seo-* : inchangées (sonnet/haiku suffisent, coût maîtrisé).
- Claude Code en session : exécution des chantiers tech dans l'ordre du plan, et JAMAIS de nouvelle feature hors plan sans passer par la boussole MRR.
