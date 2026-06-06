'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseBrowser } from '@/hooks/use-supabase-browser';
import { useGenerations } from '@/src/presentation/hooks/useGenerations';
import { useCredits } from '@/src/presentation/hooks/useCredits';
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader';
import { DashboardSidebar } from '@/components/features/dashboard/DashboardSidebar';
import { GenerationsTab } from '@/components/features/dashboard/GenerationsTab';
import { AccountTab } from '@/components/features/dashboard/AccountTab';
import { SecurityTab } from '@/components/features/dashboard/SecurityTab';
import { ReferralTab } from '@/components/features/dashboard/ReferralTab';
import { useReferral } from '@/components/features/dashboard/useReferral';
import type { ActiveTab } from '@/components/features/dashboard/types';

/**
 * Page Dashboard — pur orchestrateur.
 *
 * Toute la logique vit dans des hooks (useReferral, useProfileSettings,
 * usePasswordChange, useAccountActions) et le rendu dans des sous-composants
 * par onglet (components/features/dashboard/*). La page ne fait que câbler
 * l'auth, les données globales (générations, crédits, parrainage) et router
 * entre les onglets.
 */
export default function DashboardPageV2() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabaseBrowser();
  const router = useRouter();

  const { generations, state: generationsState, refetch: refetchGenerations } = useGenerations({ limit: 50 });
  const { credits, state: creditsState } = useCredits();
  const { referralCode, referralStats } = useReferral(user);

  const [activeTab, setActiveTab] = useState<ActiveTab>('generations');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Redirection si non authentifié.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  if (authLoading || generationsState.isLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1d1d1f] mx-auto" />
          <p className="mt-4 text-[#636366]">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      <DashboardHeader
        credits={credits}
        creditsLoading={creditsState.isLoading}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <DashboardSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            referredCount={referralStats.totalReferred}
          />

          <main className="flex-1">
            {activeTab === 'generations' && (
              <GenerationsTab
                generations={generations}
                refetchGenerations={refetchGenerations}
                referralCode={referralCode}
              />
            )}
            {activeTab === 'account' && (
              <AccountTab
                user={user}
                supabase={supabase}
                credits={credits}
                generationsCount={generations.length}
                onAccountDeleted={() => router.push('/')}
              />
            )}
            {activeTab === 'security' && <SecurityTab user={user} supabase={supabase} />}
            {activeTab === 'referral' && (
              <ReferralTab referralCode={referralCode} referralStats={referralStats} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
