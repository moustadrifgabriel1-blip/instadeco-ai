/**
 * Composant: Footer (v2 - nettoyé)
 *
 * Pied de page du site InstaDeco AI.
 */

'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { Heart } from 'lucide-react';
import Image from 'next/image';

const PRODUCT_LINKS: { href: string; key: string }[] = [
  { href: '/generate', key: 'generate' },
  { href: '/galerie', key: 'gallery' },
  { href: '/quiz', key: 'quiz' },
  { href: '/exemples', key: 'examples' },
  { href: '/pricing', key: 'pricing' },
  { href: '/blog', key: 'blog' },
  { href: '/pro', key: 'pro' },
];

const HUB_LINKS: { href: string; labelKey: 'hubAllStyles' | 'hubAllRooms' | 'hubAllSolutions' }[] = [
  { href: '/styles', labelKey: 'hubAllStyles' },
  { href: '/pieces', labelKey: 'hubAllRooms' },
  { href: '/solutions', labelKey: 'hubAllSolutions' },
];

const SERVICE_LINKS: { href: string; key: string }[] = [
  { href: '/architecte-interieur', key: 'architect' },
  { href: '/architecte-interieur/paris', key: 'paris' },
  { href: '/architecte-interieur/lyon', key: 'lyon' },
  { href: '/architecte-interieur/geneve', key: 'geneve' },
  { href: '/architecte-interieur/bruxelles', key: 'bruxelles' },
];

const STYLE_LINKS: { href: string; key: string }[] = [
  { href: '/style/moderne', key: 'styleModerne' },
  { href: '/style/scandinave', key: 'styleScandinave' },
  { href: '/style/industriel', key: 'styleIndustriel' },
  { href: '/style/japandi', key: 'styleJapandi' },
  { href: '/style/boheme', key: 'styleBoheme' },
];

const SOLUTION_LINKS: { href: string; key: string }[] = [
  { href: '/solution/home-staging-virtuel', key: 'solStaging' },
  { href: '/solution/simulateur-decoration-interieur', key: 'solSimulator' },
  { href: '/solution/logiciel-home-staging', key: 'solSoftware' },
  { href: '/solution/avant-apres-decoration', key: 'solAvantApres' },
];

const LEGAL_LINKS: { href: string; key: string }[] = [
  { href: '/legal/mentions-legales', key: 'legalMentions' },
  { href: '/legal/privacy', key: 'legalPrivacy' },
  { href: '/legal/cgv', key: 'legalCgv' },
  { href: '/a-propos', key: 'about' },
];

const SOCIAL_LINKS: { href: string; key: string }[] = [
  { href: 'https://twitter.com/instadeco_ai', key: 'twitter' },
  { href: 'https://instagram.com/instadeco_ai', key: 'instagram' },
  { href: 'https://pinterest.com/instadeco_ai', key: 'pinterest' },
];

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const t = useTranslations('Footer');

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/credits') || pathname === '/essai') {
    return null;
  }

  // Variante sombre prestige : home uniquement. Toutes les autres pages gardent le rendu clair actuel.
  const prestige = pathname === '/';

  return (
    <footer
      className={
        prestige
          ? 'border-t border-[rgba(200,162,77,0.28)] bg-[#0c0a09]'
          : 'border-t border-[#F0E6E0] bg-[#FFF8F5]'
      }
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-6 lg:gap-8 mb-12">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4 group">
              <Image
                src="/images/logo-v3-house-sparkle.svg"
                alt="InstaDeco AI"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg group-hover:scale-105 transition-transform"
              />
              {prestige ? (
                <>
                  <span className="prestige-display text-[#faf8f4]">InstaDeco</span>
                  <span className="prestige-display text-[#c8a24d] font-extrabold">AI</span>
                </>
              ) : (
                <>
                  <span className="text-[#2D2D2D]">InstaDeco</span>
                  <span className="text-gradient font-extrabold">AI</span>
                </>
              )}
            </Link>
            <p className={prestige ? 'text-sm text-[rgba(250,248,244,0.62)] mb-4' : 'text-sm text-[#6B6B6B] mb-4'}>{t('tagline')}</p>
          </div>

          <div>
            <h3 className={prestige ? 'prestige-display font-semibold mb-4 text-[#faf8f4]' : 'font-semibold mb-4 text-[#2D2D2D]'}>{t('productTitle')}</h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={prestige ? 'text-sm text-[rgba(250,248,244,0.62)] hover:text-[#c8a24d] transition-colors' : 'text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors'}
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={prestige ? 'prestige-display font-semibold mb-4 text-[#faf8f4]' : 'font-semibold mb-4 text-[#2D2D2D]'}>{t('cityTitle')}</h3>
            <ul className="space-y-3">
              {SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={prestige ? 'text-sm text-[rgba(250,248,244,0.62)] hover:text-[#c8a24d] transition-colors' : 'text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors'}
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={prestige ? 'prestige-display font-semibold mb-4 text-[#faf8f4]' : 'font-semibold mb-4 text-[#2D2D2D]'}>{t('stylesTitle')}</h3>
            <ul className="space-y-3">
              {STYLE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={prestige ? 'text-sm text-[rgba(250,248,244,0.62)] hover:text-[#c8a24d] transition-colors' : 'text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors'}
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/styles"
                  className={prestige ? 'text-sm text-[#c8a24d] hover:underline font-medium' : 'text-sm text-[#E07B54] hover:underline font-medium'}
                >
                  → {t('hubAllStyles')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={prestige ? 'prestige-display font-semibold mb-4 text-[#faf8f4]' : 'font-semibold mb-4 text-[#2D2D2D]'}>{t('solutionsTitle')}</h3>
            <ul className="space-y-3">
              {SOLUTION_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={prestige ? 'text-sm text-[rgba(250,248,244,0.62)] hover:text-[#c8a24d] transition-colors' : 'text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors'}
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
              {HUB_LINKS.filter((h) => h.labelKey !== 'hubAllStyles').map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={prestige ? 'text-sm text-[#c8a24d] hover:underline font-medium' : 'text-sm text-[#E07B54] hover:underline font-medium'}
                  >
                    → {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={prestige ? 'prestige-display font-semibold mb-4 text-[#faf8f4]' : 'font-semibold mb-4 text-[#2D2D2D]'}>{t('legalTitle')}</h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={prestige ? 'text-sm text-[rgba(250,248,244,0.62)] hover:text-[#c8a24d] transition-colors' : 'text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors'}
                  >
                    {t(`links.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={prestige ? 'prestige-display font-semibold mb-4 text-[#faf8f4]' : 'font-semibold mb-4 text-[#2D2D2D]'}>{t('followTitle')}</h3>
            <ul className="space-y-3">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={prestige ? 'text-sm text-[rgba(250,248,244,0.62)] hover:text-[#c8a24d] transition-colors' : 'text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors'}
                  >
                    {t(`links.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={prestige ? 'border-t border-[rgba(200,162,77,0.28)] pt-6 mb-6' : 'border-t border-[#F0E6E0] pt-6 mb-6'}>
          <p className={prestige ? 'text-xs text-[rgba(250,248,244,0.62)] mb-3' : 'text-xs text-[#9B9B9B] mb-3'}>{t('citySeoLine')}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              'marseille',
              'toulouse',
              'nice',
              'nantes',
              'montpellier',
              'strasbourg',
              'bordeaux',
              'lille',
              'rennes',
              'lausanne',
              'fribourg',
              'neuchatel',
              'liege',
              'namur',
              'charleroi',
              'annecy',
              'grenoble',
              'dijon',
            ].map((city) => (
              <Link
                key={city}
                href={`/architecte-interieur/${city}`}
                className={prestige ? 'text-xs text-[rgba(250,248,244,0.62)] hover:text-[#c8a24d] transition-colors capitalize' : 'text-xs text-[#9B9B9B] hover:text-[#E07B54] transition-colors capitalize'}
              >
                {city.replace(/-/g, ' ')}
              </Link>
            ))}
          </div>
        </div>

        <div className={prestige ? 'border-t border-[rgba(200,162,77,0.28)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[rgba(250,248,244,0.62)]' : 'border-t border-[#F0E6E0] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#6B6B6B]'}>
          <p className="flex items-center gap-1 flex-wrap justify-center">
            {t('copyright', { year: currentYear })} <Heart className={prestige ? 'h-4 w-4 text-[#c8a24d] fill-current' : 'h-4 w-4 text-[#E07B54] fill-current'} />{' '}
            {t('copyrightEnd')}
          </p>
        </div>
      </div>
    </footer>
  );
}
