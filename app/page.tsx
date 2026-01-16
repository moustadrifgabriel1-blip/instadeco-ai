export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">
          🏠 InstantDecor AI
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Transformez vos pièces avec l&apos;IA générative
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/demo"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition"
          >
            Essayer la démo
          </a>
          <a
            href="/pricing"
            className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition"
          >
            Voir les tarifs
          </a>
        </div>
      </div>
    </main>
  );
}
