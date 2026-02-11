'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient chaleureux */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E07B54] via-[#D4603C] to-[#C4503C] -z-10" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2600&auto=format&fit=crop')] opacity-10 bg-cover bg-center -z-20 mix-blend-overlay" />
      
      {/* Décorations */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      
      <div className="container px-4 md:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          Lancez-vous dès maintenant
        </div>
        
        <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
          L&apos;intérieur de vos rêves pour 0,99 €
        </h2>
        <p className="text-xl text-white/85 max-w-2xl mx-auto mb-10">
          Un décorateur facture 150 €/h et prend 2 semaines.<br />
          InstaDeco vous donne le même résultat en 30 secondes.
        </p>
        <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-[#E07B54] hover:bg-white/95 font-bold shadow-2xl hover:scale-105 transition-transform border-0" asChild>
          <Link href="/generate">
            J&apos;essaie maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <p className="mt-6 text-sm text-white/70">
          ✨ 3 crédits offerts à l&apos;inscription • Pas de carte requise • Résultat garanti
        </p>
      </div>
    </section>
  );
}
