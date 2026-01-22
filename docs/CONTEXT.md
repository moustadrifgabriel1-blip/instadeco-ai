# 🏠 InstaDeco AI - Contrat de Contexte Global

**Date de création :** 16 janvier 2026  
**Dernière mise à jour :** 22 janvier 2026  
**Version :** 2.1.0  
**Type de projet :** SaaS B2C - Décoration d'intérieur par IA  
**🏗️ Architecture :** Hexagonale (Ports & Adapters)  
**🎨 Branding :** InstaDeco AI  

---

## 📋 Table des Matières

1. [Vision et Positionnement](#vision-et-positionnement)
2. [Architecture Technique](#architecture-technique)
3. [État d'Avancement (Journal de Bord)](#état-davancement-journal-de-bord)
4. [Architecture Hexagonale](#architecture-hexagonale)
5. [Structure de la Base de Données](#structure-de-la-base-de-données)
6. [Endpoints API V2](#endpoints-api-v2)
7. [Couches du Code](#couches-du-code)
8. [Flux Utilisateur Principal](#flux-utilisateur-principal)
9. [Système de Crédits et Paiements](#système-de-crédits-et-paiements)
10. [Sécurité et Validation](#sécurité-et-validation)
11. [Variables d'Environnement](#variables-denvironnement)

---

## 🎯 Vision et Positionnement

### Concept
**InstaDeco AI** permet aux utilisateurs de transformer leurs photos de pièces en rendus décorés professionnels grâce à l'IA générative (Flux.1 + ControlNet via **Fal.ai**).

### Proposition de Valeur
- ✅ **Rapide** : Génération en moins de 10 secondes (optimisé avec Fal.ai)
- ✅ **Précis** : Respect de la structure spatiale (ControlNet Depth via Fal.ai)
- ✅ **Flexible** : 10+ styles de décoration (Bohème, Minimaliste, Industriel, etc.)
- ✅ **Accessible** : Modèle de crédits sans abonnement

### Public Cible
- Particuliers en recherche d'inspiration déco
- Agents immobiliers (home staging virtuel)
- Architectes d'intérieur (moodboards rapides)

---

## 🏗️ Architecture Technique

### Stack Principal

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14.1 (App Router), TypeScript, Tailwind CSS |
| **UI Components** | Shadcn/UI (Radix UI + Tailwind) |
| **Backend** | Next.js API Routes V2 (Architecture Hexagonale) |
| **Base de Données** | Supabase (PostgreSQL + Row Level Security) |
| **Authentification** | Supabase Auth (Email + OAuth Google) |
| **Stockage Fichiers** | Supabase Storage (Images utilisateurs + générations) |
| **IA Générative** | **Fal.ai** - Flux.1 [dev] + ControlNet (Depth) |
| **Paiements** | Stripe (Checkout Sessions + Webhooks) |
| **Validation** | Zod (Schemas TypeScript-first) |
| **Architecture** | Hexagonale (Ports & Adapters) |

### Justifications Techniques

**Pourquoi Next.js App Router ?**
- RSC (React Server Components) pour performance
- Streaming SSR pour UX optimale
- API Routes pour endpoints backend

**Pourquoi Fal.ai + Flux.1 ?**
- **Migration (Jan 2026)** : Passage de Replicate à Fal.ai pour meilleure performance et alignement configuration.
- Modèle : `fal-ai/flux/dev/controlnet`
- Optimisation : Latence très faible et files d'attente optimisées.

**Pourquoi Supabase ?**
- PostgreSQL robuste avec types forts
- Row Level Security (RLS) pour sécurité déclarative
- Realtime subscriptions pour mises à jour live
- Auth intégré avec OAuth providers
- Storage avec politiques de sécurité

**Pourquoi Architecture Hexagonale ?**
- Séparation claire des préoccupations
- Testabilité améliorée (mocks faciles)
- Indépendance des frameworks
- Facilité de maintenance et évolution

---

## 📅 État d'Avancement (Journal de Bord)

### ✅ Récemment Complété (22 Janvier 2026)
1.  **Migration Auth & DB** : Finalisation du passage de Firebase à Supabase.
2.  **Fix RLS** : Correction des politiques "Infinite Recursion" sur Supabase.
3.  **Fix Header UI** : Le composant `Header` affiche correctement les crédits (récupération API + Fallback direct).
4.  **Migration IA** : Remplacement complet de Replicate par **Fal.ai**.
    *   Adapter : `FalImageGeneratorService.ts`
    *   Config : `FAL_KEY` configurée (Local + Vercel).
    *   Client : Usage de `@fal-ai/client`.

### 🚧 En Cours de Débogage
1.  **Erreur Génération 500** : Le processus de génération lève une erreur interne.
    *   *Hypothèse* : Conflit lors de la déduction de crédits ou format de réponse Fal.ai inattendu.
    *   *Action* : Code mis à jour pour logger l'erreur précise.

### 🔜 Prochaines Étapes
1.  Identifier la cause exacte de l'erreur 500 (via logs Vercel ou test client).
2.  Valider le flux complet : Upload -> Génération -> Déduction Crédit -> Affichage.
3.  Nettoyage du code mort (ancien code Replicate/Firebase).

---

## 🔷 Architecture Hexagonale

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
│  (Hooks, Components, API Client)                                │
├─────────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                          │
│  (Use Cases, DTOs, Mappers)                                     │
├─────────────────────────────────────────────────────────────────┤
│                        DOMAIN LAYER                             │
│  (Entities, Value Objects, Ports, Errors)                       │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                         │
│  (Repositories, External Services, DI Container)                │
└─────────────────────────────────────────────────────────────────┘
```

### Structure des fichiers (95 fichiers TypeScript)

```
src/
├── domain/                    # 27 fichiers - Cœur métier (AUCUNE dépendance externe)
│   ├── entities/              # Entités métier
│   │   ├── User.ts
│   │   ├── Generation.ts
│   │   ├── CreditTransaction.ts
│   │   └── index.ts
│   ├── value-objects/         # Objets valeur immuables
│   │   ├── Email.ts
│   │   ├── Credits.ts
│   │   ├── StyleSlug.ts
│   │   ├── RoomTypeSlug.ts
│   │   ├── GenerationStatus.ts
│   │   └── index.ts
│   ├── ports/                 # Interfaces (contrats)
│   │   ├── repositories/      # Ports de persistance
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IGenerationRepository.ts
│   │   │   └── ICreditTransactionRepository.ts
│   │   ├── services/          # Ports de services externes
│   │   │   ├── IImageGenerationService.ts
│   │   │   ├── IStorageService.ts
│   │   │   ├── IPaymentService.ts
│   │   │   └── IAuthService.ts
│   │   └── index.ts
│   ├── errors/                # Erreurs métier typées
│   │   ├── DomainError.ts
│   │   ├── InsufficientCreditsError.ts
│   │   ├── GenerationNotFoundError.ts
│   │   ├── UserNotFoundError.ts
│   │   ├── InvalidInputError.ts
│   │   └── index.ts
│   └── index.ts
│
├── application/               # 24 fichiers - Orchestration des cas d'usage
│   ├── use-cases/             # Cas d'usage
│   │   ├── generation/
│   │   │   ├── GenerateDesignUseCase.ts
│   │   │   ├── GetGenerationStatusUseCase.ts
│   │   │   └── ListGenerationsUseCase.ts
│   │   ├── credits/
│   │   │   ├── GetCreditsUseCase.ts
│   │   │   ├── DeductCreditsUseCase.ts
│   │   │   ├── AddCreditsUseCase.ts
│   │   │   └── GetCreditHistoryUseCase.ts
│   │   ├── payments/
│   │   │   ├── CreateCheckoutSessionUseCase.ts
│   │   │   ├── HandleStripeWebhookUseCase.ts
│   │   │   ├── CreateHDUnlockSessionUseCase.ts
│   │   │   └── ConfirmHDUnlockUseCase.ts
│   │   └── index.ts
│   ├── dtos/                  # Data Transfer Objects
│   │   ├── GenerationDTO.ts
│   │   ├── UserDTO.ts
│   │   ├── CreditTransactionDTO.ts
│   │   ├── CheckoutSessionDTO.ts
│   │   └── index.ts
│   ├── mappers/               # Conversion Entity <-> DTO
│   │   ├── GenerationMapper.ts
│   │   ├── UserMapper.ts
│   │   ├── CreditTransactionMapper.ts
│   │   └── index.ts
│   └── index.ts
│
├── infrastructure/            # 20 fichiers - Implémentations concrètes
│   ├── repositories/          # Implémentation des ports Repository
│   │   ├── SupabaseUserRepository.ts
│   │   ├── SupabaseGenerationRepository.ts
│   │   └── SupabaseCreditTransactionRepository.ts
│   ├── services/              # Implémentation des ports Service
│   │   ├── ReplicateImageGenerationService.ts
│   │   ├── SupabaseStorageService.ts
│   │   ├── StripePaymentService.ts
│   │   └── SupabaseAuthService.ts
│   ├── database/              # Configuration DB
│   │   └── supabase.ts
│   ├── container/             # Injection de dépendances
│   │   └── index.ts           # DI Container exposant 10 Use Cases
│   └── index.ts
│
├── presentation/              # 16 fichiers - Interface utilisateur
│   ├── api/                   # Client API
│   │   └── client.ts          # Fonctions fetch vers API V2
│   ├── hooks/                 # React Hooks
│   │   ├── useGenerate.ts
│   │   ├── useGenerations.ts
│   │   ├── useGenerationStatus.ts
│   │   ├── useCredits.ts
│   │   ├── useCreditHistory.ts
│   │   ├── usePurchaseCredits.ts
│   │   └── useHDUnlock.ts
│   ├── components/            # Composants React
│   │   ├── GenerationCardV2.tsx
│   │   ├── GenerationGallery.tsx
│   │   ├── CreditsDisplayV2.tsx
│   │   ├── CreditsPurchase.tsx
│   │   └── GenerateForm.tsx
│   ├── types/                 # Types Presentation
│   │   └── index.ts
│   └── index.ts
│
├── shared/                    # 7 fichiers - Utilitaires partagés
│   ├── constants/
│   │   ├── styles.ts          # STYLES disponibles
│   │   ├── rooms.ts           # Types de pièces
│   │   ├── packs.ts           # Packs de crédits
│   │   └── index.ts
│   ├── utils/
│   │   ├── env.ts             # Variables d'environnement (Zod)
│   │   └── index.ts
│   └── index.ts
│
└── index.ts                   # Export principal de toutes les couches
```

### Règles d'Architecture

1. **Domain** : Aucune dépendance externe, code métier pur
2. **Application** : Dépend uniquement du Domain
3. **Infrastructure** : Implémente les ports du Domain
4. **Presentation** : Utilise Application via API Client
5. **Shared** : Constantes et utilitaires, aucune logique métier

---

## 🗄️ Structure de la Base de Données

### Schéma Supabase (PostgreSQL)

```sql
-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: credit_transactions
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
  stripe_payment_intent_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON public.credit_transactions(created_at DESC);

-- ============================================
-- TABLE: generations
-- ============================================
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  style_slug TEXT NOT NULL,
  room_type_slug TEXT NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  controlnet_type TEXT NOT NULL DEFAULT 'canny',
  input_image_url TEXT NOT NULL,
  output_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  replicate_prediction_id TEXT,
  error_message TEXT,
  generation_time_ms INTEGER,
  hd_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_generations_user ON public.generations(user_id);
CREATE INDEX idx_generations_status ON public.generations(status);
CREATE INDEX idx_generations_created ON public.generations(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Credit transactions policies
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Generations policies
CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON public.generations
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 🔌 Endpoints API V2

### Architecture API Routes

```
app/api/v2/
├── generate/
│   └── route.ts               # POST - Démarrer génération
├── generations/
│   ├── route.ts               # GET - Liste des générations
│   └── [id]/
│       └── status/
│           └── route.ts       # GET - Statut d'une génération
├── credits/
│   ├── route.ts               # GET - Solde de crédits
│   └── history/
│       └── route.ts           # GET - Historique transactions
├── payments/
│   └── create-checkout/
│       └── route.ts           # POST - Créer session Stripe
├── hd-unlock/
│   ├── create-checkout/
│       └── route.ts           # POST - Créer session HD unlock
│   └── confirm/
│       └── route.ts           # POST - Confirmer HD unlock
└── webhooks/
    └── stripe/
        └── route.ts           # POST - Webhook Stripe
```

### Spécifications des Endpoints

#### 1. **POST /api/v2/generate**

Démarre une nouvelle génération d'image.

```typescript
// Request
{
  styleSlug: string;        // Ex: "moderne"
  roomTypeSlug: string;     // Ex: "salon"
  imageBase64: string;      // Image en base64
}

// Response 200
{
  success: true,
  data: {
    generationId: string;
    status: "pending";
  }
}
```

#### 2. **GET /api/v2/generations/[id]/status**

Récupère le statut d'une génération.

```typescript
// Response 200
{
  success: true,
  data: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    outputImageUrl?: string;
    errorMessage?: string;
    progress?: number;
  }
}
```

#### 3. **GET /api/v2/generations**

Liste les générations de l'utilisateur.

```typescript
// Query: ?page=1&limit=20&status=completed

// Response 200
{
  success: true,
  data: {
    generations: GenerationDTO[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      hasMore: boolean;
    }
  }
}
```

#### 4. **GET /api/v2/credits**

Récupère le solde de crédits.

```typescript
// Response 200
{
  success: true,
  data: {
    credits: number;
    userId: string;
  }
}
```

#### 5. **POST /api/v2/payments/create-checkout**

Crée une session Stripe Checkout.

```typescript
// Request
{
  packId: "starter" | "pro" | "unlimited";
}

// Response 200
{
  success: true,
  data: {
    url: string;        // URL Stripe Checkout
    sessionId: string;
  }
}
```

#### 6. **POST /api/v2/hd-unlock/create-checkout**

Crée une session pour débloquer une image HD.

```typescript
// Request
{
  generationId: string;
}

// Response 200
{
  success: true,
  data: {
    url: string;
    sessionId: string;
  }
}
```

---

## 🧩 Couches du Code

### DI Container (10 Use Cases exposés)

```typescript
// src/infrastructure/container/index.ts
export const container = {
  // Generation
  generateDesignUseCase: new GenerateDesignUseCase(...),
  getGenerationStatusUseCase: new GetGenerationStatusUseCase(...),
  listGenerationsUseCase: new ListGenerationsUseCase(...),
  
  // Credits
  getCreditsUseCase: new GetCreditsUseCase(...),
  getCreditHistoryUseCase: new GetCreditHistoryUseCase(...),
  
  // Payments
  createCheckoutSessionUseCase: new CreateCheckoutSessionUseCase(...),
  handleStripeWebhookUseCase: new HandleStripeWebhookUseCase(...),
  createHDUnlockSessionUseCase: new CreateHDUnlockSessionUseCase(...),
  confirmHDUnlockUseCase: new ConfirmHDUnlockUseCase(...),
};
```

### Exemple d'API Route V2

```typescript
// app/api/v2/credits/route.ts
import { NextResponse } from 'next/server';
import { container } from '@/src/infrastructure';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await container.getCreditsUseCase.execute(user.id);
  
  return NextResponse.json({ success: true, data: result });
}
```

### Hooks Presentation

```typescript
// Exemples d'utilisation
import { useCredits, useGenerate, useGenerations } from '@/src/presentation';

function MyComponent() {
  const { credits, loading } = useCredits();
  const { generate, isGenerating } = useGenerate();
  const { generations, hasMore, loadMore } = useGenerations();
  
  // ...
}
```

---

## 🔄 Flux Utilisateur Principal

### Scénario: Générer une Décoration

```
1. Utilisateur → Upload photo + Choisir style
2. Frontend → Validation Zod (styleSlug, roomTypeSlug)
3. Frontend → POST /api/v2/generate
4. API Route → container.generateDesignUseCase.execute()
5. Use Case:
   a. Vérifier crédits utilisateur (IUserRepository)
   b. Déduire 1 crédit (ICreditTransactionRepository)
   c. Upload image (IStorageService)
   d. Démarrer génération (IImageGenerationService → Replicate)
   e. Créer enregistrement generation (IGenerationRepository)
6. API Route → Return { generationId, status: "pending" }
7. Frontend → Polling GET /api/v2/generations/[id]/status
8. Replicate termine → Webhook ou polling met à jour status
9. Frontend → Affiche image générée
```

---

## 💳 Système de Crédits et Paiements

### Packs de Crédits

| Pack | Crédits | Prix | Price ID |
|------|---------|------|----------|
| Starter | 10 | 9.99€ | STRIPE_PRICE_STARTER |
| Pro | 30 | 24.99€ | STRIPE_PRICE_PRO |
| Unlimited | 100 | 69.99€ | STRIPE_PRICE_UNLIMITED |

### HD Unlock

- **Prix** : 1€ par image
- **Price ID** : STRIPE_PRICE_HD_UNLOCK
- **Flux** : Créer session → Paiement → Webhook → hdUnlocked = true

### Coût par Génération

- 1 crédit = 1 génération
- 3 crédits offerts à l'inscription

---

## 🔐 Sécurité et Validation

### Middleware

```typescript
// middleware.ts
- Protège les routes /dashboard, /generate, /credits
- Redirige vers /login si non authentifié
- Utilise Supabase Auth
```

### Row Level Security (RLS)

- Toutes les tables ont RLS activé
- Les utilisateurs ne voient que leurs propres données
- Les opérations admin passent par service_role_key

### Validation Zod

- Tous les inputs API validés avec Zod
- Schemas centralisés dans `src/shared/`

---

## ⚙️ Variables d'Environnement

```bash
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Replicate
REPLICATE_API_TOKEN=r8_xxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_STARTER=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_UNLIMITED=price_xxx
STRIPE_PRICE_HD_UNLOCK=price_xxx

# Sécurité
RATE_LIMIT_MAX_REQUESTS=10
```

---

## 📚 Fichiers de Documentation

| Fichier | Description |
|---------|-------------|
| `docs/CONTEXT.md` | Ce fichier - Contexte global du projet |
| `docs/ARCHITECTURE.md` | Documentation architecture hexagonale |
| `.github/copilot-instructions.md` | Instructions pour Copilot |
| `.env.example` | Template des variables d'environnement |

---

**Version:** 2.0.0  
**Architecture:** Hexagonale (Ports & Adapters)  
**Stack:** Next.js 14 + Supabase + Replicate + Stripe  
**Dernière mise à jour:** 20 janvier 2026
