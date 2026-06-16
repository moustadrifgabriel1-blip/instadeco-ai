'use client';

import Link from 'next/link';
import { ImageIcon, User, Lock, Gift, CreditCard, Users } from 'lucide-react';
import type { ActiveTab } from './types';

interface DashboardSidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  referredCount: number;
}

const baseBtn = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors';
function tabClass(active: boolean) {
  return `${baseBtn} ${active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted'}`;
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
        <button onClick={() => setActiveTab('team')} className={tabClass(activeTab === 'team')}>
          <Users className="w-5 h-5" />
          Équipe
        </button>
        <button onClick={() => setActiveTab('referral')} className={tabClass(activeTab === 'referral')}>
          <Gift className="w-5 h-5" />
          Parrainage
          {referredCount > 0 && (
            <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {referredCount}
            </span>
          )}
        </button>
        <Link
          href="/pricing"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-foreground hover:bg-muted transition-colors"
        >
          <CreditCard className="w-5 h-5" />
          Acheter des crédits
        </Link>
      </nav>
    </aside>
  );
}
