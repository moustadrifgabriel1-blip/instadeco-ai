/**
 * Composant: Footer
 * 
 * Pied de page du site InstaDeco AI.
 */

import Link from 'next/link';
import { Sparkles, Heart } from 'lucide-react';

const footerLinks = {
  product: [
    { href: '/generate', label: 'Générer une image' },
    { href: '/exemples', label: 'Exemples' },
    { href: '/pricing', label: 'Tarifs' },
    { href: '/blog', label: 'Blog' },
  ],
  legal: [
    { href: '/legal/mentions-legales', label: 'Mentions légales' },
    { href: '/legal/privacy', label: 'Confidentialité' },
    { href: '/legal/cgv', label: 'CGV' },
  ],
  social: [
    { href: 'https://twitter.com/instadeco_ai', label: 'Twitter' },
    { href: 'https://instagram.com/instadeco_ai', label: 'Instagram' },
    { href: 'https://pinterest.com/instadeco_ai', label: 'Pinterest' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#F0E6E0] bg-[#FFF8F5]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4 group">
              <div className="h-9 w-9 rounded-lg bg-[#E07B54] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-[#2D2D2D]">InstaDeco</span>
              <span className="text-gradient font-extrabold">AI</span>
            </Link>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Transformez vos intérieurs grâce à l&apos;intelligence artificielle.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
              <span>🇨🇭</span>
              <span>🇫🇷</span>
              <span>🇧🇪</span>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h3 className="font-semibold mb-4 text-[#2D2D2D]">Produit</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold mb-4 text-[#2D2D2D]">Légal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="font-semibold mb-4 text-[#2D2D2D]">Suivez-nous</h3>
            <ul className="space-y-3">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#6B6B6B] hover:text-[#E07B54] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#F0E6E0] pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#6B6B6B]">
          <p className="flex items-center gap-1">
            © {currentYear} InstaDeco AI. Fait avec 
            <Heart className="h-4 w-4 text-[#E07B54] fill-current" />
            pour votre intérieur.
          </p>
          <p className="text-xs">
            Propulsé par l&apos;IA
          </p>
        </div>
      </div>
    </footer>
  );
}
