/**
 * Composant: Header
 *
 * Navigation principale du site InstaDeco AI.
 */

'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  BookOpen,
  CreditCard,
  Home,
  Wand2,
  User as UserIcon,
  Plus,
  LayoutGrid,
  Building2,
  Eye,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_KEYS = [
  { href: '/generate', key: 'generate' as const, icon: Wand2 },
  { href: '/galerie', key: 'gallery' as const, icon: Eye },
  { href: '/exemples', key: 'examples' as const, icon: LayoutGrid },
  { href: '/quiz', key: 'quiz' as const, icon: Star },
  { href: '/blog', key: 'blog' as const, icon: BookOpen },
  { href: '/pricing', key: 'pricing' as const, icon: CreditCard },
  { href: '/pro', key: 'pros' as const, icon: Building2 },
];

export function Header() {
  const pathname = usePathname();
  // Tout le site public est désormais en DA prestige (nuit + or).
  const prestige = true;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, credits, loading } = useAuth();
  const t = useTranslations('Nav');
  const tCommon = useTranslations('Common');

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

  if (pathname === '/essai' || pathname.startsWith('/dashboard') || pathname.startsWith('/credits')) {
    return null;
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? prestige
            ? 'bg-[#0c0a09]/90 backdrop-blur-md border-b border-[rgba(200,162,77,0.28)]'
            : 'bg-[--white]/95 backdrop-blur-md border-b border-[--border-color] shadow-soft'
          : prestige
            // Fond nuit translucide meme en haut de page : le texte ivoire du mode
            // prestige serait invisible sur le fond clair du body si le header etait transparent.
            ? 'bg-[#0c0a09]/70 backdrop-blur-md'
            : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl group shrink-0">
            <Image
              src={prestige ? '/images/logo-prestige.svg' : '/images/logo-v3-house-sparkle.svg'}
              alt="InstaDeco AI"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg group-hover:scale-105 transition-transform"
              priority
            />
            <span
              className={cn(
                'hidden sm:inline',
                prestige ? 'prestige-display text-[#faf8f4]' : 'text-[#2D2D2D]',
              )}
            >
              InstaDeco
            </span>
            <span
              className={cn(
                prestige ? 'prestige-display text-[#c8a24d]' : 'text-gradient font-extrabold',
              )}
            >
              AI
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_KEYS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap',
                  prestige
                    ? isActive(item.href)
                      ? 'text-[#c8a24d] bg-[rgba(200,162,77,0.12)]'
                      : 'text-[rgba(250,248,244,0.62)] hover:text-[#faf8f4] hover:bg-[rgba(250,248,244,0.06)]'
                    : isActive(item.href)
                      ? 'text-[#E07B54] bg-[#FFE4D9]'
                      : 'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#FFF8F5]',
                )}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            {loading ? (
              <div
                className={cn(
                  'h-9 w-24 animate-shimmer rounded-lg',
                  prestige ? 'bg-[#1c1917]' : 'bg-[#FFF8F5]',
                )}
              />
            ) : user ? (
              <>
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
                    prestige ? 'bg-[#1c1917]' : 'bg-[#FFE4D9]',
                  )}
                >
                  <span className={cn('font-bold', prestige ? 'text-[#c8a24d]' : 'text-[#E07B54]')}>
                    {credits}
                  </span>
                  <span
                    className={cn('text-xs', prestige ? 'text-[rgba(250,248,244,0.62)]' : 'text-[#C95D3A]')}
                  >
                    {tCommon('credits')}
                  </span>
                  <Link
                    href="/pricing"
                    className={cn(
                      'ml-1 p-1 rounded transition-colors',
                      prestige
                        ? 'bg-[rgba(200,162,77,0.12)] hover:bg-[rgba(200,162,77,0.24)] text-[#c8a24d]'
                        : 'bg-white/50 hover:bg-white text-[#E07B54]',
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 rounded-lg',
                      prestige
                        ? 'text-[rgba(250,248,244,0.62)] hover:bg-[rgba(250,248,244,0.06)] hover:text-[#c8a24d]'
                        : 'text-[#2D2D2D] hover:bg-[#FFF8F5] hover:text-[#E07B54]',
                    )}
                  >
                    <UserIcon className="h-4 w-4" />
                    {t('account')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'rounded-lg',
                      prestige
                        ? 'text-[rgba(250,248,244,0.62)] hover:bg-[rgba(250,248,244,0.06)] hover:text-[#c8a24d]'
                        : 'text-[#2D2D2D] hover:bg-[#FFF8F5] hover:text-[#E07B54]',
                    )}
                  >
                    {t('login')}
                  </Button>
                </Link>
                <Link href="/essai">
                  <Button
                    size="sm"
                    className={cn(
                      'rounded-lg',
                      prestige
                        ? 'bg-[#c8a24d] text-[#0c0a09] hover:bg-[#d4b15f]'
                        : 'btn-primary',
                    )}
                  >
                    {t('freeTrial')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              className={cn(
                'p-2 -mr-2 rounded-lg transition-colors',
                prestige ? 'hover:bg-[rgba(250,248,244,0.06)]' : 'hover:bg-[#FFF8F5]',
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
            >
              {mobileMenuOpen ? (
                <X className={cn('h-6 w-6', prestige ? 'text-[#faf8f4]' : 'text-[#2D2D2D]')} />
              ) : (
                <Menu className={cn('h-6 w-6', prestige ? 'text-[#faf8f4]' : 'text-[#2D2D2D]')} />
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300',
            mobileMenuOpen ? 'max-h-[560px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div
            className={cn(
              'border-t py-4',
              prestige ? 'border-[rgba(200,162,77,0.28)] bg-[#0c0a09]' : 'border-[#F0E6E0] bg-white',
            )}
          >
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  prestige
                    ? pathname === '/'
                      ? 'bg-[rgba(200,162,77,0.12)] text-[#c8a24d]'
                      : 'text-[rgba(250,248,244,0.62)] hover:text-[#faf8f4] hover:bg-[rgba(250,248,244,0.06)]'
                    : pathname === '/'
                      ? 'bg-[#FFE4D9] text-[#E07B54]'
                      : 'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#FFF8F5]',
                )}
              >
                <Home className="h-5 w-5" />
                {t('home')}
              </Link>
              {NAV_KEYS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    prestige
                      ? isActive(item.href)
                        ? 'bg-[rgba(200,162,77,0.12)] text-[#c8a24d]'
                        : 'text-[rgba(250,248,244,0.62)] hover:text-[#faf8f4] hover:bg-[rgba(250,248,244,0.06)]'
                      : isActive(item.href)
                        ? 'bg-[#FFE4D9] text-[#E07B54]'
                        : 'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#FFF8F5]',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {t(item.key)}
                </Link>
              ))}
              <div
                className={cn(
                  'border-t my-2 pt-4 flex flex-col gap-2 px-4',
                  prestige ? 'border-[rgba(200,162,77,0.28)]' : 'border-[#F0E6E0]',
                )}
              >
                {user ? (
                  <>
                    <div
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-lg mb-2',
                        prestige ? 'bg-[#1c1917]' : 'bg-[#FFE4D9]',
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm',
                          prestige ? 'text-[rgba(250,248,244,0.62)]' : 'text-[#6B6B6B]',
                        )}
                      >
                        {tCommon('creditsAvailable')}
                      </span>
                      <span
                        className={cn('font-bold', prestige ? 'text-[#c8a24d]' : 'text-[#E07B54]')}
                      >
                        {credits}
                      </span>
                    </div>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        className={cn(
                          'w-full rounded-lg',
                          prestige
                            ? 'bg-[#c8a24d] text-[#0c0a09] hover:bg-[#d4b15f]'
                            : 'btn-primary',
                        )}
                      >
                        {t('account')}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full rounded-lg',
                          prestige
                            ? 'border-[rgba(200,162,77,0.28)] bg-transparent text-[#faf8f4] hover:bg-[rgba(250,248,244,0.06)] hover:text-[#c8a24d]'
                            : 'border-[#F0E6E0] text-[#2D2D2D] hover:bg-[#FFF8F5]',
                        )}
                      >
                        {t('login')}
                      </Button>
                    </Link>
                    <Link href="/essai" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        className={cn(
                          'w-full rounded-lg',
                          prestige
                            ? 'bg-[#c8a24d] text-[#0c0a09] hover:bg-[#d4b15f]'
                            : 'btn-primary',
                        )}
                      >
                        {t('freeTrial')}
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
