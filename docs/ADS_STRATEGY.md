# 🎯 Stratégie Ads Facebook/Instagram — InstaDeco
> **Rôle :** Directeur de Stratégie Media Buyer — Budget 100€ / mois 1
> **Contexte :** Page FB + page Insta existantes. Tout est à configurer from scratch.

---

## 📌 ANALYSE DU PROJET (Points forts à mettre en avant)

**Ce qui vend :**
- Transformation visuelle instantanée (Avant/Après = format le plus viral en déco)
- Prix d'entrée bas (crédits) → friction ultra faible
- Résultat en quelques secondes → promesse claire et démontrable
- Pas besoin d'architecte, pas besoin de budget travaux → aspiration accessible

**Ce qu'on NE met PAS en avant dans les pubs :**
- La tech (Flux.1, ControlNet, IA) → les gens s'en foutent
- Le nombre de crédits → trop compliqué
- Le mot "SaaS" → trop froid

**Proposition de valeur pub :**
> *"Vois ta pièce transformée en 10 secondes — sans travaux, sans architecte."*

---

## 🚨 ÉTAPE 0 — AVANT TOUTE PUB : Configurer le tracking (OBLIGATOIRE)

Sans ça, Facebook est aveugle. Tu jettes 100€ par la fenêtre.

### Étape 0.1 — Créer le Meta Pixel
1. Va sur [business.facebook.com](https://business.facebook.com)
2. Menu → **Gestionnaire d'événements** → **Connecter des sources de données** → **Web**
3. Choisis **Meta Pixel** → donne-lui un nom : `InstaDeco Pixel`
4. Entre l'URL : `https://instadeco.app`
5. Copie ton **Pixel ID** (format : `XXXXXXXXXXXXXXXXXX`)

### Étape 0.2 — Configurer la Conversions API (CAPI)
La CAPI envoie les événements côté serveur → contourne les bloqueurs de pubs et iOS 14.

**Variable d'env à ajouter dans Vercel :**
```
META_PIXEL_ID=ton_pixel_id
META_CAPI_TOKEN=ton_token_accès_capi
```

**Événements à tracker en priorité :**
| Événement Meta | Déclencheur sur InstaDeco |
|---|---|
| `PageView` | Toutes les pages |
| `ViewContent` | Arrivée sur `/generate` |
| `InitiateCheckout` | Clic "Acheter des crédits" |
| `Purchase` | Paiement Stripe confirmé |
| `CompleteRegistration` | Création de compte |

### Étape 0.3 — Vérifier avec Meta Pixel Helper
- Installe l'extension Chrome : **Meta Pixel Helper**
- Navigue sur instadeco.app → vérifie que les événements se déclenchent en vert

---

## 🎬 STRATÉGIE CRÉATIVE — 3 Concepts Vidéos UGC Viraux

### Concept 1 — "Le Before/After Choc" ⚡ (Potentiel viral : MAXIMUM)
**Format :** Vidéo Avant/Après générée par le script `avant_apres_video.py`
**Hook :** *"L'IA a transformé cette chambre vide en 8 secondes 🤯"*
**Script :**
- 0-2s : Image AVANT (pièce vide/moche) — texte "AVANT" en grand
- 2-5s : Transition slider → révélation
- 5-8s : Image APRÈS (pièce transformée) — texte "APRES"
- Overlay final 1s : *"Essaie avec ta propre pièce → instadeco.app"*

**CTA fin de vidéo :** "Essaie GRATUITEMENT →"
**Ton :** Pas de voix. Musique satisfaisante. Laisser l'image parler.

---

### Concept 2 — "Le POV Screen Recording" 📱 (Potentiel viral : FORT)
**Format :** Enregistrement écran iPhone/Mac montrant l'utilisation réelle
**Hook :** *"POV : tu redécore ta chambre sans dépenser 1€"*
**Script :**
- 0-2s : écran avec une photo prise au téléphone d'une vraie pièce
- 2-4s : glissement sur instadeco.app, upload de la photo
- 4-7s : barre de chargement "Génération en cours..."
- 7-8s : résultat apparaît → zoom in sur le résultat
- Texte : *"Et c'est gratuit pour commencer"*

**Ce qui rend ça viral :** C'est "authentique", pas une pub — ressemble à un vrai screenshot TikTok

---

### Concept 3 — "Le Testimonial UGC Décalé" 🗣️ (Potentiel viral : BON)
**Format :** Selfie caméra, ton relax, durée 15s max
**Hook :** *"J'ai testé cette appli IA de déco... voilà ce que ça donne"*
**Script (à lire face caméra) :**
> *"Alors j'avais cette chambre qui ressemblait à rien... J'ai testé InstaDeco, j'ai pris une photo, et en 10 secondes l'IA m'a proposé ça [montrer écran]. Franchement je savais pas que c'était possible. Le lien est dans la bio."*

**Clé :** Parler normalement, pas de voix "pub". Vêtements normaux. Pas de fond blanc.

---

## ⚙️ PARAMÉTRAGE ADS MANAGER — Clic par Clic

### Structure de Campagne recommandée (avec 100€)

```
CAMPAGNE (CBO — Budget Campagne Optimisé)
└── Budget : 5€/jour
    ├── Ensemble de pubs 1 — "Broad France" (large)
    │   ├── Créative A : Concept 1 (Avant/Après)
    │   └── Créative B : Concept 2 (Screen Recording)
    └── Ensemble de pubs 2 — "Intérêts Déco"
        ├── Créative A : Concept 1
        └── Créative C : Concept 3 (UGC)
```

### Étape 1 — Créer la campagne
1. Ads Manager → **Créer**
2. Objectif : **Ventes** (pas "Trafic", pas "Notoriété")
3. Nom : `[InstaDeco] Ventes — Mois 1`
4. **Budget de campagne (CBO)** : `5€/jour`
5. Stratégie d'enchères : **Coût le plus bas** (laisser Facebook optimiser)

### Étape 2 — Ensemble de pubs 1 (Broad)
1. Nom : `[Broad] France 25-45`
2. **Pixel :** Sélectionner `InstaDeco Pixel`
3. **Événement de conversion :** `Purchase`
4. **Localisation :** France
5. **Âge :** 25-45 ans
6. **Sexe :** Tous (mais surveiller — les femmes convertissent mieux en déco)
7. **Intérêts :** LAISSER VIDE → Advantage+ audience (Broad = Facebook choisit)
8. **Placements :** Advantage+ (laisse Meta choisir) → sauf si budget < 10€/j, alors : Reels uniquement

### Étape 3 — Ensemble de pubs 2 (Intérêts)
Même config que ci-dessus SAUF intérêts :
- Décoration intérieure
- Architecture intérieure
- IKEA / Maisons du Monde / Leroy Merlin
- Home staging
- Rénovation maison

### Étape 4 — Créatives
Pour chaque créative :
1. Format : **Vidéo verticale** (9:16 — 1080×1920) ← ton script génère déjà ça ✅
2. Texte principal : *"Vois ta pièce transformée par l'IA en quelques secondes. Essaie gratuitement sur instadeco.app"*
3. Titre : *"Déco IA — Résultat instantané"*
4. CTA : **"En savoir plus"** (pas "Acheter" — moins de friction)
5. URL destination : `https://instadeco.app/generate`

---

## 💰 RÉPARTITION DU BUDGET 100€

| Phase | Budget | Durée | Objectif |
|---|---|---|---|
| **Phase 1 — Test créatives** | 40€ | J1-J8 | Identifier quelle vidéo performe (5€/j) |
| **Phase 2 — Scale winner** | 40€ | J9-J16 | Doubler le budget sur la meilleure créative |
| **Phase 3 — Retargeting** | 20€ | J17-J30 | Recibler les visiteurs qui n'ont pas acheté |

### Règles d'arrêt (STOP une créa si) :
- CPC > 0,80€ après 300 impressions → couper
- CTR < 1% après 500 impressions → couper
- CPM > 12€ → mauvaise audience, changer

### Règles de scale (AUGMENTER si) :
- ROAS > 2 (chaque 1€ dépensé = 2€ de revenu)
- CPL (coût par lead) < 1,50€
- CTR > 2,5%

---

## 🔁 RETARGETING Phase 3 (20€)

**Audience :** Personnes ayant visité instadeco.app les 14 derniers jours SANS acheter
1. Ads Manager → Audiences → **Créer une audience personnalisée**
2. Source : **Site web**
3. Événement : `ViewContent` MAIS PAS `Purchase`
4. Fenêtre : 14 jours
5. Nom : `Visiteurs sans achat 14j`

**Message retargeting :**
> *"T'as vu la transformation mais pas encore essayé ? Tes premiers crédits sont offerts. →"*

---

## 📊 KPIs à surveiller chaque matin

| Métrique | Objectif mois 1 | Alerte si |
|---|---|---|
| CPM (coût 1000 impr.) | < 8€ | > 15€ |
| CTR (taux de clic) | > 2% | < 1% |
| CPC (coût par clic) | < 0,40€ | > 0,80€ |
| Taux de conversion landing | > 3% | < 1,5% |
| CAC (coût acquisition client) | < 15€ | > 25€ |
| ROAS | > 2x | < 1x |

---

## ✅ CHECKLIST LANCEMENT (dans l'ordre)

- [x] **0.1** Meta Pixel créé et ID récupéré ✅
- [x] **0.2** Variables META_PIXEL_ID + META_CAPI_TOKEN dans Vercel ✅
- [x] **0.3** Pixel Helper → événements verts sur instadeco.app ✅
- [x] **1** Générer 3 vidéos avec le script `avant_apres_video.py` (Concept 1) ✅
- [x] **2** Enregistrer 1 screen recording (Concept 2) ✅
- [x] **3** Créer la campagne dans Ads Manager ✅
- [x] **4** Uploader les créatives ✅
- [x] **5** **LANCÉ le 2 mars 2026** — Budget initial : 150€ ✅
- [ ] **6** J8 (10 mars) : couper les créatives perdantes, doubler le winner
- [ ] **7** J17 (19 mars) : activer le retargeting

---

## 📊 JOURNAL DE CAMPAGNE

### Campagne 1 — Lancée le 2 mars 2026
- **Budget total :** 150€
- **Statut :** 🟢 Active depuis le 2 mars 2026
- **Prochaine action :** Analyser les premiers KPIs le 5 mars (J3)

---

## 🔗 Ressources
- Ads Manager : https://www.facebook.com/adsmanager
- Gestionnaire d'événements : https://business.facebook.com/events_manager
- Meta Pixel Helper (Chrome) : Chercher dans le Chrome Web Store
- Page FB InstaDeco : à lier dans le Business Manager
- Page Insta InstaDeco : à lier dans le Business Manager

---

*Dernière mise à jour : 3 mars 2026*
*Budget campagne 1 : 150€ | Objectif CAC cible : < 15€ | ROAS cible : 2x*
