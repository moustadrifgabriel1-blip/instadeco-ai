/**
 * Loading state pour la page blog
 */

import { ArticleCardSkeleton } from '@/components/features/blog';

export default function BlogLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <header className="text-center mb-12">
        <div className="h-10 w-96 max-w-full bg-muted rounded mx-auto mb-4 animate-pulse" />
        <div className="h-6 w-[600px] max-w-full bg-muted rounded mx-auto animate-pulse" />
      </header>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Articles */}
        <main className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        </main>

        {/* Sidebar skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="h-6 w-32 bg-muted rounded mb-4" />
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-6 w-16 bg-muted rounded" />
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="h-6 w-40 bg-muted rounded mb-4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
