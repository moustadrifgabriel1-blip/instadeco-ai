-- Migration: Fix function_search_path_mutable warnings
-- Corrige le search_path pour toutes les fonctions publiques
-- Référence: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================================
-- 1. deduct_credits(UUID, INT, UUID) — from 00001_initial_schema
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INT DEFAULT 1,
  p_generation_id UUID DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_current_credits INT;
  v_new_credits INT;
BEGIN
  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Crédits insuffisants (%, requis: %)', v_current_credits, p_amount;
  END IF;

  UPDATE public.profiles
  SET credits = credits - p_amount, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits INTO v_new_credits;

  INSERT INTO public.credit_transactions (user_id, amount, type, generation_id, description)
  VALUES (p_user_id, -p_amount, 'deduction', p_generation_id, 'Génération IA');

  RETURN json_build_object(
    'success', true,
    'previous_credits', v_current_credits,
    'new_credits', v_new_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- 2. deduct_credits(UUID, INTEGER) — from 20260209_atomic_credits
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_credits(user_id_input UUID, amount_input INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  SELECT credits INTO current_balance
  FROM public.profiles
  WHERE id = user_id_input
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_input;
  END IF;

  IF current_balance < amount_input THEN
    RETURN -1;
  END IF;

  new_balance := current_balance - amount_input;

  UPDATE public.profiles 
  SET credits = new_balance,
      updated_at = NOW()
  WHERE id = user_id_input;

  RETURN new_balance;
END;
$$;

-- ============================================================
-- 3. generate_referral_code() — from 20260209_referral_system
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(md5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ============================================================
-- 4. update_backlink_updated_at() — from 20260208_backlink_outreach
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_backlink_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ============================================================
-- 5. update_updated_at_column() — from 00001_initial_schema
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ============================================================
-- 6. increment_credits(UUID, INTEGER) — from 20260209_atomic_credits
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_credits(user_id_input UUID, amount_input INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.profiles 
  SET credits = credits + amount_input,
      updated_at = NOW()
  WHERE id = user_id_input
  RETURNING credits INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_input;
  END IF;

  RETURN new_balance;
END;
$$;

-- ============================================================
-- 7. update_blog_articles_updated_at() — from 20260120_create_blog_articles
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_blog_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ============================================================
-- 8. handle_new_user() — from 00001_initial_schema
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    3
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- 9. add_credits(UUID, INT, TEXT, TEXT) — from 00001_initial_schema
-- ============================================================
CREATE OR REPLACE FUNCTION public.add_credits(
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
  UPDATE public.profiles
  SET credits = credits + p_amount, updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits - p_amount, credits INTO v_current_credits, v_new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur introuvable';
  END IF;

  INSERT INTO public.credit_transactions (
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================================
-- 10. refund_credit(UUID) — from 00001_initial_schema
-- ============================================================
CREATE OR REPLACE FUNCTION public.refund_credit(
  p_generation_id UUID
)
RETURNS json AS $$
DECLARE
  v_user_id UUID;
  v_new_credits INT;
BEGIN
  SELECT user_id INTO v_user_id
  FROM public.generations
  WHERE id = p_generation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Génération introuvable';
  END IF;

  UPDATE public.profiles
  SET credits = credits + 1, updated_at = NOW()
  WHERE id = v_user_id
  RETURNING credits INTO v_new_credits;

  INSERT INTO public.credit_transactions (user_id, amount, type, generation_id, description)
  VALUES (v_user_id, 1, 'refund', p_generation_id, 'Remboursement suite à échec');

  RETURN json_build_object(
    'success', true,
    'new_credits', v_new_credits
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
