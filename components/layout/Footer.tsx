/**
 * Composant: Footer
 * 
 * Pied de page du site InstaDeco AI.
 */

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

const footerLinks = {
  product: [
    { href: '/generate', label: 'Générer une image' },
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
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>InstaDeco</span>
              <span className="text-primary">AI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Transformez vos intérieurs grâce à l&apos;intelligence artificielle.
              Disponible en Suisse, France et Belgique.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h3 className="font-semibold mb-4">Produit</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="font-semibold mb-4">Suivez-nous</h3>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} InstaDeco AI. Tous droits réservés.
          </p>
          <p className="mt-1">
            🇨🇭 Suisse • 🇫🇷 France • 🇧🇪 Belgique
          </p>
        </div>
      </div>
    </footer>
  );
}
