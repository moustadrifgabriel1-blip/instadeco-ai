'use client';

import Link from 'next/link';
import { Coins, User, ChevronDown, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  credits: number;
  creditsLoading: boolean;
  showUserMenu: boolean;
  setShowUserMenu: (open: boolean) => void;
  onLogout: () => void;
}

export function DashboardHeader({
  credits,
  creditsLoading,
  showUserMenu,
  setShowUserMenu,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="border-b border-[var(--gold-line)] bg-card/80 backdrop-blur-xl sticky top-0 z-50 pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="prestige-display text-lg sm:text-[21px] font-semibold text-foreground">
          InstaDeco
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
            <Coins className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {creditsLoading ? '...' : credits}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-muted-foreground" />
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-2">
                <button
                  onClick={onLogout}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
