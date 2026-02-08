/**
 * Composant: Footer
 * 
 * Pied de page du site InstaDeco AI.
 * Optimisé pour le maillage interne SEO avec liens
 * vers les pages villes, styles et outils.
 */

import Link from 'next/link';
import { Sparkles, Heart } from 'lucide-react';

const footerLinks = {
  product: [
    { href: '/generate', label: 'Générer une image' },
    { href: '/exemples', label: 'Exemples' },
    { href: '/pricing', label: 'Tarifs' },
    { href: '/blog', label: 'Blog' },
    { href: '/pro', label: 'Pour les Pros' },
  ],
  services: [
    { href: '/architecte-interieur', label: 'Architecte intérieur IA' },
    { href: '/architecte-interieur/paris', label: 'Déco Paris' },
    { href: '/architecte-interieur/lyon', label: 'Déco Lyon' },
    { href: '/architecte-interieur/geneve', label: 'Déco Genève' },
    { href: '/architecte-interieur/bruxelles', label: 'Déco Bruxelles' },
  ],
  styles: [
    { href: '/style/moderne', label: 'Style Moderne' },
    { href: '/style/scandinave', label: 'Style Scandinave' },
    { href: '/style/industriel', label: 'Style Industriel' },
    { href: '/style/japandi', label: 'Style Japandi' },
    { href: '/style/boheme', label: 'Style Bohème' },
  ],
  solutions: [
    { href: '/solution/home-staging-virtuel', label: 'Home Staging Virtuel' },
    { href: '/solution/simulateur-decoration-interieur', label: 'Simulateur Déco' },
    { href: '/solution/logiciel-home-staging', label: 'Logiciel Home Staging' },
    { href: '/solution/avant-apres-decoration', label: 'Avant / Après Déco' },
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
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

          {/* Services par ville */}
          <div>
            <h3 className="font-semibold mb-4 text-[#2D2D2D]">Par ville</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
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

          {/* Styles */}
          <div>
            <h3 className="font-semibold mb-4 text-[#2D2D2D]">Styles</h3>
            <ul className="space-y-3">
              {footerLinks.styles.map((link) => (
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

          {/* Solutions */}
          <div>
            <h3 className="font-semibold mb-4 text-[#2D2D2D]">Solutions</h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
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

        {/* SEO Internal Links - Villes additionnelles */}
        <div className="border-t border-[#F0E6E0] pt-6 mb-6">
          <p className="text-xs text-[#9B9B9B] mb-3">Décoration intérieur IA disponible dans :</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {[
              'marseille', 'toulouse', 'nice', 'nantes', 'montpellier', 'strasbourg',
              'bordeaux', 'lille', 'rennes', 'lausanne', 'fribourg', 'neuchatel',
              'liege', 'namur', 'charleroi', 'annecy', 'grenoble', 'dijon',
            ].map((city) => (
              <Link
                key={city}
                href={`/architecte-interieur/${city}`}
                className="text-xs text-[#9B9B9B] hover:text-[#E07B54] transition-colors capitalize"
              >
                {city.replace(/-/g, ' ')}
              </Link>
            ))}
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
            Propulsé par l&apos;IA • Disponible en France, Suisse et Belgique
          </p>
        </div>
      </div>
    </footer>
  );
}
