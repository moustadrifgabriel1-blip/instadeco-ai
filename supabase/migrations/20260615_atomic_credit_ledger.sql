-- ============================================
-- CRÉDITS : opérations ATOMIQUES solde + grand livre (credit_transactions)
-- ============================================
-- Contexte / bugs corrigés :
--  1) Le repo écrivait le solde (RPC) PUIS la ligne credit_transactions en 2 étapes
--     séparées, sans attendre le résultat de l'insert → divergence possible.
--  2) PIRE : l'insert ciblait la colonne `stripe_session_id` (INEXISTANTE — la vraie
--     colonne est `stripe_payment_intent`) et l'erreur était avalée → le grand livre
--     n'était JAMAIS écrit (credit_transactions vide).
--
-- Solution : 2 NOUVELLES fonctions (non destructif — on ne touche pas aux
-- increment_credits/deduct_credits existantes) qui font solde + insert ledger dans
-- UNE SEULE transaction, avec la BONNE colonne. SECURITY DEFINER + search_path figé.
-- Le repo bascule dessus. Réservé à service_role (le repo utilise le client admin).

-- ---- Ajout de crédits (achat, remboursement, bonus) ----
CREATE OR REPLACE FUNCTION public.add_credits_with_ledger(
  user_id_input uuid,
  amount_input integer,
  type_input text,
  description_input text,
  stripe_ref_input text DEFAULT NULL,
  generation_id_input uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE profiles
     SET credits = credits + amount_input, updated_at = now()
   WHERE id = user_id_input
   RETURNING credits INTO new_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_input;
  END IF;

  INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_intent, generation_id)
  VALUES (user_id_input, amount_input, type_input, description_input, stripe_ref_input, generation_id_input);

  RETURN new_balance;
END;
$$;

-- ---- Déduction de crédits (génération) ----
-- Verrou ligne (FOR UPDATE) + sentinelle -1 si solde insuffisant (convention préservée).
CREATE OR REPLACE FUNCTION public.deduct_credits_with_ledger(
  user_id_input uuid,
  amount_input integer,
  type_input text,
  description_input text,
  generation_id_input uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
  new_balance integer;
BEGIN
  SELECT credits INTO current_balance
    FROM profiles
   WHERE id = user_id_input
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', user_id_input;
  END IF;

  IF current_balance < amount_input THEN
    RETURN -1; -- crédits insuffisants
  END IF;

  new_balance := current_balance - amount_input;

  UPDATE profiles
     SET credits = new_balance, updated_at = now()
   WHERE id = user_id_input;

  INSERT INTO credit_transactions (user_id, amount, type, description, generation_id)
  VALUES (user_id_input, -amount_input, type_input, description_input, generation_id_input);

  RETURN new_balance;
END;
$$;

-- ---- Contrainte CHECK type : aligner sur le vocabulaire du code ----
-- L'ancienne contrainte autorisait {purchase, deduction, refund, bonus} mais le code
-- (entité CreditTransactionType) utilise 'generation' → tout insert de déduction violait
-- la contrainte (2e cause du grand livre vide). On passe en SURENSEMBLE (ajoute
-- 'generation', garde 'deduction' par sécurité). Table vide (0 ligne) → aucun risque data.
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check
  CHECK (type = ANY (ARRAY['purchase', 'generation', 'deduction', 'refund', 'bonus']::text[]));

-- Permissions : service_role uniquement (le repo passe par le client admin).
REVOKE ALL ON FUNCTION public.add_credits_with_ledger(uuid, integer, text, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.deduct_credits_with_ledger(uuid, integer, text, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_credits_with_ledger(uuid, integer, text, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits_with_ledger(uuid, integer, text, text, uuid) TO service_role;
