'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/95 -z-10" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2600&auto=format&fit=crop')] opacity-10 bg-cover bg-center -z-20 mix-blend-overlay" />
      
      <div className="container px-4 md:px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
          Prêt à transformer votre intérieur ?
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
          Rejoignez des milliers d&apos;utilisateurs satisfaits et commencez à créer l&apos;intérieur de vos rêves dès aujourd&apos;hui.
        </p>
        <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-primary hover:bg-white/90 font-bold shadow-xl hover:scale-105 transition-transform" asChild>
          <Link href="/generate">
            J&apos;essaie maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <p className="mt-6 text-sm text-white/60">
          Essai gratuit • Pas de carte requise • Annulation à tout moment
        </p>
      </div>
    </section>
  );
}
