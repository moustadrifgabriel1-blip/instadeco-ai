# 🔄 Migration Fal.ai → Replicate.ai

**Date:** 16 janvier 2026  
**Raison:** Économie de ~50% sur les coûts de génération

---

## ✅ Modifications Effectuées

### 1. **Installation du SDK Replicate**
```bash
npm install replicate
```

### 2. **Client AI mis à jour**
- Fichier: `lib/ai/fal-client.ts`
- Remplacé les appels Fal.ai par Replicate SDK
- Modèle utilisé: `black-forest-labs/flux-canny-pro` (Flux.1 + ControlNet)

### 3. **API Routes adaptées**
- `app/api/generate/route.ts`: Utilise `REPLICATE_API_TOKEN`
- `app/api/generate/[id]/status/route.ts`: Polling via Replicate SDK

### 4. **Variables d'environnement**
- `.env.local`: Remplacé `FAL_API_KEY` par `REPLICATE_API_TOKEN`

---

## 🔑 Configuration Requise

### Obtenir votre clé API Replicate

1. Aller sur https://replicate.com
2. Créer un compte (gratuit)
3. Aller dans **Account → API Tokens**
4. Cliquer sur **Create Token**
5. Copier le token généré

### Ajouter la clé dans `.env.local`

```bash
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 💰 Économies Réalisées

| Métrique | Fal.ai | Replicate | Économie |
|----------|--------|-----------|----------|
| **Prix/image** | $0.05-0.08 | $0.01-0.03 | **50-60%** |
| **1 000 images** | $50-80 | $10-30 | **$40-50** |
| **10 000 images** | $500-800 | $100-300 | **$400-500** |

---

## 🧪 Tester la Migration

### 1. Ajouter votre clé Replicate
```bash
# .env.local
REPLICATE_API_TOKEN=r8_votre_cle_ici
```

### 2. Relancer le serveur
```bash
npm run dev
```

### 3. Tester sur la démo
```
http://localhost:3000/demo
```

### 4. Vérifier les logs
```
[Replicate] Submitting generation with prompt: ...
[Replicate] Prediction created: abc123...
[Replicate] Status: succeeded
```

---

## 🔧 Différences Techniques

| Aspect | Fal.ai | Replicate |
|--------|--------|-----------|
| **Auth** | API Key dans header | SDK avec token |
| **Polling** | Endpoints REST | SDK `.predictions.get()` |
| **Format sortie** | `images[0].url` | `output` (array ou string) |
| **Statuts** | `IN_QUEUE`, `COMPLETED` | `starting`, `succeeded` |
| **Webhook** | ✅ Supporté | ✅ Supporté |

---

## ⚠️ Points d'Attention

### Cold Start
Replicate peut avoir un **cold start** de 10-20s pour la première requête.
- Solution: Garder le modèle "chaud" avec un keepalive

### Rate Limits
- **Free tier:** 50 requêtes/min
- **Pro tier:** 500 requêtes/min

### Format d'image
L'image source doit être en **base64** ou **URL publique**.

---

## 🚀 Rollback (si nécessaire)

Si vous voulez revenir à Fal.ai :

```bash
# 1. Réinstaller @fal-ai/client (si supprimé)
npm install @fal-ai/serverless-client

# 2. Restaurer .env.local
FAL_API_KEY=your_fal_key

# 3. Git checkout du fichier client
git checkout lib/ai/fal-client.ts
```

---

## 📊 Monitoring

### Vérifier l'utilisation

Dashboard Replicate: https://replicate.com/account/billing

### Logs à surveiller
```bash
# Voir les logs en temps réel
tail -f .next/server-log.txt | grep Replicate
```

---

## ✨ Prochaines Optimisations

1. **Mettre en cache les predictions** (éviter double polling)
2. **Webhooks Replicate** (push au lieu de poll)
3. **Batch predictions** (générer plusieurs images en parallèle)

---

**✅ Migration terminée !** Vous économisez maintenant ~50% sur chaque génération. 🎉
