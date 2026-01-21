'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export function CreditBadge() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    // Récupérer les crédits initiaux
    const fetchCredits = async () => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[CreditBadge] Error fetching credits:', error);
        setCredits(0);
      } else {
        setCredits(profile?.credits || 0);
      }
      setLoading(false);
    };

    fetchCredits();

    // Écouter les changements en temps réel
    const channel = supabase
      .channel(`credits-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[CreditBadge] Credits updated:', payload.new);
          setCredits((payload.new as { credits: number }).credits || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

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
