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
