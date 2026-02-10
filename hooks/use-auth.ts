'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getCredits } from '@/src/presentation/api/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Récupérer l'utilisateur authentifié (vérifié via le serveur Supabase)
    const getInitialSession = async () => {
      try {
        // ✅ getUser() valide le token côté serveur au lieu de juste lire le JWT local
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        // Récupérer la session pour les métadonnées de session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Écouter les crédits en temps réel
  useEffect(() => {
    if (!user?.id) {
      setCredits(0);
      return;
    }

    // Récupérer les crédits via l'API (auth via cookie)
    const fetchCreditsData = async () => {
      try {
        const response = await getCredits();
        setCredits(response.credits);
      } catch (error) {
        console.error('[Auth] Error fetching credits from API:', error);
        
        // Fallback: Essayer via Supabase direct (si RLS fonctionne)
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setCredits(profile.credits);
        }
      }
    };

    fetchCreditsData();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Auth] Credits updated:', payload.new);
          setCredits((payload.new as { credits: number }).credits || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { 
    user, 
    session,
    loading, 
    credits, 
    signOut,
    // Alias pour compatibilité avec les anciens composants
    uid: user?.id,
    email: user?.email,
  };
}
