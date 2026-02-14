# Architecture de Génération d'Images — InstaDeco

> **⚠️ DOCUMENT DE RÉFÉRENCE — NE PAS IGNORER**  
> Ce document décrit l'architecture **validée et fonctionnelle** de la génération d'images.  
> Dernière validation : **14 février 2026** (build OK, TypeScript OK, lint OK, prod OK).  
> **Si ça marche, on ne touche plus.**

---

## Table des Matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Les 2 Flows de Génération](#les-2-flows-de-génération)
3. [Fichiers Critiques — NE PAS MODIFIER](#fichiers-critiques--ne-pas-modifier)
4. [Pourquoi fal.run() et PAS fal.queue](#pourquoi-falrun-et-pas-falqueue)
5. [Pipeline Détaillé — Flow Trial](#pipeline-détaillé--flow-trial)
6. [Pipeline Détaillé — Flow Authentifié](#pipeline-détaillé--flow-authentifié)
7. [Gestion des Erreurs](#gestion-des-erreurs)
8. [Paramètres Fal.ai](#paramètres-falai)
9. [Code Déprécié](#code-déprécié)
10. [Règles pour les Futures Modifications](#règles-pour-les-futures-modifications)
11. [Troubleshooting](#troubleshooting)

---

## Résumé Exécutif

InstaDeco utilise **Fal.ai** avec le modèle `fal-ai/flux-general/image-to-image` pour transformer des photos d'intérieur.

**Architecture : SYNCHRONE via `fal.run()`**

```
Client → API Route → fal.storage.upload(image) → fal.run(model) → retourne imageUrl → Client
                              ↕                           ↕
                        ~1s upload                   ~10-20s génération
```

Pas de queue. Pas de polling vers fal.ai. Pas de webhook. Le résultat est retourné directement.

---

## Les 2 Flows de Génération

### Flow 1 : Essai Gratuit (`/essai`)

| Étape | Composant | Rôle |
|-------|-----------|------|
| Client | `app/(marketing)/essai/page.tsx` | UI, upload image, affichage résultat |
| API | `app/api/trial/generate/route.ts` | Anti-abus + appel fal.ai |
| IA | `fal.run()` directement dans la route | Génération synchrone |

**Pas d'authentification. Pas de crédits. Anti-abus 3 couches.**

### Flow 2 : Authentifié (`/generate`)

| Étape | Composant | Rôle |
|-------|-----------|------|
| Client | `app/(marketing)/generate/page.tsx` | UI complète avec modes de transformation |
| Hook | `src/presentation/hooks/useGenerate.ts` | Conversion base64, appel API |
| Hook | `src/presentation/hooks/useGenerationStatus.ts` | Polling de confirmation (lecture DB) |
| API Client | `src/presentation/api/client.ts` | Appels HTTP vers `/api/v2/` |
| API Route | `app/api/v2/generate/route.ts` | Auth, validation, appel use case |
| Use Case | `src/application/use-cases/generation/GenerateDesignUseCase.ts` | Orchestration complète |
| Service | `src/infrastructure/services/fal/FalImageGeneratorService.ts` | Appel fal.ai |
| Storage | `src/infrastructure/services/supabase/SupabaseStorageService.ts` | Upload images |
| Polling API | `app/api/v2/generations/[id]/status/route.ts` | Lecture status DB |
| Polling UC | `src/application/use-cases/generation/GetGenerationStatusUseCase.ts` | Lecture DB + anti-zombie |

**Authentification requise. Crédits déduits. Résultat stocké en DB.**

---

## Fichiers Critiques — NE PAS MODIFIER

Ces fichiers sont marqués avec `⚠️⚠️⚠️ FICHIER CRITIQUE` en header.  
**Ne les modifier que si un bug est confirmé en production.**

| Fichier | Rôle | Dernière modification |
|---------|------|-----------------------|
| `src/infrastructure/services/fal/FalImageGeneratorService.ts` | Appel fal.ai (fal.run synchrone) | 14 fév 2026 |
| `app/api/trial/generate/route.ts` | API essai gratuit | 14 fév 2026 |
| `app/api/v2/generate/route.ts` | API génération auth | 14 fév 2026 |
| `src/application/use-cases/generation/GenerateDesignUseCase.ts` | Use case génération | 14 fév 2026 |
| `src/application/use-cases/generation/GetGenerationStatusUseCase.ts` | Lecture status DB | 14 fév 2026 |
| `src/application/dtos/GenerationDTO.ts` | Contrat API client/serveur | 14 fév 2026 |

---

## Pourquoi fal.run() et PAS fal.queue

### Le Bug Fatal de fal.queue (découvert le 13 février 2026)

```
❌ ANCIEN FLOW (CASSÉ) :
1. fal.queue.submit(model, input) → retourne request_id
2. Client poll /api/v2/generations/{id}/status toutes les 3s
3. GetGenerationStatusUseCase appelle checkStatus(request_id)
4. checkStatus fait GET https://queue.fal.run/.../requests/{id}
5. CE GET RÉ-EXÉCUTE LE MODÈLE au lieu de retourner le résultat en cache
6. L'URL temporaire de l'image uploadée a expiré entre-temps
7. → "Failed to read image from URL" → génération stuck en 'processing' forever
```

### Le Fix : fal.run() Synchrone

```
✅ NOUVEAU FLOW (FONCTIONNEL) :
1. fal.storage.upload(imageBlob) → retourne URL permanente fal.ai
2. fal.run(model, { input: { image_url: falUrl, ... } }) → bloque ~10-20s
3. Résultat retourné directement avec images[0].url
4. Upload output vers Supabase Storage
5. DB mise à jour : status='completed', outputImageUrl=...
6. Client reçoit le résultat complet immédiatement
```

### Pourquoi c'est Mieux

- **Pas de race condition** : l'image est prête quand la réponse arrive
- **Pas d'URL expirée** : fal.storage.upload() crée une URL permanente
- **Pas de polling vers fal.ai** : 0 requête supplémentaire
- **Pas de webhook** : pas de serveur à écouter
- **Temps réel** : 10-20s d'attente = résultat visible

---

## Pipeline Détaillé — Flow Trial

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT (essai/page.tsx)                                      │
│                                                              │
│ 1. User upload photo → File → base64 (FileReader)           │
│ 2. POST /api/trial/generate { imageBase64, style, room }     │
│ 3. Barre de progression animée pendant ~15s                  │
│ 4. Réponse: { imageUrl } → affichage direct                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ API ROUTE (api/trial/generate/route.ts)                      │
│                                                              │
│ 1. Rate limit mémoire (1/IP/24h)                            │
│ 2. Validation Zod (imageBase64, roomType, style)            │
│ 3. Supabase trial_usage check (IP + fingerprint)            │
│ 4. fal.config({ credentials: FAL_KEY })                     │
│ 5. base64 → Blob → fal.storage.upload(blob) → falUrl       │
│ 6. fal.run(MODEL_PATH, { input: { image_url: falUrl, ... }})│
│ 7. Extraire result.data.images[0].url                        │
│ 8. Enregistrer trial_usage dans Supabase                    │
│ 9. Retourner { imageUrl }                                    │
└─────────────────────────────────────────────────────────────┘
```

## Pipeline Détaillé — Flow Authentifié

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT (generate/page.tsx)                                   │
│                                                              │
│ 1. User upload photo → File                                 │
│ 2. useGenerate hook: File → base64 → POST /api/v2/generate  │
│ 3. Barre de progression (10→20→40→attente→90→100)           │
│ 4. Réponse: { generation: { status: 'completed', ... } }    │
│ 5. generatedImage = generation.outputImageUrl → affichage   │
│ 6. useGenerationStatus: polling /status (confirmation DB)   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ API ROUTE (api/v2/generate/route.ts)                         │
│                                                              │
│ 1. Auth: supabase.auth.getUser()                            │
│ 2. Rate limit (10/user/min)                                 │
│ 3. Validation Zod (imageUrl, roomType, style, transformMode) │
│ 4. buildPrompt(style, roomType, transformMode)              │
│ 5. useCases.generateDesign.execute(...)                     │
│ 6. ← Retourne { generation (completed), creditsRemaining }  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ USE CASE (GenerateDesignUseCase.ts)                          │
│                                                              │
│ 1. creditRepo.getBalance(userId) — vérifier crédits         │
│ 2. Extraire dimensions image (JPEG/PNG/WebP headers)        │
│ 3. storage.uploadFromBase64(image, 'input-images') → url    │
│ 4. generationRepo.create({ status: 'pending' })             │
│ 5. creditRepo.deductCredits(userId, 1)                      │
│ 6. generationRepo.update({ status: 'processing' })          │
│ 7. Créer signed URL Supabase (1h) pour l'image source       │
│ 8. imageGenerator.generate({ controlImageUrl, prompt, ... }) │
│ 9. storage.uploadFromUrl(outputImageUrl, 'output-images')   │
│ 10. generationRepo.update({ status: 'completed', output })  │
│ 11. ← Retourne { generation, creditsRemaining }             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ FAL SERVICE (FalImageGeneratorService.ts)                     │
│                                                              │
│ 1. Upload image vers fal.storage (HTTP URL ou base64)       │
│ 2. Déterminer image_size optimal (ratio-based)              │
│ 3. Sélectionner params transformMode (strength, depthScale) │
│ 4. fal.run(MODEL_PATH, { input: { ... } })  ← bloque 10-20s│
│ 5. Extraire images[0].url du résultat                       │
│ 6. ← Retourne { imageUrl, status: 'succeeded' }             │
└─────────────────────────────────────────────────────────────┘
```

---

## Gestion des Erreurs

### Côté Serveur

| Erreur | Handling | Impact |
|--------|----------|--------|
| Crédits insuffisants | Return 402 + rollback | User voit "Rechargez vos crédits" |
| Upload image failed | Return 500 | User voit "Erreur, réessayez" |
| fal.run() timeout/fail | DB: status='failed' | User voit "La génération a échoué" |
| Upload output failed | Fallback: URL fal.ai directe | Image visible (temporaire) |
| DB update failed | Return 500 | Crédits perdus (à gérer manuellement) |

### Côté Client (generate/page.tsx)

| Situation | Comportement |
|-----------|------------|
| `generateState.data?.outputImageUrl` existe | Affichage immédiat du résultat |
| `isGenerating = true` mais `generatedImage` non null | Spinner disparu, résultat affiché |
| Polling confirme `isComplete` | Progress → 100%, résultat confirmé |
| Génération > 2 min en 'processing' | GetGenerationStatusUseCase → 'failed' (anti-zombie) |

### Anti-abus Trial (3 couches)

1. **Rate limit mémoire** : Map en RAM, 1 essai/IP/24h (reset au redéploiement)
2. **Supabase trial_usage** : Persistant, vérifie IP + fingerprint navigateur
3. **localStorage** : Côté client, bloque immédiatement les retours

---

## Paramètres Fal.ai

### Modèle

```
fal-ai/flux-general/image-to-image
```

### Modes de Transformation

| Mode | strength | depthScale | Description |
|------|----------|------------|-------------|
| `full_redesign` | 0.55 | 1.0 | Meubles + déco changés, architecture conservée |
| `keep_layout` | 0.45 | 1.2 | Style meubles changé, positions conservées |
| `decor_only` | 0.35 | 1.3 | Déco/accessoires changés, meubles conservés |

### Paramètres Fixes

```json
{
  "num_inference_steps": 28,
  "guidance_scale": 3.5,
  "enable_safety_checker": true,
  "output_format": "jpeg",
  "easycontrols": [{ "control_method_url": "depth", "image_control_type": "spatial" }]
}
```

### Negative Prompt (structurel)

```
different room layout, changed walls, modified windows, different room proportions,
architectural changes, different ceiling, changed floor plan, different room shape,
added windows, removed windows, moved doors, different perspective, different camera angle,
distorted proportions, extra rooms, merged rooms, wider room, narrower room,
taller ceiling, lower ceiling, different flooring material change
```

---

## Code Déprécié

Ces éléments **ne sont plus utilisés** mais sont gardés pour compatibilité :

| Élément | Fichier | Pourquoi gardé |
|---------|---------|----------------|
| `checkStatus()` | `FalImageGeneratorService.ts` | Interface `IImageGeneratorService` l'exige |
| Webhook `/api/v2/webhooks/fal` | `route.ts` | Éviter 404 si anciens callbacks |
| `GetGenerationStatusUseCase.checkStatus` branch | Plus présente | Supprimée, remplacée par anti-zombie |

**NE PAS réactiver `checkStatus()` — il re-lance `fal.queue.result()` qui re-exécute le modèle.**

---

## Règles pour les Futures Modifications

### ❌ INTERDIT

1. **NE JAMAIS utiliser `fal.queue.submit()`** — re-exécute le modèle au lieu de retourner le cache
2. **NE JAMAIS envoyer un base64/data URI directement à `fal.run()`** — toujours `fal.storage.upload()` d'abord
3. **NE JAMAIS réactiver le webhook** pour traiter les résultats
4. **NE JAMAIS rendre la génération asynchrone** (status 'processing' retourné au client)
5. **NE JAMAIS supprimer les headers `⚠️ FICHIER CRITIQUE`** des fichiers protégés

### ✅ AUTORISÉ (sans casser)

1. Modifier les **prompts** (buildPrompt, STRUCTURAL_NEGATIVE_PROMPT)
2. Modifier les **paramètres** (strength, depthScale, num_inference_steps)
3. Changer le **modèle** (MODEL_PATH) si l'API reste compatible
4. Ajouter des **styles** ou **types de pièce** (constantes)
5. Modifier l'**UI** des pages (sans toucher aux hooks/API)
6. Ajouter du **logging** ou de l'**analytics**

### ⚠️ ATTENTION (impact potentiel)

1. Modifier `GenerationDTO` → casse le contrat API client/serveur
2. Modifier `IImageGeneratorService` → casse l'injection de dépendances
3. Modifier `GenerateDesignUseCase.execute()` → casse le pipeline de crédits
4. Modifier `useGenerate.ts` → casse la progression client
5. Modifier `useGenerationStatus.ts` → casse le polling de confirmation

---

## Troubleshooting

### "La génération est stuck à 95%"

**Cause probable** : L'appel API `/api/v2/generate` n'a pas retourné `outputImageUrl`.  
**Vérifier** : Logs Vercel → chercher `[Generate V2]` et `[Fal.ai]`.  
**Fix** : Le `GetGenerationStatusUseCase` marque automatiquement les générations > 2 min comme `failed`.

### "Failed to read image from URL"

**Cause** : L'image uploadée sur Supabase a une URL publique non accessible par fal.ai.  
**Fix déjà en place** : `FalImageGeneratorService` upload vers `fal.storage` avant `fal.run()`.

### "fal.ai retourne pas d'image"

**Vérifier** : Le résultat peut être dans `result.data.images[0].url` OU `result.images[0].url`.  
**Le code gère les deux** via chain : `result?.data?.images?.[0]?.url || result?.images?.[0]?.url`.

### "Crédits déduits mais pas d'image"

**Cause** : Le serveur a crashé pendant `fal.run()`.  
**Fix** : L'anti-zombie dans `GetGenerationStatusUseCase` marque la génération comme `failed` après 2 min.  
**Rembourser** : Manuellement via le script `scripts/add-credits.js`.

### "Le trial dit 'essai déjà utilisé' mais c'est la première fois"

**Cause possible** :  
1. Même IP (réseau partagé, VPN)  
2. Fingerprint navigateur identique  
3. localStorage déjà set  
**Fix dev** : Cookie `instadeco_dev` + env var `DEV_BYPASS_TOKEN` pour bypass.

---

## Variables d'Environnement Requises

```bash
# Fal.ai (OBLIGATOIRE)
FAL_KEY=fak-...                    # Clé API Fal.ai
# OU
FAL_API_KEY=fak-...                # Alternative (les deux sont supportées)

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Dev bypass (OPTIONNEL)
DEV_BYPASS_TOKEN=0e42f7f1...       # Token pour bypass rate limit en dev
```

---

## Historique des Changements

| Date | Changement | Raison |
|------|-----------|--------|
| 13 fév 2026 | Trial: `fal.queue` → `fal.run()` | `fal.queue.result()` re-exécute le modèle |
| 14 fév 2026 | Auth: `fal.queue.submit()` → `fal.run()` | Même bug que le trial |
| 14 fév 2026 | FalService: upload data URI vers fal.storage | Base64 causait des erreurs |
| 14 fév 2026 | GetGenerationStatusUseCase: anti-zombie 2min | Générations bloquées |
| 14 fév 2026 | Webhook: marqué deprecated | Plus appelé en mode synchrone |
| 14 fév 2026 | GenerationDTO.status: `string` → `GenerationStatus` | Type safety |
| 14 fév 2026 | Audit complet + documentation | Préparation lancement pub |

---

*Document créé le 14 février 2026. Validé par build + TypeScript + lint.*
