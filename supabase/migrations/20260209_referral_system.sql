-- Migration: Système de parrainage
-- Date: 2026-02-09
-- Description: Ajout du code de parrainage aux profils et table de suivi des parrainages

-- 1. Ajouter le code de parrainage aux profils
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- 2. Générer des codes pour les profils existants
UPDATE profiles 
SET referral_code = UPPER(SUBSTRING(md5(id::text || created_at::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- 3. Trigger pour générer le code automatiquement à l'inscription
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(md5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- 4. Table des parrainages
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referrer_credits_awarded INTEGER DEFAULT 3,
  referred_credits_awarded INTEGER DEFAULT 3,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un filleul ne peut être parrainé qu'une fois
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 5. RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs propres parrainages
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Seul le service role peut insérer
-- Pas de policy INSERT pour authenticated (on passe par l'API)
