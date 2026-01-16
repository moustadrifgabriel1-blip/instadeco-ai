# 🎨 Page Demo InstantDecor AI

## ✅ Ce qui a été créé

### 1. **Page Demo Complète** (`app/(marketing)/demo/page.tsx`)
- ✅ Upload d'image avec drag & drop (react-dropzone)
- ✅ Prévisualisation de l'image uploadée
- ✅ Appel à l'API Fal.ai pour génération
- ✅ Loader stylé avec barre de progression
- ✅ Affichage du résultat avec filigrane "DEMO"
- ✅ Bouton de téléchargement
- ✅ Bouton Stripe pour débloquer la version HD

### 2. **API Routes**

#### `/api/generate` (POST)
- Soumet une image à Fal.ai (Flux ControlNet)
- Retourne un `requestId` pour le polling
- Gère les erreurs et validations

#### `/api/generate/[id]/status` (GET)
- Vérifie le statut de la génération
- Polling toutes les 3 secondes
- Retourne l'image finale quand prête

#### `/api/unlock-image` (POST)
- Crée une session Stripe Checkout
- Prix: 4.99€ pour version HD sans filigrane
- Redirection vers Stripe

### 3. **Clients/Services**

#### `lib/ai/fal-client.ts`
- Client TypeScript pour Fal.ai
- Fonctions: `submitGeneration()`, `checkGenerationStatus()`, `getGenerationResult()`

#### `lib/payments/stripe.ts`
- Client Stripe réutilisable
- Fonction: `createCheckoutSession()`

---

## 🎨 Design & UX

### Features
- 🎯 Interface moderne avec Tailwind CSS
- 🌈 Gradients bleu/violet pour les boutons CTA
- ⚡ Animations fluides (Loader2 qui tourne)
- 📊 Barre de progression en temps réel
- 💎 Filigrane "DEMO" sur l'image
- 🔒 Call-to-action clair pour débloquer

### Layout
- **Colonne gauche:** Upload + Génération
- **Colonne droite:** Résultat + Actions
- **Responsive:** Adapté mobile/desktop

---

## 🚀 Comment tester

### 1. Variables d'environnement requises
```bash
# .env.local
FAL_API_KEY=fal_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Lancer le projet
```bash
npm run dev
# Aller sur http://localhost:3000/demo
```

### 3. Workflow utilisateur
1. **Upload** une image de pièce
2. Cliquer sur **"Générer la décoration"**
3. Voir le **loader animé** (3-30 secondes)
4. Voir le **résultat avec filigrane**
5. Cliquer sur **"Débloquer HD (4.99€)"**
6. Payer sur **Stripe**
7. Recevoir l'image HD

---

## 🔧 Intégration Fal.ai

### Modèle utilisé
- **Flux Pro v1.1 Ultra** avec ControlNet
- Mode: `canny` (détection des contours)
- Steps: 28 (qualité optimale)
- Guidance: 3.5

### Flux de génération
```
1. User upload image
   ↓
2. Convert to base64
   ↓
3. POST /api/generate
   ↓
4. Fal.ai submit → requestId
   ↓
5. Poll /api/generate/[id]/status (3s)
   ↓
6. Status: IN_PROGRESS (0-95%)
   ↓
7. Status: COMPLETED → URL image
   ↓
8. Display result
```

---

## 💳 Intégration Stripe

### Prix
- **4.99€** pour débloquer la version HD
- Mode: `payment` (one-time)
- Produit: "Image HD sans filigrane"

### Webhook (à ajouter)
Pour valider le paiement et débloquer réellement l'image :
```typescript
// app/api/payments/webhook/route.ts
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  
  if (event.type === 'checkout.session.completed') {
    const generationId = event.data.object.metadata.generationId;
    // → Marquer l'image comme débloquée dans Firestore
  }
}
```

---

## 🎯 Prochaines améliorations

### Court terme
- [ ] Ajouter webhook Stripe pour valider paiement
- [ ] Stocker générations dans Firestore
- [ ] Ajouter authentification Firebase
- [ ] Sélecteur de styles de décoration

### Moyen terme
- [ ] Historique des générations
- [ ] Partage social
- [ ] Comparaison avant/après (slider)
- [ ] Export en PDF

### Long terme
- [ ] Génération multi-angles
- [ ] IA de recommandations
- [ ] Marketplace de styles

---

## 📁 Fichiers créés

```
app/
  (marketing)/demo/
    page.tsx          # Page principale
    layout.tsx        # Layout
  api/
    generate/
      route.ts        # Soumission génération
      [id]/status/route.ts  # Polling statut
    unlock-image/
      route.ts        # Stripe checkout
lib/
  ai/
    fal-client.ts     # Client Fal.ai
  payments/
    stripe.ts         # Client Stripe
```

---

## 🔗 Liens utiles

- **Page démo:** [http://localhost:3000/demo](http://localhost:3000/demo)
- **Fal.ai Docs:** https://fal.ai/docs
- **Stripe Docs:** https://stripe.com/docs/payments/checkout

---

**La page est prête ! Testez-la dès maintenant ! 🚀**
