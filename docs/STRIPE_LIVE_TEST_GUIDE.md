# Guide : Passer Stripe en Mode LIVE pour Test d'Achat

## ⚠️ Important
Tu vas tester avec ta vraie carte → L'argent sera débité puis remboursé (tu perds ~2% de fees Stripe).

---

## 🔧 Étapes pour activer Stripe LIVE

### 1. Récupérer les clés LIVE dans Stripe Dashboard

1. Va sur https://dashboard.stripe.com
2. **Passe en mode LIVE** (toggle en haut à droite)
3. Va dans **Developers** → **API Keys**
4. Copie :
   - **Publishable key** (commence par `pk_live_...`)
   - **Secret key** (commence par `sk_live_...`)

### 2. Créer les Price IDs en mode LIVE

1. Va dans **Products** → Créer 4 produits :
   
   **Pack Starter (10 crédits)**
   - Nom : "Pack Starter - 10 crédits"
   - Prix : 9.99 EUR
   - Type : One-time payment
   - Copie le Price ID (commence par `price_...`)
   
   **Pack Pro (25 crédits)**
   - Nom : "Pack Pro - 25 crédits"
   - Prix : 24.99 EUR
   - Copie le Price ID
   
   **Pack Unlimited (50 crédits)**
   - Nom : "Pack Unlimited - 50 crédits"
   - Prix : 69.99 EUR
   - Copie le Price ID
   
   **Pack 100 (100 crédits)** — OPTIONNEL
   - Nom : "Pack Premium - 100 crédits"
   - Prix : 99.99 EUR
   - Copie le Price ID

### 3. Enregistrer le Webhook en mode LIVE

1. **Developers** → **Webhooks** → **Add endpoint**
2. URL : `https://ton-domaine.vercel.app/api/v2/webhooks/stripe`
3. **Events à écouter** :
   - ✅ `checkout.session.completed`
4. Clique **Add endpoint**
5. Clique sur le webhook créé → **Reveal signing secret**
6. Copie le secret (commence par `whsec_...`)

### 4. Configurer les variables sur Vercel

Va sur https://vercel.com → Ton projet → **Settings** → **Environment Variables**

**Remplace** (ou ajoute) ces variables en mode **Production** :

```env
# Clés Stripe LIVE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXX

# Price IDs LIVE
STRIPE_PRICE_STARTER=price_XXXXXXXXX
STRIPE_PRICE_PRO=price_XXXXXXXXX
STRIPE_PRICE_UNLIMITED=price_XXXXXXXXX
STRIPE_PRICE_100_CREDITS=price_XXXXXXXXX
```

**⚠️ Important** : Clique sur **"Production"** pour chaque variable, puis **Save**.

### 5. Redéployer

```bash
# Dans ton terminal local
git add .
git commit -m "chore: switch to Stripe LIVE mode"
git push
```

Ou force un redéploiement depuis Vercel Dashboard → **Deployments** → **Redeploy**.

---

## 🧪 Tester l'Achat

1. Va sur **ton site en production** (https://ton-domaine.vercel.app)
2. Connecte-toi (ou inscris-toi)
3. Va sur `/pricing`
4. Clique sur "Acheter" (Pack Starter par exemple)
5. **Utilise ta vraie carte**
6. Tu seras redirigé vers `/credits/success?session_id=cs_xxx`
7. Vérifie que :
   - ✅ La page affiche "Paiement réussi"
   - ✅ Ton solde de crédits a augmenté (ex: "Vous avez maintenant 13 crédits")
   - ✅ Dans Stripe Dashboard → **Payments**, tu vois la transaction avec statut **succeeded**

---

## 🔄 Annuler le paiement test (Remboursement)

1. Va dans Stripe Dashboard → **Payments**
2. Clique sur la transaction que tu viens de faire
3. Clique **Refund** (en haut à droite)
4. Clique **Refund XX.XX EUR**
5. Tu récupères l'argent dans 5-10 jours (mais Stripe garde les fees ~2%)

---

## 🔙 Revenir en mode TEST après le test

Si tu veux repasser en test local :

```bash
# .env.local (pour tester en local avec cartes test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

Sur Vercel, tu peux aussi créer des **Preview variables** séparées des **Production variables**.

---

## ✅ Checklist finale avant test LIVE

- [ ] Clés Stripe LIVE configurées sur Vercel (Production)
- [ ] 4 Price IDs créés en mode LIVE
- [ ] Webhook enregistré avec l'URL de production
- [ ] STRIPE_WEBHOOK_SECRET copié dans Vercel
- [ ] Site redéployé après changement des variables
- [ ] Cookie banner mis à jour (✅ fait)
- [ ] Redirect vers /credits/success (✅ fait)
- [ ] Tu es prêt à perdre 2% de fees 😄

---

**Estimation du coût du test** :
- Pack Starter (9.99€) → Fees Stripe : ~0.25€ + 1.4% = **~0.39€ perdus**
- Tu récupères 9.60€ après remboursement

Bonne chance ! 🚀
