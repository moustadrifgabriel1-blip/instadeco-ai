# 🏗️ Architecture InstaDeco - Supabase Edition

**Stack:** Next.js 15 (App Router) + Supabase + Replicate AI + Stripe + Tailwind CSS

---

## 📊 Database Schema (PostgreSQL)

### Tables Principales

#### 1. **profiles** (Extension de auth.users)
```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 3 NOT NULL CHECK (credits >= 0),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_test_account BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Trigger:** Auto-création du profil lors de l'inscription via trigger sur `auth.users`.

---

#### 2. **projects** (Organisation des générations)
```sql
projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN ('salon', 'chambre', 'cuisine', 'salle-de-bain', 'bureau', 'salle-a-manger')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Index:** `idx_projects_user_id` sur `user_id` pour optimiser les requêtes par utilisateur.

---

#### 3. **generations** (Cœur métier - Générations IA)
```sql
generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Input
  style_slug TEXT NOT NULL CHECK (style_slug IN ('moderne', 'minimaliste', 'boheme', 'industriel', 'classique', 'japandi', 'midcentury', 'coastal', 'farmhouse', 'artdeco')),
  room_type_slug TEXT NOT NULL,
  transform_mode TEXT DEFAULT 'full_redesign' CHECK (transform_mode IN ('full_redesign', 'keep_layout', 'decor_only')),
  input_image_url TEXT NOT NULL,
  custom_prompt TEXT,
  
  -- Processing
  replicate_request_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Output
  output_image_url TEXT,
  error_message TEXT,
  
  -- HD Unlock
  hd_unlocked BOOLEAN DEFAULT false,
  hd_unlocked_at TIMESTAMPTZ,
  stripe_session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Indexes:**
- `idx_generations_user_id` sur `user_id`
- `idx_generations_status` sur `status` pour le polling
- `idx_generations_replicate_id` sur `replicate_request_id` (UNIQUE)

---

#### 4. **credit_transactions** (Audit Trail)
```sql
credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'deduction', 'refund', 'bonus')),
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  stripe_payment_intent TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Index:** `idx_transactions_user_id` sur `user_id`.

---

## 🔐 Row Level Security (RLS)

### Profiles
```sql
-- Lecture: Uniquement son propre profil
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Mise à jour: Uniquement son profre profil (sauf crédits et rôle)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Generations
```sql
-- Lecture: Uniquement ses propres générations
CREATE POLICY "Users can read own generations" ON generations
  FOR SELECT USING (auth.uid() = user_id);

-- Insertion: Uniquement pour soi-même
CREATE POLICY "Users can create own generations" ON generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mise à jour: Uniquement ses propres générations
CREATE POLICY "Users can update own generations" ON generations
  FOR UPDATE USING (auth.uid() = user_id);
```

### Credit Transactions
```sql
-- Lecture seule pour l'utilisateur
CREATE POLICY "Users can read own transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 📁 Storage Buckets

### 1. **input-images** (Images uploadées par les utilisateurs)
**Policy:**
```sql
-- Upload: Seulement dans son propre dossier user_id/
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'input-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lecture: Tous peuvent lire (pour affichage dans l'UI)
CREATE POLICY "Anyone can read input images" ON storage.objects
  FOR SELECT USING (bucket_id = 'input-images');
```

**Structure:** `input-images/{user_id}/{timestamp}-{random}.jpg`

---

### 2. **output-images** (Images générées par Replicate)
**Policy:**
```sql
-- Upload: Service role uniquement (backend)
-- Lecture: Propriétaire ou achat HD vérifié
CREATE POLICY "Users can read own output images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'output-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

**Structure:** `output-images/{user_id}/{generation_id}.jpg`

---

## 🔄 Realtime Subscriptions

### Frontend Dashboard
```typescript
// Écouter les changements de statut en temps réel
supabase
  .channel('generations-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'generations',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Generation updated:', payload.new);
      if (payload.new.status === 'completed') {
        showNotification('Votre décoration est prête !');
      }
    }
  )
  .subscribe();
```

---

## 🛠️ Architecture de Code

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx              # Auth UI avec Supabase Auth
│   └── signup/
│       └── page.tsx
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx              # Liste générations avec Realtime
│   └── projects/
│       └── [id]/page.tsx
├── (marketing)/
│   ├── page.tsx                  # Landing
│   └── pricing/page.tsx
└── api/
    ├── generate/
    │   └── route.ts              # POST - Créer génération + déduire crédit
    ├── generations/
    │   └── [id]/
    │       └── status/route.ts   # GET - Polling Replicate
    ├── hd-unlock/
    │   ├── create-checkout/route.ts
    │   └── download/route.ts
    └── webhooks/
        ├── stripe/route.ts       # Stripe webhooks (crédits)
        └── replicate/route.ts    # Replicate callback (màj status)

lib/
├── supabase/
│   ├── server.ts                 # Server Component client
│   ├── client.ts                 # Client Component client
│   └── middleware.ts             # Auth middleware
├── ai/
│   └── replicate.ts              # Client Replicate
├── payments/
│   └── stripe.ts                 # Client Stripe
└── validations/
    └── schemas.ts                # Zod schemas

middleware.ts                     # Auth + RLS refresh
```

---

## 🔧 Configuration Supabase

### Variables d'Environnement
```bash
# Supabase (depuis supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # PRIVÉ

# Replicate AI
REPLICATE_API_TOKEN=r8_xxxxx

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App
NEXT_PUBLIC_APP_URL=https://instadeco.app
```

---

## 🚀 Flux de Génération

### 1. **Upload Image**
```typescript
// Client Side
const { data, error } = await supabase.storage
  .from('input-images')
  .upload(`${userId}/${Date.now()}-${file.name}`, file);

const publicUrl = supabase.storage
  .from('input-images')
  .getPublicUrl(data.path).data.publicUrl;
```

### 2. **Créer Génération**
```typescript
// API Route (Server Side)
// 1. Vérifier les crédits
const { data: profile } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', userId)
  .single();

if (profile.credits < 1) {
  return NextResponse.json({ error: 'Crédits insuffisants' }, { status: 402 });
}

// 2. Déduire 1 crédit (fonction RPC)
await supabase.rpc('deduct_credits', { 
  user_id: userId, 
  amount: 1 
});

// 3. Créer la génération
const { data: generation } = await supabase
  .from('generations')
  .insert({
    user_id: userId,
    style_slug,
    room_type_slug,
    input_image_url: publicUrl,
    status: 'pending'
  })
  .select()
  .single();

// 4. Appeler Replicate
const prediction = await replicate.predictions.create({
  model: 'black-forest-labs/flux-canny-pro',
  input: { /* ... */ }
});

// 5. Mettre à jour avec replicate_request_id
await supabase
  .from('generations')
  .update({ 
    replicate_request_id: prediction.id,
    status: 'processing'
  })
  .eq('id', generation.id);
```

### 3. **Polling Replicate (Backend)**
```typescript
// API Route GET /api/generations/[id]/status
const prediction = await replicate.predictions.get(replicateId);

if (prediction.status === 'succeeded') {
  // Upload output vers Supabase Storage
  const { data: uploadData } = await supabase.storage
    .from('output-images')
    .upload(`${userId}/${generationId}.jpg`, outputImageBlob);
  
  // Màj génération
  await supabase
    .from('generations')
    .update({
      status: 'completed',
      output_image_url: outputPublicUrl,
      completed_at: new Date().toISOString()
    })
    .eq('id', generationId);
}
```

---

## 📊 Fonctions RPC (PostgreSQL)

### `deduct_credits(user_id UUID, amount INT)`
```sql
CREATE OR REPLACE FUNCTION deduct_credits(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  -- Vérifier que l'utilisateur a assez de crédits
  IF (SELECT credits FROM profiles WHERE id = user_id) < amount THEN
    RAISE EXCEPTION 'Crédits insuffisants';
  END IF;
  
  -- Déduire les crédits
  UPDATE profiles 
  SET credits = credits - amount, updated_at = NOW()
  WHERE id = user_id;
  
  -- Logger la transaction
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (user_id, -amount, 'deduction', 'Génération IA');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### `add_credits(user_id UUID, amount INT, payment_intent TEXT)`
```sql
CREATE OR REPLACE FUNCTION add_credits(
  user_id UUID, 
  amount INT,
  payment_intent TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET credits = credits + amount, updated_at = NOW()
  WHERE id = user_id;
  
  INSERT INTO credit_transactions (user_id, amount, type, stripe_payment_intent, description)
  VALUES (user_id, amount, 'purchase', payment_intent, 'Achat de crédits');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔐 Triggers

### Auto-create Profile
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Update `updated_at` automatiquement
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🎯 Avantages Supabase vs Firebase

| Fonctionnalité | Firebase | Supabase |
|----------------|----------|----------|
| **Database** | NoSQL (Firestore) | PostgreSQL (SQL) |
| **Relations** | Manuelles (refs) | Foreign Keys natives |
| **Transactions** | Limitées | ACID complètes |
| **Requêtes complexes** | Limitées | SQL complet (JOINs, CTEs) |
| **Realtime** | Websockets propriétaires | Postgres LISTEN/NOTIFY |
| **Auth** | Propriétaire | JWT + Row Level Security |
| **Storage** | Firebase Storage | S3-compatible |
| **Prix** | Pay-per-operation | Pay-per-storage |
| **Migrations** | Manuelles | SQL migrations versionnées |

---

## 📝 Notes Importantes

1. **Sécurité:** Toutes les opérations sensibles (crédits, paiements) doivent passer par des fonctions RPC `SECURITY DEFINER`.
2. **Realtime:** Utiliser les subscriptions Postgres pour le feedback temps réel (pas de polling côté client).
3. **Storage:** Les URLs publiques Supabase expirent après 1h si le bucket est privé. Pour les output images, utiliser des signed URLs.
4. **Migrations:** Utiliser `supabase db diff` pour générer les migrations automatiquement.

---

**Version:** 2.0.0 (Supabase Edition)  
**Date:** 20 janvier 2026  
**Mainteneur:** @gabrielmoustadrif
