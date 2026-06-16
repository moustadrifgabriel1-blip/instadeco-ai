'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function FinalCTA() {
  const t = useTranslations('HomeLanding.finalCta');

  return (
    <section className="py-24 relative overflow-hidden bg-[var(--ink)]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2600&auto=format&fit=crop')] opacity-[0.06] bg-cover bg-center -z-20" />
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--ink)] via-[var(--stone-900)] to-[var(--ink)] opacity-90 -z-10" />

      <div className="absolute top-10 left-10 w-40 h-40 bg-[var(--gold-soft)] opacity-20 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-[var(--gold-soft)] opacity-10 rounded-full blur-2xl" />

      <div className="container px-4 md:px-6 text-center relative">
        <div className="inline-flex items-center gap-2 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] backdrop-blur-sm text-[var(--gold)] px-4 py-2 rounded-full mb-6">
          <Sparkles className="h-4 w-4" />
          <span className="prestige-eyebrow">{t('badge')}</span>
        </div>

        <h2 className="prestige-display text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-6">{t('title')}</h2>
        <div className="prestige-rule w-24 mx-auto mb-8" />
        <p className="prestige-body text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          {t('line1')}
          <br />
          {t('line2')}
        </p>
        <Button
          size="lg"
          className="prestige-body h-12 px-6 text-base sm:h-14 sm:px-10 sm:text-lg rounded-full bg-[var(--gold)] text-[#0c0a09] hover:bg-transparent hover:text-[var(--gold)] font-bold shadow-2xl hover:scale-105 transition-transform border border-[var(--gold)]"
          asChild
        >
          <Link href="/generate">
            {t('cta')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
        <p className="prestige-body mt-6 text-sm text-muted-foreground">{t('footnote')}</p>
      </div>
    </section>
  );
}
