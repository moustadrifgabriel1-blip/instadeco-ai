# Pré-mortem InstaDeco, objectif 1M CHF/EUR de MRR (2031)

Mis à jour : 04/07/2026. Exercice : nous sommes en 2031, le projet est MORT sans avoir approché le million. Pourquoi ? Chaque cause est classée par probabilité × impact, avec la parade et le signal d'alerte à surveiller.

## Baseline réelle au 04/07/2026 (mesurée en base, pas estimée)

| Métrique | Valeur |
|---|---|
| Utilisateurs inscrits | 21 (dont 5 sur 30 j) |
| Abonnés Pro actifs | 1 (≈49 € MRR) |
| Achats de crédits (one-shot) | 0 depuis toujours |
| Essais gratuits / 30 j | 4 |
| Générations complétées / 30 j | 43 |
| Leads email | 16 |
| SEO (28 j, mesure 22/06) | 7 clics, 305 impressions, pos. 18,5 |
| Budget pub | 0 jusqu'à déc. 2026, puis 1 000/mois |

Lecture honnête : le produit, le tunnel de paiement et l'infra marchent. **Le problème unique est l'acquisition : personne ne voit le produit.** Objectif = ×20 000 en 5-7 ans. Faisable uniquement si les moteurs composés (SEO, bouche-à-oreille pro, rétention) démarrent en 2026-2027.

## Causes de mort classées

### 🔴 CAUSE N°1 : l'acquisition n'a jamais vraiment été exécutée (probabilité très haute, impact fatal)
Le pattern observé depuis mars : on améliore le site, les agents, le funnel, la sécurité, le SEO on-site. Tout est prêt. Mais **l'outbound (levier n°1 identifié dès M4) n'a envoyé quasiment aucun email**, le kit de 60 agents dort dans `outbound-kit/`, et 4 essais/mois = personne n'entre dans le funnel. En 2031, on aura le plus beau funnel du monde avec 40 utilisateurs.
- **Parade** : quota d'exécution hebdo NON NÉGOCIABLE : 20 emails outbound/jour ouvré (100/sem), mesurés dans un log. Le code ne prime JAMAIS sur l'envoi. Chaque session Claude commence par « combien d'emails sont partis cette semaine ? ».
- **Signal d'alerte** : une semaine avec 0 outbound envoyé = alarme rouge.

### 🔴 CAUSE N°2 : le moteur SEO tourne à vide ou s'est arrêté sans que personne ne s'en aperçoive (probabilité haute, impact majeur)
Constat de l'audit du 04/07 : aucun rapport seo-engine depuis le 18/06 alors que les crons VPS étaient « LIVE » depuis le 17/06. Le scoreboard était figé et `seo-chief` aurait lu des données de 2 semaines. Un moteur d'automatisation qui meurt en silence = des mois de croissance composée perdus.
- **Parade** : heartbeat obligatoire : chaque cron notifie son succès/échec (digest hebdo déjà en place, y ajouter un « dernier run » par job + alerte si > 48 h). Vérifier le VPS ce mois-ci.
- **Signal** : `reports/` sans fichier daté de < 7 jours.

### 🔴 CAUSE N°3 : mono-fondateur, burn-out ou abandon (probabilité moyenne-haute, impact fatal)
5-7 ans de constance sur un side-project avec 49 € de MRR pendant les 12 premiers mois, c'est la vallée de la mort psychologique. La plupart des projets meurent là, pas d'un bug.
- **Parade** : jalons de MRR petits et fréquents (voir plan), rituels courts (1 h/jour d'acquisition > 8 h/weekend de code), automatiser tout ce qui est répétitif, célébrer chaque abonné.
- **Signal** : 2 semaines sans aucune action projet.

### 🟠 CAUSE N°4 : dépendance à un canal unique qui casse (probabilité moyenne, impact majeur)
Tout mise sur Google SEO. Un core update, la montée des AI Overviews qui gardent le trafic chez Google, et le canal s'effondre. Idem pour la dépendance Gemini (génération) : hausse de prix ou dégradation qualité = COGS et produit touchés.
- **Parade** : dès 2027, 3 canaux minimum (SEO + outbound + partenariats/portails immo). AEO/GEO déjà travaillé (llms.txt, schema). Provider d'images swappable (factory FAL/Gemini déjà en place, garder les deux clés valides).
- **Signal** : > 70 % des signups d'un seul canal après 2027.

### 🟠 CAUSE N°5 : churn invisible, le seau percé (probabilité moyenne, impact majeur)
On sait acquérir mais les abonnés partent en 2-3 mois (les agents immo testent, meublent leur stock d'annonces, puis annulent). Avec 5 % de churn mensuel, 1M MRR exige des volumes d'acquisition intenables ; avec 2,5 %, c'est faisable.
- **Parade** : produit « habituel » et non « one-shot » : nouveaux styles réguliers, multi-sièges Agence, intégrations portails (export SeLoger/Immoweb), rapports mensuels d'usage envoyés aux abonnés. Mesurer le churn dès le 10e abonné.
- **Signal** : churn mensuel > 4 % passé 50 abonnés.

### 🟠 CAUSE N°6 : pénalité Google par impatience (probabilité moyenne si indiscipline, impact majeur)
La tentation de générer 500 pages/outils à la chaîne pour aller plus vite. Scaled content abuse = désindexation = mort du canal principal pendant 6-12 mois.
- **Parade** : le garde-fou du CLAUDE.md est NON NÉGOCIABLE. Publication lente, gates qualité, noindex par défaut. L'automatisation porte sur l'OPTIMISATION de l'existant, jamais sur la mass-génération.
- **Signal** : toute proposition de « générer N pages d'un coup » avec N > 15/jour.

### 🟡 CAUSE N°7 : COGS ou coûts d'infra qui dérapent à l'échelle (probabilité basse-moyenne, impact moyen)
À 1M MRR ≈ 15-20k abonnés ≈ 300k-1M générations/mois. À ~0,025 €/image ça tient (marge ~96 %), mais un abonné « illimité » abusif ou un prix Gemini qui triple change l'équation. Storage Supabase non backupé = perte d'images clients.
- **Parade** : fair-use enforced (déjà fait, 1000/30 j), monitoring COGS mensuel, backup storage S3 nocturne (chantier structure #3), renégocier/multi-provider à 10k générations/mois.
- **Signal** : COGS > 15 % du MRR.

### 🟡 CAUSE N°8 : la base de code se sclérose (probabilité basse, impact moyen)
Audit structure : B+/A-. Le vrai risque n'est pas l'architecture (clean, DI, swappable) mais les god files (pricing 1069 LoC, generate 973, essai 733 avec 50 % de duplication) et l'absence de tests sécurité/E2E : chaque évolution du funnel devient lente et risquée, précisément sur les pages qui font l'argent.
- **Parade** : les 5 chantiers de l'audit structure (extraction god files, tests auth/RLS/idempotence, backup, pagination, E2E smoke) répartis sur 2026-2027, PAS tout de suite (l'acquisition prime).
- **Signal** : une régression prod sur /pro, /pricing ou /generate.

### 🟡 CAUSE N°9 : le marché est trop petit ou l'offre mal pricée (probabilité basse, impact structurel)
FR+BE+CH romande ≈ 40-60k agences, x2-4 agents/agence. À 49 €/mois, 1M MRR = ~20k abonnés = 15-25 % de pénétration du marché francophone : trop. Le million EXIGE donc soit l'international (DE/EN dès 2028), soit un ARPU plus haut (Agence 99 €, plans plus gros, API), soit les deux.
- **Parade** : intégrée au plan (expansion DE/EN 2028, offre API/intégrations 2029, montée ARPU). Les fondations i18n existent déjà (3 locales).
- **Signal** : plateau de croissance FR avec CAC qui monte, avant 100k MRR.

### 🟡 CAUSE N°10 : un concurrent mieux financé rafle le marché (probabilité moyenne, impact moyen)
Le home staging virtuel IA a des barrières faibles (les modèles sont accessibles à tous). Un acteur US/DE avec 5M de levée peut acheter le marché à coups d'ads.
- **Parade** : jouer ce que l'argent n'achète pas vite : la niche francophone (BE/CH juridique et culturel), la relation directe agences, la marque locale, le SEO ancien. Ne pas jouer la guerre des features, jouer la distribution de proximité.
- **Signal** : un concurrent visible dans les SERP françaises de marque/génériques.

## Ce que le pré-mortem impose au plan
1. **L'acquisition est LA priorité n°1 de chaque semaine** jusqu'à 10k MRR. Le code passe après.
2. Tout moteur automatisé a un **heartbeat vérifiable** (sinon il est réputé mort).
3. **3 canaux** avant fin 2027.
4. Rétention travaillée dès le 10e abonné (le seau avant le robinet).
5. Discipline Google absolue (lent et propre bat rapide et mort).
6. Les chantiers techniques sont séquencés APRÈS les jalons de revenu, sauf sécurité paiement.
