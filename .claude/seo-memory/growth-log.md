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
