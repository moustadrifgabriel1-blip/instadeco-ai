import { Hero } from '@/components/features/landing/Hero';
import { Features } from '@/components/features/landing/Features';
import { FinalCTA } from '@/components/features/landing/FinalCTA';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <FinalCTA />
    </main>
  );
}
