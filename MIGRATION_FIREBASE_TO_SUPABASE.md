# 🚀 Migration Firebase → Supabase

## 📋 Checklist de Migration

### Phase 1: Setup Supabase (⏱️ 30 min)

- [ ] **Créer projet Supabase** sur [supabase.com](https://supabase.com)
- [ ] **Récupérer les credentials:**
  - URL: `https://xxxxx.supabase.co`
  - Anon Key: `eyJhbG...` (clé publique)
  - Service Role Key: `eyJhbG...` (clé privée - DANGER)
- [ ] **Installer dépendances:**
  ```bash
  npm install @supabase/ssr @supabase/supabase-js
  ```
- [ ] **Configurer `.env.local`:**
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # PRIVÉ
  ```
- [ ] **Ajouter les variables sur Vercel**

---

### Phase 2: Database Schema (⏱️ 20 min)

- [ ] **Exécuter le schema SQL:**
  1. Aller dans Supabase Dashboard → SQL Editor
  2. Copier le contenu de `supabase/migrations/00001_initial_schema.sql`
  3. Exécuter le script
  4. Vérifier que les tables sont créées (Tables tab)

- [ ] **Vérifier les tables créées:**
  - `profiles` ✓
  - `projects` ✓
  - `generations` ✓
  - `credit_transactions` ✓

- [ ] **Vérifier les RLS policies:**
  - Aller dans Authentication → Policies
  - Chaque table doit avoir ses policies actives

- [ ] **Tester les fonctions RPC:**
  ```sql
  -- Test deduct_credits
  SELECT deduct_credits(
    'user-uuid-here'::uuid,
    1
  );
  ```

---

### Phase 3: Storage Buckets (⏱️ 15 min)

#### Créer les buckets

**1. input-images:**
- [ ] Storage → New Bucket
- [ ] Nom: `input-images`
- [ ] Public: ✓ (pour affichage UI)
- [ ] Allowed MIME types: `image/jpeg, image/png, image/webp`
- [ ] Max file size: `10MB`

**Policy:**
```sql
-- Upload uniquement dans son dossier
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'input-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture publique
CREATE POLICY "Anyone can read input images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'input-images');
```

**2. output-images:**
- [ ] Storage → New Bucket
- [ ] Nom: `output-images`
- [ ] Public: ✗ (privé par défaut)
- [ ] Allowed MIME types: `image/jpeg`

**Policy:**
```sql
-- Lecture uniquement par le propriétaire
CREATE POLICY "Users can read own output images" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'output-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

### Phase 4: Configuration Auth (⏱️ 10 min)

- [ ] **Activer Email Auth:**
  - Authentication → Providers → Email ✓
  - Confirm email: ✓ (recommandé)
  
- [ ] **Activer Google OAuth (optionnel):**
  - Authentication → Providers → Google
  - Client ID: `votre-google-client-id`
  - Client Secret: `votre-google-secret`

- [ ] **Configurer Redirect URLs:**
  - Authentication → URL Configuration
  - Site URL: `https://instadeco.app`
  - Redirect URLs:
    - `http://localhost:3001/**`
    - `https://instadeco.app/**`

- [ ] **Tester le trigger auto-création profil:**
  1. Créer un compte test via UI
  2. Vérifier qu'une ligne apparaît dans `profiles`
  3. Vérifier que `credits = 3` par défaut

---

### Phase 5: Code Migration (⏱️ 2-3h)

#### 1. Remplacer Firebase Auth par Supabase Auth

**Avant (Firebase):**
```typescript
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

const { user } = await signInWithEmailAndPassword(auth, email, password);
```

**Après (Supabase):**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

#### 2. Remplacer Firestore par Supabase Database

**Avant (Firestore):**
```typescript
import { adminDb } from '@/lib/firebase/admin';

const snapshot = await adminDb
  .collection('generations')
  .where('userId', '==', userId)
  .get();
```

**Après (Supabase):**
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();
const { data, error } = await supabase
  .from('generations')
  .select('*')
  .eq('user_id', userId);
```

#### 3. Remplacer Firebase Storage par Supabase Storage

**Avant (Firebase Storage):**
```typescript
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';

const storageRef = ref(storage, `uploads/${userId}/${filename}`);
await uploadBytes(storageRef, file);
```

**Après (Supabase Storage):**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.storage
  .from('input-images')
  .upload(`${userId}/${filename}`, file);

const publicUrl = supabase.storage
  .from('input-images')
  .getPublicUrl(data.path).data.publicUrl;
```

#### 4. Realtime (Firestore → Supabase)

**Avant (Firestore):**
```typescript
const unsubscribe = onSnapshot(
  doc(db, 'generations', generationId),
  (doc) => {
    console.log('Data:', doc.data());
  }
);
```

**Après (Supabase):**
```typescript
const supabase = createClient();

const channel = supabase
  .channel('generation-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'generations',
      filter: `id=eq.${generationId}`,
    },
    (payload) => {
      console.log('Data:', payload.new);
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

### Phase 6: Adapter les API Routes (⏱️ 1-2h)

#### Exemple: POST /api/generate

**Avant (Firebase):**
```typescript
import { adminDb } from '@/lib/firebase/admin';

// Déduire crédit
const userDoc = await adminDb.collection('users').doc(userId).get();
const credits = userDoc.data()?.credits || 0;

if (credits < 1) {
  return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
}

await adminDb.collection('users').doc(userId).update({
  credits: credits - 1,
});
```

**Après (Supabase):**
```typescript
import { createAdminClient } from '@/lib/supabase/server';

const supabase = createAdminClient();

// Déduire crédit (fonction RPC atomique)
const { data, error } = await supabase.rpc('deduct_credits', {
  p_user_id: userId,
  p_amount: 1,
  p_generation_id: generationId,
});

if (error) {
  return NextResponse.json(
    { error: error.message },
    { status: error.message.includes('insuffisants') ? 402 : 500 }
  );
}
```

---

### Phase 7: Middleware (⏱️ 15 min)

- [ ] **Remplacer Firebase Middleware par Supabase:**

**Fichier: `middleware.ts` (racine)**
```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

### Phase 8: Tests & Validation (⏱️ 1h)

#### Checklist de tests

- [ ] **Auth:**
  - [ ] Inscription fonctionne (email + password)
  - [ ] Profil créé automatiquement avec 3 crédits
  - [ ] Login fonctionne
  - [ ] Logout fonctionne
  - [ ] Middleware protège les routes

- [ ] **Dashboard:**
  - [ ] Affiche les générations de l'utilisateur
  - [ ] Affiche le nombre de crédits
  - [ ] Realtime fonctionne (UPDATE generation)

- [ ] **Génération:**
  - [ ] Upload image → Supabase Storage
  - [ ] Crédit déduit (fonction RPC)
  - [ ] Génération créée dans DB
  - [ ] Replicate appelé
  - [ ] Status mis à jour (pending → processing → completed)
  - [ ] Output image uploadée dans Storage

- [ ] **Crédits:**
  - [ ] Paiement Stripe ajoute des crédits (fonction RPC)
  - [ ] Transactions loguées dans `credit_transactions`

- [ ] **HD Unlock:**
  - [ ] Paiement 4.99€ fonctionne
  - [ ] `hd_unlocked` = true dans DB
  - [ ] Téléchargement HD disponible

---

### Phase 9: Déploiement (⏱️ 30 min)

- [ ] **Ajouter les variables Supabase sur Vercel:**
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
  ```

- [ ] **Supprimer les variables Firebase:**
  ```bash
  # Supprimer sur Vercel
  NEXT_PUBLIC_FIREBASE_API_KEY
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  etc.
  ```

- [ ] **Déployer:**
  ```bash
  npx vercel --prod
  ```

- [ ] **Tester en production:**
  - Inscription
  - Génération
  - Paiement

---

## 🔥 Nettoyage Firebase (Optionnel)

Une fois la migration validée:

- [ ] Exporter les données Firebase (backup)
- [ ] Supprimer le projet Firebase
- [ ] Supprimer les dépendances:
  ```bash
  npm uninstall firebase firebase-admin
  ```
- [ ] Supprimer les fichiers:
  - `lib/firebase/`
  - `firebase-service-account.json`
  - `firestore.rules`
  - `firestore.indexes.json`

---

## 📊 Comparaison Avant/Après

| Métrique | Firebase | Supabase |
|----------|----------|----------|
| **Auth** | Firebase Auth | Supabase Auth (JWT) |
| **Database** | Firestore (NoSQL) | PostgreSQL (SQL) |
| **Realtime** | Websockets | Postgres LISTEN/NOTIFY |
| **Storage** | Firebase Storage | S3-compatible |
| **Fonctions** | Cloud Functions | Database Functions (RPC) |
| **Coût moyen/mois** | ~$50-100 | ~$25 (Pro plan) |
| **Requêtes complexes** | Limitées | SQL complet |
| **Transactions** | Limitées | ACID complètes |

---

## 🆘 Troubleshooting

### Erreur: "Invalid JWT"
→ Vérifier que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est bien configurée

### Erreur: "Row Level Security policy violation"
→ Vérifier que les policies RLS sont activées et correctes

### Erreur: "Could not find function deduct_credits"
→ Exécuter le script SQL de migration

### Images ne s'affichent pas
→ Vérifier les policies du bucket Storage

---

**Temps total estimé:** 6-8 heures  
**Difficulté:** Moyenne  
**Mainteneur:** @gabrielmoustadrif
