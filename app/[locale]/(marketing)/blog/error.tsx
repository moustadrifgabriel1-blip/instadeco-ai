'use client';

/**
 * Error boundary pour le blog
 * Capture et affiche les erreurs côté client et serveur
 */

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Blog Error]', error.message, error.digest);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <AlertTriangle className="h-16 w-16 mx-auto text-orange-500 mb-6" />
        <h1 className="text-2xl font-bold mb-4">
          Oups, une erreur est survenue
        </h1>
        <p className="text-muted-foreground mb-8">
          Le blog est temporairement indisponible. Veuillez réessayer dans quelques instants.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset}>
            Réessayer
          </Button>
          <Link href="/">
            <Button variant="outline">
              Retour à l&apos;accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
