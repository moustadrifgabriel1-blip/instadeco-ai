'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export interface ReferralStats {
  totalReferred: number;
  totalCreditsEarned: number;
}

/**
 * Charge les informations de parrainage de l'utilisateur (code + stats).
 * Partagé entre l'onglet Parrainage, l'onglet Créations (ShareButtons) et le
 * badge de la sidebar.
 */
export function useReferral(user: User | null) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalCreditsEarned: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetch(`/api/v2/referral?userId=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.referralCode) setReferralCode(data.referralCode);
        setReferralStats({
          totalReferred: data.totalReferred || 0,
          totalCreditsEarned: data.totalCreditsEarned || 0,
        });
      })
      .catch(() => {});
  }, [user]);

  return { referralCode, referralStats };
}
