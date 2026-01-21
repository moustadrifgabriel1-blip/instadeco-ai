# 🏛️ ARCHITECTURE.md - Constitution Technique InstaDeco

> **Version:** 2.0.0  
> **Date:** 20 janvier 2026  
> **Statut:** ACTIF - Toute violation doit être justifiée par écrit  

---

## 1. 🎯 Vision Architecturale

Ce projet suit l'**Architecture Hexagonale (Ports & Adapters)** pour garantir :
- **Découplage total** entre la logique métier et les frameworks
- **Testabilité** unitaire sans mocks de DB/API
- **Évolutivité** sur 10+ ans (changement de DB, d'API IA, de framework UI)
- **API Replicate déjà intégrée** dans le code existant
- **Lisibilité** pour tout nouveau développeur

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION (Next.js)                      │
│                   Components, Pages, API Routes                  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ import
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION (Use Cases)                     │
│            GenerateDesignUseCase, PurchaseCreditsUseCase         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ interface (Port)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DOMAIN (Pure TS)                         │
│              Entities, Value Objects, Interfaces                 │
└─────────────────────────────────────────────────────────────────┘
                                  ▲
                                  │ implements (Adapter)
┌─────────────────────────────────┴───────────────────────────────┐
│                     INFRASTRUCTURE (Adapters)                    │
│              Supabase, Fal.ai, Stripe, Logger, Queue             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 🔒 Tech Stack Freeze

### Core Framework
| Technologie | Version | Rôle | Verrouillé |
|-------------|---------|------|------------|
| Next.js | 14.x → 15.x | Framework Full-Stack | ✅ |
| TypeScript | 5.x | Langage | ✅ |
| React | 18.x → 19.x | UI Library | ✅ |

### Styling & UI
| Technologie | Version | Rôle | Verrouillé |
|-------------|---------|------|------------|
| Tailwind CSS | 3.x | Styling | ✅ |
| Shadcn/UI | latest | Component Library | ✅ |
| Radix UI | latest | Primitives | ✅ |
| Lucide React | latest | Icons | ✅ |

### Backend & Data
| Technologie | Version | Rôle | Verrouillé |
|-------------|---------|------|------------|
| Supabase | latest | Database + Auth + Storage | ✅ |
| PostgreSQL | 15+ | Database Engine | ✅ |
| pgvector | latest | Vector Search (futur) | 🔜 |

### External Services
| Technologie | Rôle | Verrouillé |
|-------------|------|------------|
| Replicate (Flux.1 + ControlNet) | AI Image Generation | ✅ |
| Stripe | Payments | ✅ |
| Resend | Emails (futur) | 🔜 |

### Queue & Background Jobs
| Technologie | Rôle | Verrouillé |
|-------------|------|------------|
| BullMQ + Redis | Job Queue (futur) | 🔜 |
| Supabase Edge Functions | Serverless (alternative) | 🔜 |

### Validation & Error Handling
| Technologie | Rôle | Verrouillé |
|-------------|------|------------|
| Zod | Schema Validation | ✅ |
| Custom Result Type | Error Handling | ✅ |

---

## 3. 📁 Directory Map

```
src/
├── domain/                          # 🔴 PURE TYPESCRIPT - AUCUNE DÉPENDANCE
│   ├── entities/                    # Objets métier
│   │   ├── Generation.ts            # Entité Generation
│   │   ├── User.ts                  # Entité User  
│   │   ├── Credit.ts                # Entité Credit
│   │   └── Style.ts                 # Entité Style
│   │
│   ├── value-objects/               # Objets immuables
│   │   ├── Email.ts
│   │   ├── ImageUrl.ts
│   │   ├── CreditAmount.ts
│   │   └── GenerationStatus.ts
│   │
│   ├── ports/                       # Interfaces (Contrats)
│   │   ├── repositories/
│   │   │   ├── IGenerationRepository.ts
│   │   │   ├── IUserRepository.ts
│   │   │   └── ICreditRepository.ts
│   │   │
│   │   ├── services/
│   │   │   ├── IImageGeneratorService.ts
│   │   │   ├── IPaymentService.ts
│   │   │   ├── IStorageService.ts
│   │   │   └── ILoggerService.ts
│   │   │
│   │   └── index.ts                 # Barrel export
│   │
│   ├── errors/                      # Erreurs métier typées
│   │   ├── DomainError.ts
│   │   ├── InsufficientCreditsError.ts
│   │   ├── GenerationNotFoundError.ts
│   │   └── index.ts
│   │
│   └── index.ts                     # Barrel export domain
│
├── application/                     # 🟡 USE CASES - Orchestration
│   ├── use-cases/
│   │   ├── generation/
│   │   │   ├── GenerateDesignUseCase.ts
│   │   │   ├── GetGenerationStatusUseCase.ts
│   │   │   └── ListUserGenerationsUseCase.ts
│   │   │
│   │   ├── credits/
│   │   │   ├── PurchaseCreditsUseCase.ts
│   │   │   ├── DeductCreditsUseCase.ts
│   │   │   └── GetUserCreditsUseCase.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── SignUpUseCase.ts
│   │   │   ├── SignInUseCase.ts
│   │   │   └── SignOutUseCase.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── dtos/                        # Data Transfer Objects
│   │   ├── GenerationDTO.ts
│   │   ├── UserDTO.ts
│   │   └── index.ts
│   │
│   ├── mappers/                     # Entity ↔ DTO
│   │   ├── GenerationMapper.ts
│   │   └── UserMapper.ts
│   │
│   └── index.ts
│
├── infrastructure/                  # 🟢 ADAPTERS - Implémentations
│   ├── repositories/
│   │   ├── supabase/
│   │   │   ├── SupabaseGenerationRepository.ts
│   │   │   ├── SupabaseUserRepository.ts
│   │   │   ├── SupabaseCreditRepository.ts
│   │   │   └── supabaseClient.ts
│   │   │
│   │   └── in-memory/               # Pour les tests
│   │       ├── InMemoryGenerationRepository.ts
│   │       └── InMemoryUserRepository.ts
│   │
│   ├── services/
│   │   ├── replicate/
│   │   │   └── ReplicateImageGeneratorService.ts
│   │   │
│   │   ├── stripe/
│   │   │   └── StripePaymentService.ts
│   │   │
│   │   ├── supabase/
│   │   │   └── SupabaseStorageService.ts
│   │   │
│   │   └── logger/
│   │       ├── ConsoleLoggerService.ts
│   │       └── SentryLoggerService.ts   # Futur
│   │
│   ├── config/                      # Configuration centralisée
│   │   ├── env.ts                   # Validation Zod des env vars
│   │   └── di-container.ts          # Dependency Injection
│   │
│   └── index.ts
│
├── presentation/                    # 🔵 UI - Next.js / React
│   ├── components/
│   │   ├── ui/                      # Shadcn components
│   │   ├── layout/                  # Header, Footer, Sidebar
│   │   └── features/                # Composants métier
│   │       ├── generation/
│   │       │   ├── ImageUploader.tsx
│   │       │   ├── StyleSelector.tsx
│   │       │   └── GenerationResult.tsx
│   │       │
│   │       └── credits/
│   │           ├── CreditBadge.tsx
│   │           └── PurchaseModal.tsx
│   │
│   ├── hooks/                       # React Hooks
│   │   ├── useAuth.ts
│   │   ├── useCredits.ts
│   │   └── useGeneration.ts
│   │
│   ├── providers/                   # React Context
│   │   ├── AuthProvider.tsx
│   │   └── ThemeProvider.tsx
│   │
│   └── styles/
│       └── globals.css
│
├── shared/                          # 🟣 UTILITAIRES PARTAGÉS
│   ├── types/
│   │   ├── Result.ts                # Result<T, E> pattern
│   │   └── common.ts
│   │
│   ├── utils/
│   │   ├── validation.ts
│   │   └── formatting.ts
│   │
│   └── constants/
│       ├── styles.ts
│       └── pricing.ts
│
└── index.ts                         # Entry point exports

app/                                 # Next.js App Router (thin layer)
├── (auth)/
│   ├── login/page.tsx               # Importe depuis presentation/
│   └── signup/page.tsx
│
├── (dashboard)/
│   └── dashboard/page.tsx
│
├── (marketing)/
│   ├── page.tsx                     # Landing
│   ├── generate/page.tsx
│   └── pricing/page.tsx
│
├── api/                             # API Routes (Controllers)
│   ├── generate/
│   │   └── route.ts                 # Appelle GenerateDesignUseCase
│   ├── generations/
│   │   └── route.ts
│   ├── payments/
│   │   └── webhook/route.ts
│   └── auth/
│       └── callback/route.ts
│
├── layout.tsx
└── globals.css
```

---

## 4. 🔄 Data Flow Rules

### ✅ AUTORISÉ

```typescript
// ✅ Page importe UseCase
import { GenerateDesignUseCase } from '@/src/application';

// ✅ UseCase importe Port (Interface)
import { IGenerationRepository } from '@/src/domain/ports';

// ✅ Infrastructure importe Port pour l'implémenter
import { IGenerationRepository } from '@/src/domain/ports';
export class SupabaseGenerationRepository implements IGenerationRepository { }

// ✅ DI Container wire tout ensemble
import { SupabaseGenerationRepository } from '@/src/infrastructure';
const repo = new SupabaseGenerationRepository();
const useCase = new GenerateDesignUseCase(repo);
```

### ❌ INTERDIT

```typescript
// ❌ INTERDIT: Page importe Infrastructure directement
import { supabase } from '@/src/infrastructure/repositories/supabase';

// ❌ INTERDIT: Domain importe Infrastructure
import { SupabaseClient } from '@supabase/supabase-js'; // Dans domain/

// ❌ INTERDIT: UseCase importe Adapter concret
import { SupabaseGenerationRepository } from '@/src/infrastructure';

// ❌ INTERDIT: Composant appelle Supabase directement
const { data } = await supabase.from('generations').select();
```

### 📊 Matrice d'Import

| Module Source | Peut importer → | Domain | Application | Infrastructure | Presentation | Shared |
|--------------|-----------------|--------|-------------|----------------|--------------|--------|
| **Domain** | | ✅ Self | ❌ | ❌ | ❌ | ✅ |
| **Application** | | ✅ | ✅ Self | ❌ | ❌ | ✅ |
| **Infrastructure** | | ✅ | ❌ | ✅ Self | ❌ | ✅ |
| **Presentation** | | ❌ | ✅ | ❌ | ✅ Self | ✅ |
| **app/ (Next.js)** | | ❌ | ✅ | Via DI | ✅ | ✅ |

---

## 5. 📐 Code Standards

### 5.1 Validation avec Zod

```typescript
// src/shared/validation/schemas.ts
import { z } from 'zod';

export const GenerateRequestSchema = z.object({
  imageBase64: z.string().min(1),
  styleSlug: z.string().min(1),
  roomType: z.enum(['salon', 'chambre', 'cuisine', 'salle-de-bain', 'bureau']),
  userId: z.string().uuid(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
```

### 5.2 Result Pattern (No Exceptions)

```typescript
// src/shared/types/Result.ts
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Usage dans UseCase
export class GenerateDesignUseCase {
  async execute(input: GenerateRequest): Promise<Result<Generation, DomainError>> {
    const credits = await this.creditRepo.getBalance(input.userId);
    
    if (credits < GENERATION_COST) {
      return { 
        success: false, 
        error: new InsufficientCreditsError(credits, GENERATION_COST) 
      };
    }
    
    // ... génération
    return { success: true, data: generation };
  }
}
```

### 5.3 Variables d'Environnement

```typescript
// src/infrastructure/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Replicate
  REPLICATE_API_TOKEN: z.string().min(1),
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
```

### 5.4 Logger Service (No console.log)

```typescript
// src/domain/ports/services/ILoggerService.ts
export interface ILoggerService {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

// Usage
export class GenerateDesignUseCase {
  constructor(
    private readonly logger: ILoggerService,
    private readonly generationRepo: IGenerationRepository,
  ) {}

  async execute(input: GenerateRequest): Promise<Result<Generation>> {
    this.logger.info('Starting generation', { userId: input.userId, style: input.styleSlug });
    // ...
  }
}
```

### 5.5 Dependency Injection Container

```typescript
// src/infrastructure/config/di-container.ts
import { GenerateDesignUseCase } from '@/src/application';
import { SupabaseGenerationRepository } from '@/src/infrastructure/repositories/supabase';
import { ReplicateImageGeneratorService } from '@/src/infrastructure/services/replicate';
import { ConsoleLoggerService } from '@/src/infrastructure/services/logger';

// Singleton instances
const logger = new ConsoleLoggerService();
const generationRepo = new SupabaseGenerationRepository();
const imageGenerator = new ReplicateImageGeneratorService();

// Use Cases factory
export const useCases = {
  generateDesign: new GenerateDesignUseCase(
    logger,
    generationRepo,
    imageGenerator,
  ),
  // ... autres use cases
};
```

---

## 6. 🧪 Testing Strategy

### Structure des Tests

```
tests/
├── unit/
│   ├── domain/
│   │   └── entities/
│   │       └── Generation.test.ts
│   │
│   └── application/
│       └── use-cases/
│           └── GenerateDesignUseCase.test.ts
│
├── integration/
│   └── repositories/
│       └── SupabaseGenerationRepository.test.ts
│
└── e2e/
    └── generation-flow.test.ts
```

### Tests Unitaires (Domain + Application)

```typescript
// tests/unit/application/GenerateDesignUseCase.test.ts
import { GenerateDesignUseCase } from '@/src/application';
import { InMemoryGenerationRepository } from '@/src/infrastructure/repositories/in-memory';
import { MockImageGeneratorService } from '@/tests/mocks';

describe('GenerateDesignUseCase', () => {
  it('should deduct credits on successful generation', async () => {
    // Arrange
    const repo = new InMemoryGenerationRepository();
    const imageGen = new MockImageGeneratorService();
    const useCase = new GenerateDesignUseCase(repo, imageGen);

    // Act
    const result = await useCase.execute({ /* ... */ });

    // Assert
    expect(result.success).toBe(true);
  });
});
```

---

## 7. 🚀 Migration Path

### Phase 1: Structure (Actuelle)
- [x] Créer le fichier `ARCHITECTURE.md`
- [ ] Créer la structure `src/` vide
- [ ] Définir les interfaces (Ports)

### Phase 2: Domain Layer
- [ ] Créer les Entités (`Generation`, `User`, `Credit`)
- [ ] Créer les Value Objects
- [ ] Créer les Erreurs métier

### Phase 3: Application Layer  
- [ ] Migrer la logique des API Routes vers Use Cases
- [ ] Créer les DTOs et Mappers

### Phase 4: Infrastructure Layer
- [ ] Créer les Repositories Supabase
- [ ] Créer les Services (Fal, Stripe)
- [ ] Configurer le DI Container

### Phase 5: Presentation Layer
- [ ] Refactorer les composants pour utiliser les Use Cases
- [ ] Nettoyer les imports directs Supabase

---

## 8. 📋 Checklist de Conformité

Avant chaque PR, vérifier :

- [ ] **Aucun import `@supabase` dans `domain/` ou `application/`**
- [ ] **Aucun import `infrastructure/` dans `presentation/`**
- [ ] **Tous les Use Cases retournent `Result<T, E>`**
- [ ] **Toutes les entrées validées avec Zod**
- [ ] **Aucun `console.log` (utiliser `ILoggerService`)**
- [ ] **Tests unitaires pour les nouveaux Use Cases**
- [ ] **Noms de fichiers en PascalCase pour les classes**

---

## 9. 📚 Références

- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://domainlanguage.com/ddd/)

---

> **⚠️ AVERTISSEMENT:** Toute modification de ce document nécessite une revue architecturale. Le non-respect de ces règles bloquera les PRs.

---

*Dernière mise à jour: 20 janvier 2026*
