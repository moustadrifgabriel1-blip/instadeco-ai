# 🔍 Diagnostic Essai Gratuit en Production

## 1. Vérifier le déploiement Vercel

1. Va sur https://vercel.com/ton-projet/deployments
2. Attends que le dernier déploiement soit **Ready** (vert)
3. Note l'URL de déploiement

---

## 2. Vérifier FAL_KEY sur Vercel

**CRITIQUE** : Sans cette variable, aucune génération ne marche.

1. Va sur https://vercel.com/ton-projet/settings/environment-variables
2. Cherche **FAL_KEY**
3. Vérifie :
   - ✅ Elle existe
   - ✅ Elle est configurée pour **Production**
   - ✅ Elle commence par quelque chose comme `6396afe3-...`

Si elle n'existe pas :
```
Variable name: FAL_KEY
Value: ta_cle_fal_ai_ici
Environments: Production, Preview, Development
```

**⚠️ Important** : Si tu ajoutes/modifies FAL_KEY, clique **Redeploy** sur le dernier déploiement.

---

## 3. Tester l'essai gratuit en prod

1. Va sur **ton-domaine.com/essai** (navigation privée pour éviter le cache)
2. **Ouvre la console** (F12 → Console)
3. Upload une photo (salon/chambre)
4. Choisis style + pièce
5. Clique "Générer"

**Regarde les logs dans la console** :
```
[Trial] 🚀 Starting generation: style=moderne, room=salon...
[Trial] 📡 Generate API response: { requestId: "..." }
[Trial] 🔄 Polling attempt 1/40 for requestId=...
[Trial] 📊 Status response: { status: "processing" }
...
```

---

## 4. Regarder les logs serveur Vercel

**Option A : Logs en temps réel**
1. Va sur https://vercel.com/ton-projet
2. Clique sur le dernier déploiement
3. Clique **Runtime Logs** (onglet)
4. Relance une génération
5. Tu verras :
```
[Trial] 🚀 Starting trial generation
[Trial] 🎨 Submitting to Fal.ai...
[Trial] ✅ Job submitted: abc123...
[Trial Status] 🔄 Polling attempt 1...
```

**Option B : Logs Function (après coup)**
1. Vercel Dashboard → **Logs**
2. Filtre par `/api/trial/generate` ou `/api/trial/status`
3. Regarde les erreurs en rouge

---

## 5. Problèmes courants

### ❌ "La génération a pris trop de temps"
**Cause** : Fal.ai met > 3min (queue pleine ou quota dépassé)
**Solution** : Vérifie le dashboard Fal.ai → Usage/Billing

### ❌ "requestId manquant"
**Cause** : FAL_KEY invalide ou manquante
**Solution** : Vérifie Variable Vercel + Redeploy

### ❌ "Image introuvable"
**Cause** : Fal.ai retourne `completed` mais sans URL d'image
**Solution** : Vérifie logs Vercel → API call fal.ai → Regarde la réponse

### ❌ Reste bloqué à 95%
**Maintenant** : Au bout de 50 polls (2min30), tu auras un vrai message d'erreur au lieu de rester bloqué

---

## 6. Vérifier que les corrections fonctionnent

Si ça bloque encore à 95%, regarde :

**Dans la console navigateur** :
- Le dernier log `[Trial]` → Quel est le numéro du poll ?
- Si > 50 → Tu devrais voir "❌ Polling timeout"

**Dans les logs Vercel** :
- Cherche `[Trial Status] ⏰ Timeout` → Tu verras combien de temps ça a pris
- Cherche `[Trial] ❌` → Tu verras l'erreur exacte

---

## 7. Test rapide de l'API

Si tu veux tester l'API directement :

```bash
# Test 1 : Génération (retourne un requestId)
curl -X POST https://ton-domaine.com/api/trial/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "roomType": "salon",
    "style": "moderne",
    "fingerprint": "test-curl"
  }'

# Test 2 : Status (remplace REQUEST_ID)
curl https://ton-domaine.com/api/trial/status?requestId=REQUEST_ID
```

---

## ✅ Checklist finale

- [ ] Déploiement Vercel terminé (vert)
- [ ] FAL_KEY configurée sur Vercel Production
- [ ] Test en navigation privée sur /essai
- [ ] Console navigateur ouverte pour voir les logs
- [ ] Logs Vercel Runtime ouverts en parallèle
- [ ] Photo uploadée + génération lancée
- [ ] Logs montrent requestId valide
- [ ] Attendre max 3min → Message d'erreur clair si timeout

---

**Si ça marche ✅** : Tu verras l'image générée après 20-60 secondes

**Si ça échoue ❌** : Tu auras maintenant un message d'erreur précis au lieu de rester bloqué

**Envoie-moi les logs si besoin** : Copie les logs `[Trial]` de la console + logs Vercel
