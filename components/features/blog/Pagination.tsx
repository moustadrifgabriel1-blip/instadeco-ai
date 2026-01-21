/**
 * Composant: Pagination
 * 
 * Navigation entre pages de contenu paginé.
 */

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const searchParams = useSearchParams();

  // Générer l'URL avec le numéro de page
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Afficher avec ellipsis
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {/* Bouton précédent */}
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage === 1}
        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
      >
        <Link href={getPageUrl(currentPage - 1)} aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Précédent</span>
        </Link>
      </Button>

      {/* Numéros de page */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              asChild={!isActive}
              className={isActive ? 'pointer-events-none' : ''}
            >
              {isActive ? (
                <span aria-current="page">{page}</span>
              ) : (
                <Link href={getPageUrl(page)} aria-label={`Page ${page}`}>
                  {page}
                </Link>
              )}
            </Button>
          );
        })}
      </div>

      {/* Bouton suivant */}
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage === totalPages}
        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
      >
        <Link href={getPageUrl(currentPage + 1)} aria-label="Page suivante">
          <span className="hidden sm:inline mr-1">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
