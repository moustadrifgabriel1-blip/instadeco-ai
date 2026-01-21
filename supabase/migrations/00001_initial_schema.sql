-- ============================================
-- InstaDeco AI - Database Schema (Supabase)
-- Version: 2.0.0
-- Date: 20 janvier 2026
-- ============================================

-- ============================================
-- 1. ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. PROFILES TABLE (Extension de auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 3 NOT NULL CHECK (credits >= 0),
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  is_test_account BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour recherches par email
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

COMMENT ON TABLE profiles IS 'Profils utilisateurs étendant auth.users';
COMMENT ON COLUMN profiles.credits IS 'Crédits de génération (1 crédit = 1 génération)';
COMMENT ON COLUMN profiles.role IS 'Rôle: user (défaut) ou admin';

-- ============================================
-- 3. PROJECTS TABLE (Organisation optionnelle)
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL CHECK (room_type IN (
    'salon', 'chambre', 'cuisine', 'salle-de-bain', 'bureau', 'salle-a-manger'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

COMMENT ON TABLE projects IS 'Projets de décoration (groupement de générations)';

-- ============================================
-- 4. GENERATIONS TABLE (Cœur métier)
-- ============================================
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Configuration de la génération
  style_slug TEXT NOT NULL CHECK (style_slug IN (
    'moderne', 'minimaliste', 'boheme', 'industriel', 'classique',
    'japandi', 'midcentury', 'coastal', 'farmhouse', 'artdeco'
  )),
  room_type_slug TEXT NOT NULL,
  transform_mode TEXT DEFAULT 'full_redesign' CHECK (transform_mode IN (
    'full_redesign', 'keep_layout', 'decor_only'
  )),
  
  -- Images
  input_image_url TEXT NOT NULL,
  output_image_url TEXT,
  
  -- Prompt personnalisé (optionnel)
  custom_prompt TEXT,
  
  -- Traitement Replicate
  replicate_request_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN (
    'pending', 'processing', 'completed', 'failed'
  )),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  
  -- HD Unlock (paiement 4.99€)
  hd_unlocked BOOLEAN DEFAULT false,
  hd_unlocked_at TIMESTAMPTZ,
  stripe_session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes optimisés
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_project_id ON generations(project_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_replicate_id ON generations(replicate_request_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_generations_user_status ON generations(user_id, status);

COMMENT ON TABLE generations IS 'Générations IA de décoration d''intérieur';
COMMENT ON COLUMN generations.status IS 'pending -> processing -> completed/failed';
COMMENT ON COLUMN generations.hd_unlocked IS 'true si l''utilisateur a payé 4.99€ pour la version HD';

-- ============================================
-- 5. CREDIT_TRANSACTIONS TABLE (Audit trail)
-- ============================================
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'deduction', 'refund', 'bonus')),
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  stripe_payment_intent TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_transactions_type ON credit_transactions(type);
CREATE INDEX idx_transactions_created_at ON credit_transactions(created_at DESC);

COMMENT ON TABLE credit_transactions IS 'Historique des transactions de crédits';
COMMENT ON COLUMN credit_transactions.amount IS 'Positif pour ajout, négatif pour déduction';

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES =====
-- Lecture: Uniquement son propre profil
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Mise à jour: Uniquement son propre profil (champs limités)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Empêcher la modification des crédits et du rôle
    credits = (SELECT credits FROM profiles WHERE id = auth.uid()) AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admin: Accès complet
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===== PROJECTS =====
CREATE POLICY "Users can read own projects" ON projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ===== GENERATIONS =====
CREATE POLICY "Users can read own generations" ON generations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generations" ON generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generations" ON generations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ===== CREDIT_TRANSACTIONS =====
-- Lecture seule pour l'utilisateur
CREATE POLICY "Users can read own transactions" ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- 7. FUNCTIONS (RPC)
-- ============================================

-- Déduire des crédits (atomique)
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INT DEFAULT 1,
  p_generation_id UUID DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_current_credits INT;
  v_new_credits INT;
BEGIN
  -- Vérifier les crédits actuels
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- Lock la ligne pour éviter les race conditions
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;
  
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Crédits insuffisants (%, requis: %)', v_current_credits, p_amount;
  END IF;
  
  -- Déduire les crédits
  UPDATE profiles
  SET credits = credits - p_amount, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;
  
  -- Logger la transaction
  INSERT INTO credit_transactions (user_id, amount, type, generation_id, description)
  VALUES (p_user_id, -p_amount, 'deduction', p_generation_id, 'Génération IA');
  
  RETURN json_build_object(
    'success', true,
    'previous_credits', v_current_credits,
    'new_credits', v_new_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deduct_credits IS 'Déduit des crédits de manière atomique (transactionnelle)';

-- Ajouter des crédits (paiement Stripe)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INT,
  p_payment_intent TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Achat de crédits'
)
RETURNS json AS $$
DECLARE
  v_current_credits INT;
  v_new_credits INT;
BEGIN
  -- Ajouter les crédits
  UPDATE profiles
  SET credits = credits + p_amount, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits - p_amount, credits INTO v_current_credits, v_new_credits;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;
  
  -- Logger la transaction
  INSERT INTO credit_transactions (
    user_id, amount, type, stripe_payment_intent, description
  )
  VALUES (
    p_user_id, p_amount, 'purchase', p_payment_intent, p_description
  );
  
  RETURN json_build_object(
    'success', true,
    'previous_credits', v_current_credits,
    'new_credits', v_new_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_credits IS 'Ajoute des crédits suite à un paiement Stripe';

-- Rembourser un crédit (génération échouée)
CREATE OR REPLACE FUNCTION refund_credit(
  p_generation_id UUID
)
RETURNS json AS $$
DECLARE
  v_user_id UUID;
  v_new_credits INT;
BEGIN
  -- Récupérer l'user_id de la génération
  SELECT user_id INTO v_user_id
  FROM generations
  WHERE id = p_generation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Génération introuvable';
  END IF;
  
  -- Rembourser 1 crédit
  UPDATE profiles
  SET credits = credits + 1, updated_at = NOW()
  WHERE id = v_user_id
  RETURNING credits INTO v_new_credits;
  
  -- Logger la transaction
  INSERT INTO credit_transactions (user_id, amount, type, generation_id, description)
  VALUES (v_user_id, 1, 'refund', p_generation_id, 'Remboursement suite à échec');
  
  RETURN json_build_object(
    'success', true,
    'new_credits', v_new_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refund_credit IS 'Rembourse 1 crédit en cas d''échec de génération';

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-création du profil lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    3 -- 3 crédits gratuits à l'inscription
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users (Supabase Auth)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 9. STORAGE POLICIES (Buckets)
-- ============================================

-- Bucket: input-images
-- Policy: Upload uniquement dans son dossier user_id/
-- Note: À créer via le dashboard Supabase ou via code

-- Bucket: output-images
-- Policy: Lecture uniquement pour le propriétaire
-- Note: À créer via le dashboard Supabase ou via code

-- ============================================
-- 10. SEED DATA (Développement)
-- ============================================

-- Exemple: Créer un utilisateur admin de test
-- (À exécuter manuellement si besoin)
/*
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'admin@instadeco.app',
  crypt('password123', gen_salt('bf')),
  NOW()
);

UPDATE profiles
SET role = 'admin', credits = 9999, is_test_account = true
WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
*/

-- ============================================
-- FIN DU SCHÉMA
-- ============================================

-- Vérifier que tout est OK
DO $$ 
BEGIN
  RAISE NOTICE '✅ Schéma InstaDeco créé avec succès !';
  RAISE NOTICE '📊 Tables: profiles, projects, generations, credit_transactions';
  RAISE NOTICE '🔐 RLS activé sur toutes les tables';
  RAISE NOTICE '⚡ Functions: deduct_credits, add_credits, refund_credit';
  RAISE NOTICE '🎯 Triggers: auto profile creation, updated_at';
END $$;
