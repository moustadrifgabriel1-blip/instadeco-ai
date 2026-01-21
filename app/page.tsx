export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24">
      <div className="text-center max-w-4xl mx-auto px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
          🏠 InstaDeco
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
          Transformez vos pièces avec l&apos;IA générative
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto mb-8">
          <a
            href="/generate"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition touch-manipulation min-h-[48px] flex items-center justify-center"
          >
            Commencer
          </a>
          <a
            href="/pricing"
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition touch-manipulation min-h-[48px] flex items-center justify-center"
          >
            Voir les tarifs
          </a>
        </div>
        <div className="pt-4 border-t border-border/40">
          <p className="text-sm text-muted-foreground mb-3">
            Découvrez nos conseils et tendances décoration
          </p>
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
          >
            📰 Lire le blog
          </a>
        </div>
      </div>
    </main>
  );
}
