# Copilot Instructions - InstaDeco

## Contexte du Projet

Ce projet est un **SaaS B2C de décoration d'intérieur par IA** utilisant Flux.1 + ControlNet.

**⚠️ IMPORTANT:** À chaque nouvelle session, **lire le fichier `../docs/CONTEXT.md`** pour synchroniser le contexte complet du projet.

## Stack Technique

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components:** Shadcn/UI (Radix UI)
- **Backend:** Next.js API Routes + Supabase (PostgreSQL + Auth + Storage)
- **Database:** Supabase
- **IA Générative:** Fal.ai (Flux.1 [dev] + ControlNet)
- **Paiements:** Stripe (modèle de crédits)
- **Validation:** Zod

## Conventions de Code

### Architecture

- Utiliser l'App Router de Next.js (dossier `app/`)
- Grouper les routes avec des parenthèses: `(auth)`, `(dashboard)`, `(marketing)`
- Séparer les composants en 3 catégories:
  - `components/ui`: Composants Shadcn/UI réutilisables
  - `components/layout`: Composants de mise en page (Header, Footer, Sidebar)
  - `components/features`: Composants métier (ImageUpload, StyleSelector, etc.)

### Nomenclature

- **Composants React:** PascalCase (`ImageUpload.tsx`)
- **Fichiers utilitaires:** kebab-case (`fal-client.ts`, `supabase.ts`)
- **Routes API:** kebab-case (`/api/generate/route.ts`)
- **Types:** PascalCase (`GenerationStatus`, `CreditTransaction`)

### TypeScript

- Toujours typer les props des composants
- Utiliser `interface` pour les objets publics
- Utiliser `type` pour les unions et intersections
- Exporter les types depuis `types/` quand partagés

### Validation

- Utiliser Zod pour toute validation d'entrée utilisateur
- Centraliser les schemas dans `lib/validations/schemas.ts`
- Valider côté client ET serveur

### Sécurité

- Ne jamais exposer les clés secrètes côté client
- Utiliser les Row Level Security (RLS) de Supabase
- Valider l'authentification dans chaque API Route protégée
- Implémenter le rate limiting sur les endpoints sensibles

## Patterns à Suivre

### 1. Composants Serveur vs Client

```typescript
// Par défaut, utiliser les Server Components (pas de "use client")
// app/dashboard/page.tsx
import { adminDb } from '@/lib/firebase/admin';

export default async function DashboardPage() {
  const snapshot = await adminDb.collection('generations').get();
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return <div>...</div>;
}

// Ajouter "use client" UNIQUEMENT si nécessaire (interactivité, hooks)
// components/features/image-upload.tsx
'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export function ImageUpload() {
  const [file, setFile] = useState<File | null>(null);
  // ...
}
```

### 2. Gestion des Erreurs

```typescript
// API Routes: Retourner des erreurs structurées
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Logique...
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
```

### 3. Requêtes Supabase

```typescript
// Toujours gérer les erreurs Supabase
const { data, error } = await supabase
  .from('generations')
  .select('*')
  .eq('user_id', userId);

if (error) {
  throw new Error(`Supabase error: ${error.message}`);
}
```

### 4. Optimisation des Images

**Utiliser `OptimizedImage` ou `OptimizedRemoteImage`** de `components/ui/optimized-image.tsx` :

```typescript
// ✅ Images distantes (Supabase, fal.ai) — gestion erreur automatique
import { OptimizedRemoteImage } from '@/components/ui/optimized-image';

<OptimizedRemoteImage
  src={generation.output_image_url}
  alt="Salon style scandinave — Décoration IA"
  fill
  sizePreset="card"  // hero | card | gallery | half | full | thumb
  className="object-cover"
  priority  // uniquement above-the-fold
/>

// ✅ Images avec dimensions fixes mais responsive
<OptimizedImage
  src={imagePreview}
  alt="Aperçu de votre pièce"
  width={600}
  height={400}
  responsive
  sizes="(max-width: 768px) 100vw, 50vw"
  unoptimized  // pour les blob: URLs
/>
```

**Règles strictes :**
- TOUJOURS spécifier `sizes` (ou `sizePreset`) quand `fill` est utilisé
- JAMAIS ajouter `loading="lazy"` manuellement (Next.js le gère)
- Alt text descriptif et en français pour le SEO
- `onError` handler (automatique dans OptimizedImage)
- Voir `docs/CONTEXT.md` section "Convention Images" pour la doc complète

## Workflow de Développement

### Phase Actuelle: **Milestone 2 - Backend Crédits & Stripe**

Voir `../docs/CONTEXT.md` section "Milestones de Développement" pour le plan complet.

### Avant de Coder

1. Lire `../docs/CONTEXT.md` pour comprendre l'architecture
2. Vérifier le milestone en cours
3. Vérifier les dépendances nécessaires

### Tests Manuels

Avant chaque commit, vérifier:
- [ ] Le code compile sans erreurs TypeScript (`npm run type-check`)
- [ ] Le linter passe (`npm run lint`)
- [ ] L'application démarre (`npm run dev`)
- [ ] Les nouvelles fonctionnalités marchent en local

## Commandes Utiles

```bash
# Développement
npm run dev              # Serveur de développement
npm run type-check       # Vérification TypeScript
npm run lint             # Linter

# Build
npm run build            # Build de production
npm run start            # Serveur de production

# Shadcn/UI
npx shadcn-ui@latest add [component]  # Ajouter un composant
```

## Variables d'Environnement

Voir `.env.example` pour la liste complète. Les variables **obligatoires** pour démarrer:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
FAL_API_KEY=...
STRIPE_SECRET_KEY=...
```

## Ressources Importantes

- **Contexte Complet:** `../docs/CONTEXT.md`
- **Schéma DB:** Voir section "Structure de la Base de Données" dans CONTEXT.md
- **Endpoints API:** Voir section "Endpoints API" dans CONTEXT.md
- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Fal.ai Docs:** https://fal.ai/docs
- **Shadcn/UI:** https://ui.shadcn.com

## Notes Spéciales pour Copilot

- **Toujours suggérer des types TypeScript stricts**
- **Proposer des composants atomiques et réutilisables**
- **Optimiser pour les performances (Server Components, lazy loading)**
- **Inclure la validation Zod dans les suggestions**
- **Respecter l'architecture en couches (lib/, components/, app/)**

---

**Version:** 1.0.0  
**Dernière mise à jour:** 16 janvier 2026
