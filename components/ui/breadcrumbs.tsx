import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Composant Breadcrumb visuel (SSR)
 * 
 * Affiche le fil d'Ariane au-dessus du contenu.
 * Complémentaire au JSON-LD BreadcrumbList déjà en place.
 * 
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Styles', href: '/styles' },
 *   { label: 'Moderne', href: '/style/moderne' },
 * ]} />
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="border-b bg-muted/30">
      <div className="container px-4 md:px-6 py-3">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <li>
            <Link href="/" className="hover:text-primary transition-colors inline-flex items-center gap-1">
              <Home className="w-3 h-3" />
              <span>Accueil</span>
            </Link>
          </li>
          {items.map((item, index) => (
            <li key={item.href} className="inline-flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" />
              {index === items.length - 1 ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-primary transition-colors">
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
