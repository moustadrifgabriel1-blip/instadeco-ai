# API V2 - Architecture Hexagonale

Cette nouvelle version de l'API utilise l'architecture hexagonale avec les Use Cases.

## Endpoints

### Générations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v2/generate` | Démarre une nouvelle génération |
| `GET` | `/api/v2/generations` | Liste les générations de l'utilisateur |
| `GET` | `/api/v2/generations/[id]/status` | Récupère le statut d'une génération |

### Crédits

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/v2/credits` | Récupère le solde de crédits |
| `GET` | `/api/v2/credits/history` | Historique des transactions |

### Paiements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v2/payments/create-checkout` | Crée une session d'achat de crédits |

### HD Unlock

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v2/hd-unlock/create-checkout` | Crée une session pour débloquer HD |
| `POST` | `/api/v2/hd-unlock/confirm` | Confirme le déblocage après paiement |

### Webhooks

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v2/webhooks/stripe` | Gère les webhooks Stripe |

---

## Exemples d'utilisation

### Générer une image

```bash
curl -X POST http://localhost:3000/api/v2/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "imageUrl": "data:image/jpeg;base64,...",
    "roomType": "salon",
    "style": "moderne"
  }'
```

### Récupérer les générations

```bash
curl "http://localhost:3000/api/v2/generations?userId=user_123&limit=20"
```

### Récupérer le solde de crédits

```bash
curl "http://localhost:3000/api/v2/credits?userId=user_123"
```

### Acheter des crédits

```bash
curl -X POST http://localhost:3000/api/v2/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "email": "user@example.com",
    "packId": "pack_25"
  }'
```

### Débloquer HD

```bash
curl -X POST http://localhost:3000/api/v2/hd-unlock/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "email": "user@example.com",
    "generationId": "gen_456"
  }'
```

---

## Migration depuis V1

L'ancienne API (dans `/api/`) reste disponible pour rétrocompatibilité.

Pour migrer vers V2 :

1. Changez le préfixe de `/api/` vers `/api/v2/`
2. Adaptez les formats de requête/réponse selon cette documentation
3. Gérez les nouveaux codes d'erreur structurés

## Architecture

```
app/api/v2/
├── generate/route.ts           → GenerateDesignUseCase
├── generations/
│   ├── route.ts               → ListUserGenerationsUseCase
│   └── [id]/status/route.ts   → GetGenerationStatusUseCase
├── credits/
│   ├── route.ts               → GetUserCreditsUseCase
│   └── history/route.ts       → GetCreditHistoryUseCase
├── payments/
│   └── create-checkout/route.ts → PurchaseCreditsUseCase
├── hd-unlock/
│   ├── create-checkout/route.ts → UnlockHDUseCase
│   └── confirm/route.ts        → ConfirmHDUnlockUseCase
└── webhooks/
    └── stripe/route.ts         → ProcessStripeWebhookUseCase
```

Les Use Cases sont injectés via le DI Container dans `src/infrastructure/config/di-container.ts`.
