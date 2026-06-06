'use client';

import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { getCredits } from '@/src/presentation/api/client';
import { useSupabaseBrowser } from '@/hooks/use-supabase-browser';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const router = useRouter();
  const supabase = useSupabaseBrowser();

  const hasSupabaseEnv =
    typeof process !== 'undefined' &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }
    if (!supabase) {
      return;
    }

    let cancelled = false;

    const getInitialSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(user);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(session);
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hasSupabaseEnv, supabase]);

  useEffect(() => {
    if (!hasSupabaseEnv || !supabase || !user?.id) {
      if (!user?.id) {
        setCredits(0);
      }
      return;
    }

    const fetchCreditsData = async () => {
      try {
        const response = await getCredits();
        setCredits(response.credits);
      } catch (error) {
        console.error('[Auth] Error fetching credits from API:', error);

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

    void fetchCreditsData();

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
          setCredits((payload.new as { credits: number }).credits || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasSupabaseEnv, user?.id, supabase]);

  const signOut = async () => {
    if (!supabase) return;
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
    uid: user?.id,
    email: user?.email,
  };
}
