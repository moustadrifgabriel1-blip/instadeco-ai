'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';

export function CreditBadge() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    // Écoute en temps réel du solde de crédits
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        console.log('[CreditBadge] Document snapshot:', doc.exists(), doc.data());
        if (doc.exists()) {
          const creditsValue = doc.data().credits || 0;
          console.log('[CreditBadge] Credits found:', creditsValue);
          setCredits(creditsValue);
        } else {
          console.warn('[CreditBadge] ⚠️ User document does not exist in Firestore!');
          setCredits(0);
        }
        setLoading(false);
      },
      (error) => {
        console.error('[CreditBadge] Error fetching credits:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-[#fbfbfd] border border-[#d2d2d7] rounded-full">
        <div className="w-2 h-2 bg-[#86868b] rounded-full animate-pulse"></div>
        <span className="text-sm text-[#86868b]">Chargement...</span>
      </div>
    );
  }

  if (!user || credits === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#fbfbfd] border border-[#d2d2d7] rounded-full hover:border-[#1d1d1f] transition-colors">
      <div className={`w-2 h-2 rounded-full ${credits > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className="text-sm font-medium text-[#1d1d1f]">
        {credits} {credits > 1 ? 'crédits' : 'crédit'}
      </span>
      {credits === 0 && (
        <a 
          href="/pricing" 
          className="ml-2 text-xs text-blue-600 hover:underline"
        >
          Recharger
        </a>
      )}
    </div>
  );
}
