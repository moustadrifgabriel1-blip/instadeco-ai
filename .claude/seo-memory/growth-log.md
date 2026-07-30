# Growth log — journal des revues growth-chief

Journal append-only. Une entrée datée par revue hebdomadaire. Format : KPIs vs jalons, alertes pré-mortem, 3 actions.

## 2026-07-04 — Revue fondatrice (baseline)

KPIs mesurés en base (réels) :
- MRR ≈ 49 € (1 abonné Pro actif). Jalon déc. 2026 : 1 000 € (20 payants).
- Utilisateurs : 21 total, 5 sur 30 j. Essais : 4/30 j. Générations : 43/30 j. Leads : 16. Achats crédits : 0.
- SEO (mesure 22/06) : 7 clics / 305 impressions / 28 j.

Alertes pré-mortem actives :
- Cause n°1 (acquisition non exécutée) : kit outbound de 60 agents JAMAIS envoyé. Finding n°1.
- Cause n°2 (moteur mort en silence) : aucun rapport seo-engine depuis le 18/06. À vérifier/réparer sur le VPS.

3 actions de la semaine :
1. (Gabriel) Finir l'email pro (DKIM/SPF/Gmail) et ENVOYER les 20 premiers emails outbound du lot 1. DoD : 20 envois loggés.
2. (Gabriel + Claude) Vérifier le VPS : les crons seo-engine tournent-ils ? Réparer + activer un heartbeat (rapport daté < 7 j). DoD : un rapport gsc_daily daté du jour dans reports/.
3. (Gabriel, 5 min) Poser NEXT_PUBLIC_CLARITY_ID et NEXT_PUBLIC_WELCOME_COUPON sur Vercel. DoD : Clarity enregistre, l'offre -20 % s'affiche.

## 2026-07-05 — Point J+1 (moteur SEO)

KPIs (réels, base) : MRR 49 € (1 Pro), 21 users, 16 leads, 2 générations/7j. **Plat** vs baseline : les 2 moteurs d'acquisition dorment, rien ne pousse.

Levée d'ambiguïté cause n°2 : le « seo-engine muet depuis le 18/06 » était en partie un **faux positif de visibilité**. Les rapports sont gitignorés (repo public) donc n'apparaissent JAMAIS dans le repo, même moteur vivant. Impossible de trancher sans SSH (accès VPS refusé côté agent). Le **pipeline code est sain** : sonde GSC locale (ADC) OK → 10 clics / 505 impr / pos 9,9 sur 28j (vs 7/305/18,5 le 22/06, ça **progresse**, mais 0 requête home staging/Pro).

Fix livré et MERGÉ sur main (PR #7, merge d9ef972) : heartbeat VISIBLE. Table `seo_engine_heartbeats` + route `/api/cron/seo-heartbeat` (POST run / GET verdict alive) + hook dans `run-seo-engine.sh` + alerte dans `seo-health-check` si dernier job quotidien > 48h. Vert (type-check/lint/297 tests). Reste : merge→deploy + Gabriel confirme/relance les crons VPS (SSH) et vérifie `curl .../seo-heartbeat`.

Rappel règle n°1 : l'outbound (60 agents prêts, email pro DNS désormais VALIDE) prime toujours sur le code. Le heartbeat était le 2e moteur, à ne pas laisser mourir.

## 2026-07-05 (suite) — Cause n°2 clôturée + 1er lot outbound en brouillons

Cause n°2 (moteur SEO mort en silence) : **clôturée, confirmée par Gabriel** (crons VPS relancés, heartbeat vivant). Reste en fond : re-mesurer la progression GSC dans les prochaines semaines.

Cause n°1 (acquisition jamais exécutée) : 1er pas concret. 20 messages (sur les 60 du kit) poussés en **brouillons Gmail**, prêts à relire/envoyer. 3 leads écartés du lot pour data sale (#4, #16 : ville vide dans `leads.csv` ; #30 : email catch-all), à corriger avant un prochain lot. Blocages avant envoi réel : (1) les brouillons sont dans le Gmail **personnel**, pas `contact@instadeco.app` (à reconfigurer en "envoyer en tant que" ou recréer depuis la boîte pro) ; (2) aucun visuel avant/après attaché (l'outil de création de brouillon ne gère pas les pièces jointes), à ajouter manuellement depuis `outbound-kit/` avant chaque envoi. DoD toujours en attente : 20 envois RÉELS loggés dans `suivi-pipeline.csv`.

## 2026-07-12 — Dernier verrou technique de l'outbound levé, kit régénéré

Cause n°1 (acquisition jamais exécutée), avancée concrète côté enabler :
- **PR #8 MERGÉE sur main (`c288858`) + déployée.** Pages visuelles avant/après hors i18n (`app/outbound/[slug]`). Vérifié en prod : `instadeco.app/outbound/salon-minimaliste` et `/salon-japandi` renvoient **200 sans redirection** sur l'URL exacte des emails (sans slash final), slug inconnu → 404, `noindex`. Un lien vers une VRAIE page (au lieu d'une pièce jointe ou d'un `.jpg` brut) supprime l'avertissement de redirection Gmail. C'était le dernier blocage technique avant envoi.
- **Kit régénéré** (`build-outbound-kit.ts`) : 60 leads avec email, 46 premium. `messages-remplis.md` pointe désormais vers la page visuelle hébergée, la mention « en pièce jointe » a disparu. Message type relu (opt-out présent, ton OK).
- **DoD toujours OUVERT** : 0 envoi RÉEL. Reste strictement côté Gabriel : (1) « envoyer en tant que » `contact@instadeco.app`, (2) envoyer les 20 premiers, (3) les logger dans `suivi-pipeline.csv`. Tant que ce n'est pas fait, les KPIs restent plats et la règle n°1 n'est pas honorée.

## 2026-07-12 (suite) — CAUSE N°1 AMORCÉE : premier envoi réel

- **18 emails ENVOYÉS** depuis `contact@instadeco.app` (les 18 premiers du kit, vérifiés en copie sur l'adresse de Gabriel). Loggés dans `outbound-kit/suivi-pipeline.csv` : `statut=envoye`, `date_envoi=2026-07-12`, `relance_48h=2026-07-14`. Restants : **42/60** `a_contacter`.
- **Premier signal d'acquisition du projet.** La règle n°1 (acquisition envoyée ET mesurée avant le code) est honorée pour la première fois depuis la revue fondatrice du 04/07. Cause n°1 du pré-mortem : passe de « JAMAIS exécutée » à « amorcée, en mesure ».
- À suivre : réponses / opt-out sur la boîte pro ; conversions `/fr/pro` attribuées via `utm_campaign=before-after` (GA/Pixel) ; **relance des 18 le 14/07** ; lot suivant (20) une fois la délivrabilité confirmée (boîte jeune, monter le volume progressivement, ne pas dumper les 42 d'un coup). Prochaine revue `growth-chief` à faire sur ces données qui bougent enfin.

## 2026-07-12 (suite 2) — 33 brouillons prêts + réconciliation

- **Réconciliation `suivi-pipeline.csv` sur la vérité du sent folder Gmail** : 18 envoyés le 12/07 + 2 le 05/07 (Valerie Charvy, Mark Johnston) = **20 contactés**. Corrige un marquage positionnel initial faux sur 5 lignes (Jeremy/Aude marqués envoyés à tort ; Olivia/Nathalie/Cesar oubliés).
- **33 brouillons créés dans `contact@instadeco.app`** pour le reste `valid` non contacté. **7 catch-all mis de côté** (délivrabilité incertaine, cohérent avec la pratique du 05/07) : Audrey Dobbie, Paul Vuerinckx, Maxime Verstappen, Louise King, Moraig Richardson, Nataliya Chernyak-Donskyy, Yannic Grangier.
- **Écart de forme résolu** : les 18 partis étaient en HTML soigné (ancre « un exemple concret ») pointant vers `salon-japandi.jpg` (image brute). Gabriel a choisi de refaire les 33 en HTML, mais pointant vers la nouvelle page `/outbound/salon-minimaliste` (l'amélioration du jour). Les 33 ont été recréés en HTML ; recréer vers le même destinataire+sujet a **remplacé** les 33 plain text (la liste Gmail faisant autorité, sans filtre, ne renvoie que 33 brouillons, tous HTML, un par destinataire, aucune page suivante). Donc pas de doublon, pas de double-envoi. NB : le search Gmail sur brouillons est défaillant ici (to:/contenu renvoient vide), fiable seulement l'opération `list`.
- **État final Gmail** : 33 brouillons HTML prêts dans `contact@instadeco.app`, 20 envoyés (18 le 12/07 + 2 le 05/07), 7 catch-all non draftés. Total kit 60 = 20 + 33 + 7.
- Cadence rappelée : 20/jour, relance 48h. Reste 33 à envoyer sur 2 jours.

## 2026-07-28 — PIVOT : outbound abandonné, cap organique + produit

Décision Gabriel (28/07) : **on arrête la prospection**. Focus = canaux organiques (SEO/pSEO,
AEO, outils gratuits, Pinterest dès que la clé API arrive, réseaux auto) + **rendre le produit
meilleur que les concurrents**. Pub payante (FB et autres) confirmée pour décembre 2026,
conforme au plan (0 pub avant déc., puis 1 000/mois).

Bilan outbound au moment du pivot (mesuré, pas supposé) :
- Les 33 brouillons ne sont JAMAIS partis (toujours en brouillons le 28/07). Seuls les 18 du
  12/07 ont été envoyés (+2 pilotes le 05/07). Le canal a donc été testé sur 18 emails, pas 51.
- Résultat des 18 : 0 bounce (délivrabilité OK), 1 réponse (5,5 %), 0 intéressé. Sur 18 envois,
  0 intéressé est dans la variance attendue (1 à 5 % de positifs en cold). Verdict statistique :
  canal NON testé, abandonné par choix de fondateur (exécution pénible, pas de constance), pas
  par preuve d'échec. Honnêteté du log : si un jour on relance, repartir de là.
- La réponse unique (conseillère iad, 13/07) a payé l'effort : « je dispose déjà de cette
  fonctionnalité dans mes outils ». Confirmé par l'étude concurrence : c'est HOQI (illimité
  19,99 €, contrats-cadres iad/Efficity/BSK/l'Adresse/ERA, rachetée par La Boîte Immo 12/2025).
- Signal produit préoccupant : dernière génération en base le 04/07 (16 j sans usage), l'unique
  abonné Pro (49 €, inscrit 18/06) n'a jamais généré → churn probable à l'échéance du 18/08.

Étude concurrence par les avis réels livrée : `docs/ETUDE_CONCURRENCE_AVIS_2026-07.md`
(2 agents de recherche, marchés EN + FR). Backlog produit dérivé des plaintes (P1 rendu raté
non décompté + re-roll, P2 conformité FR 1 clic, P3 retouche ciblée, P4 cohérence mobilier
multi-pièces, P5 désencombrement) + angle marketing « facturation honnête ».

## 2026-07-29 — P1 + P2 SHIPPÉS (PR #9 mergée, prod)

Premier livrable du pivot produit, dérivé direct de l'étude avis (plaintes n°5 et n°8) :
- **Re-roll gratuit** : un rendu jugé raté se rejoue 1 fois sans débit (bouton sous le
  résultat, validation stricte serveur, fail-closed, migration `parent_generation_id`
  appliquée). Aucun concurrent étudié ne l'offre.
- **Export conforme** : mention « Image virtuellement meublée · Photos non contractuelles »
  incrustée dans les pixels (rendu seul) + paire avant/après badgée AVANT/APRÈS. Angle
  différenciant vs HOQI : personne ne vend la conformité comme feature.
- CI verte (type-check, lint, 303 tests), compositions vérifiées visuellement, mergé `f2b10cb`.
- Prochaines briques du backlog : réécrire `/pro` + comparatif blog avec les différenciateurs
  réels (facturation honnête, raté non compté, export conforme) ; P3 retouche ciblée ;
  re-mesure GSC J+30 (échue depuis ~19/07) ; Pinterest dès que Gabriel fournit la clé API.

## 2026-07-29 (suite) — AUDIT de bout en bout : 1 faille CRITIQUE money fermée

Audit adversarial du chantier P1+P2 (2 relecteurs indépendants + vérification directe des
grants/policies en prod). PR #10 mergée (`0b007c8`), CI verte, 306 tests.

🔴 **CRITIQUE, confirmée exploitable, fermée** : `anon`/`authenticated` avaient INSERT/UPDATE
sur `generations` (policies d'origine du schéma). Inoffensif jusqu'ici, mais le re-roll en
faisait un robinet : forger via `/rest/v1` une fausse ligne `completed` (0 crédit) puis la
re-roller = **générations gratuites illimitées** (~14 400/jour/IP, ~360 €/jour de COGS face à
49 € de MRR). Vérifié : aucune écriture client sur la table, **0 re-roll en base = aucune
exploitation**. Migration `20260729_harden_generations_write_grants.sql` appliquée (REVOKE +
DROP des 2 policies d'écriture, SELECT conservé).

Autres correctifs : index `parent_generation_id` UNIQUE (course TOCTOU) ; remboursement zombie
d'un re-roll = crédit créé ex nihilo ; le re-roll acceptait photo/style ARBITRAIRES (remise de
50 % non voulue + fair-use contourné) donc il rejoue désormais le rendu DU PARENT et compte
dans le plafond ; bug UX bloquant (le polling ressuscitait l'ancien rendu pendant un re-roll,
loader/erreurs masqués) ; re-roll brûlé par un échec technique ; 2e email en double ; absence
de validation taille/magic-bytes sur `/api/v2/generate` (OOM par bombe de décompression) +
`limitInputPixels` sharp + EXIF + rate-limit sur `/api/v2/download`.

**Leçon à retenir** : la feature était correcte en soi, elle a rendu exploitable une
permissivité RLS dormante depuis la création du schéma. Toute nouvelle feature qui lit une
table pour décider d'un DÉBIT doit d'abord vérifier qui peut ÉCRIRE dans cette table.

## 2026-07-30 — CANAL OUTBOUND CLÔTURÉ (définitif)

Gabriel a envoyé les 33 brouillons restants (30/07 ~10h40, depuis `contact@instadeco.app`)
« vu que c'était préparé », puis **arrête le canal pour de bon**. Zéro brouillon restant.

Chiffres finaux de l'expérience outbound (source : dossier Envoyés Gmail, seule trace
restante depuis la purge RGPD du kit) :
- **53 prospects contactés** au total : 2 le 05/07, 18 le 12/07, 33 le 30/07.
- **1 réponse** (Alexia Sako, iad, 13/07) : « je dispose déjà de cette fonctionnalité dans
  mes outils » → c'est HOQI, cf. l'étude concurrence. Taux de réponse ~1,9 %.
- **1 bounce dur** (celia@genevahomes.ch, 550 5.2.1 adresse introuvable). Les 52 autres
  acceptés : la délivrabilité du domaine n'est pas en cause.
- **0 intéressé, 0 essai, 0 conversion** attribuée à l'outbound.

Statut : canal ABANDONNÉ par choix de fondateur (exécution pénible), pas par preuve
statistique (53 envois restent sous le seuil de 200 à 300 nécessaire pour juger). Ne pas
reproposer de relance sans demande explicite.

⚠️ **Vigilance qui SURVIT à l'arrêt** : 53 personnes ont reçu une promesse d'opt-out
(« répondez stop et je vous retire de ma liste »). Toute réponse « stop » doit être honorée,
et une réponse intéressée doit être traitée : arrêter d'émettre n'autorise pas à ignorer la
boîte `contact@instadeco.app`. Fenêtre utile de réponses : ~2 semaines (jusqu'au ~13/08).

Cap désormais 100 % organique : SEO/AEO, outils gratuits, Pinterest (clé à venir), produit
(re-roll gratuit + export conforme livrés), pub FB en décembre.
