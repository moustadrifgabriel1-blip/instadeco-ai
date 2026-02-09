/**
 * Composant: Header
 * 
 * Navigation principale du site InstaDeco AI.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, BookOpen, CreditCard, Home, Wand2, User as UserIcon, Plus, LayoutGrid, Building2, Eye } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const navigationItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/generate', label: 'Générer', icon: Wand2 },
  { href: '/galerie', label: 'Galerie', icon: Eye },
  { href: '/exemples', label: 'Exemples', icon: LayoutGrid },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/pricing', label: 'Tarifs', icon: CreditCard },
  { href: '/pro', label: 'Pour les Pros', icon: Building2 },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, credits, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      scrolled 
        ? "bg-[--white]/95 dark:bg-[--white]/95 backdrop-blur-md border-b border-[--border-color] shadow-soft" 
        : "bg-transparent"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
            <Image
              src="/images/logo-v3-house-sparkle.svg"
              alt="InstaDeco AI"
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg group-hover:scale-105 transition-transform"
              priority
            />
            <span className="hidden sm:inline text-[#2D2D2D]">InstaDeco</span>
            <span className="text-gradient font-extrabold">AI</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(item.href)
                    ? 'text-[#E07B54] bg-[#FFE4D9]'
                    : 'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#FFF8F5]'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {loading ? (
              <div className="h-9 w-24 bg-[#FFF8F5] animate-shimmer rounded-lg" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFE4D9] rounded-lg text-sm font-medium">
                  <span className="font-bold text-[#E07B54]">{credits}</span>
                  <span className="text-[#C95D3A] text-xs">crédits</span>
                  <Link 
                    href="/pricing" 
                    className="ml-1 p-1 rounded bg-white/50 hover:bg-white text-[#E07B54] transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <Link href="/dashboard">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 rounded-lg text-[#2D2D2D] hover:bg-[#FFF8F5] hover:text-[#E07B54]"
                  >
                    <UserIcon className="h-4 w-4" />
                    Mon Compte
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-lg text-[#2D2D2D] hover:bg-[#FFF8F5] hover:text-[#E07B54]"
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    size="sm" 
                    className="btn-primary rounded-lg"
                  >
                    Essai gratuit
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2 rounded-lg hover:bg-[#FFF8F5] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#2D2D2D]" />
            ) : (
              <Menu className="h-6 w-6 text-[#2D2D2D]" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="border-t border-[#F0E6E0] py-4 bg-white">
            <nav className="flex flex-col gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    isActive(item.href)
                      ? 'bg-[#FFE4D9] text-[#E07B54]'
                      : 'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#FFF8F5]'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-[#F0E6E0] my-2 pt-4 flex flex-col gap-2 px-4">
                {user ? (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 bg-[#FFE4D9] rounded-lg mb-2">
                      <span className="text-sm text-[#6B6B6B]">Crédits disponibles</span>
                      <span className="font-bold text-[#E07B54]">{credits}</span>
                    </div>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-lg btn-primary">
                        Mon Compte
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-lg border-[#F0E6E0] text-[#2D2D2D] hover:bg-[#FFF8F5]">
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-lg btn-primary">
                        Essai gratuit
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
