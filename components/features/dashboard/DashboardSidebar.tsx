'use client';

import Link from 'next/link';
import { ImageIcon, User, Lock, Gift, CreditCard } from 'lucide-react';
import type { ActiveTab } from './types';

interface DashboardSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  referredCount: number;
}

const baseBtn = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors';
function tabClass(active: boolean) {
  return `${baseBtn} ${active ? 'bg-[#1d1d1f] text-white' : 'text-[#1d1d1f] hover:bg-[#f5f5f7]'}`;
}

export function DashboardSidebar({ activeTab, setActiveTab, referredCount }: DashboardSidebarProps) {
  return (
    <aside className="lg:w-64 flex-shrink-0">
      <nav className="space-y-1">
        <button onClick={() => setActiveTab('generations')} className={tabClass(activeTab === 'generations')}>
          <ImageIcon className="w-5 h-5" />
          Mes créations
        </button>
        <button onClick={() => setActiveTab('account')} className={tabClass(activeTab === 'account')}>
          <User className="w-5 h-5" />
          Mon compte
        </button>
        <button onClick={() => setActiveTab('security')} className={tabClass(activeTab === 'security')}>
          <Lock className="w-5 h-5" />
          Sécurité
        </button>
        <button onClick={() => setActiveTab('referral')} className={tabClass(activeTab === 'referral')}>
          <Gift className="w-5 h-5" />
          Parrainage
          {referredCount > 0 && (
            <span className="ml-auto bg-[#E07B54] text-white text-xs px-2 py-0.5 rounded-full">
              {referredCount}
            </span>
          )}
        </button>
        <Link
          href="/pricing"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
        >
          <CreditCard className="w-5 h-5" />
          Acheter des crédits
        </Link>
      </nav>
    </aside>
  );
}
