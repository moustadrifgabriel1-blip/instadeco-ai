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
