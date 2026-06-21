'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseBrowser } from '@/hooks/use-supabase-browser';

/**
 * Renvoie la formule de l'utilisateur connecté et, surtout, si elle est
 * ILLIMITÉE (Pro/Agence actif). Permet d'afficher « Illimité » au lieu d'un
 * solde de crédits là où un compteur n'a pas de sens (header, compte).
 */
export function usePlan() {
  const { user } = useAuth();
  const supabase = useSupabaseBrowser();
  const [proStatus, setProStatus] = useState<string | null>(null);
  const [proPlan, setProPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase || !user) {
        if (active) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('pro_status, pro_plan')
        .eq('id', user.id)
        .single();
      if (!active) return;
      setProStatus((data?.pro_status as string) ?? null);
      setProPlan((data?.pro_plan as string) ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase, user]);

  const isUnlimited = proStatus === 'active' && (proPlan === 'pro' || proPlan === 'agence');

  return { proStatus, proPlan, isUnlimited, loading };
}
