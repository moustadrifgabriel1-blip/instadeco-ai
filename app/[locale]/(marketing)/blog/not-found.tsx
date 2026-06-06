/**
 * Page 404 du blog
 */

import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BlogNotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <FileQuestion className="h-24 w-24 mx-auto text-muted-foreground/50 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Article non trouvé</h1>
        <p className="text-muted-foreground mb-8">
          Désolé, l&apos;article que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/blog">
            <Button>
              Voir tous les articles
            </Button>
          </Link>
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
