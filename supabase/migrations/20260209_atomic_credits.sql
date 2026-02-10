-- ============================================
-- Migration: Atomic credit operations
-- Date: 2026-02-09
-- Description: Ajoute des fonctions RPC PostgreSQL pour des opérations
--              de crédits atomiques (évite les race conditions)
-- ============================================

-- Fonction pour incrémenter les crédits de manière atomique
CREATE OR REPLACE FUNCTION increment_credits(user_id_input UUID, amount_input INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles 
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

-- Fonction pour déduire les crédits de manière atomique
-- Retourne -1 si crédits insuffisants, sinon le nouveau solde
CREATE OR REPLACE FUNCTION deduct_credits(user_id_input UUID, amount_input INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance INTEGER;
  new_balance INTEGER;
BEGIN
  -- Verrouiller la ligne pour éviter les race conditions
  SELECT credits INTO current_balance
  FROM profiles
  WHERE id = user_id_input
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_input;
  END IF;
  
  -- Vérifier le solde
  IF current_balance < amount_input THEN
    RETURN -1; -- Crédits insuffisants
  END IF;
  
  -- Déduire
  new_balance := current_balance - amount_input;
  
  UPDATE profiles 
  SET credits = new_balance,
      updated_at = NOW()
  WHERE id = user_id_input;
  
  RETURN new_balance;
END;
$$;

-- Permissions : accessible via service_role et les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION increment_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION increment_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER) TO authenticated;
