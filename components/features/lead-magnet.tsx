'use client';

import { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { trackLeadCaptured } from '@/lib/analytics/gtag';
import { WelcomeOffer } from '@/components/features/welcome-offer';

interface LeadMagnetProps {
  /** Étiquette analytique + colonne `source` de la table leads (ex: 'roi_calculator'). */
  source: string;
  /** Titre du bloc de capture. */
  title: string;
  /** Sous-titre du bloc de capture (la promesse concrète de ce que l'email apporte). */
  subtitle: string;
  /** Métadonnées optionnelles envoyées à l'API (ex: { profil: 'agent' }). */
  metadata?: Record<string, string>;
  className?: string;
}

/**
 * Bloc de capture d'email réutilisable pour les outils gratuits (lead magnets).
 * Capture → POST /api/v2/leads → écran offre de bienvenue HONNÊTE.
 *
 * L'offre affiche toujours la valeur gratuite réelle (essai sans inscription +
 * 3 crédits offerts au compte). La réduction -20% n'apparaît QUE si un vrai
 * coupon Stripe est configuré (WELCOME_COUPON), sinon rien n'est promis.
 */
export function LeadMagnet({ source, title, subtitle, metadata, className = '' }: LeadMagnetProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/v2/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, metadata }),
      });
      if (!res.ok) throw new Error('leads');
      trackLeadCaptured(source);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'done') {
    return <WelcomeOffer className={className} />;
  }

  return (
    <div
      className={`rounded-[24px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-6 sm:p-8 ${className}`}
    >
      <div className="flex items-center gap-2 text-[var(--gold)]">
        <Mail className="h-4 w-4" aria-hidden="true" />
        <span className="prestige-eyebrow !text-[11px]">Recevez votre résultat</span>
      </div>
      <h3 className="prestige-display mt-3 text-[22px] font-semibold text-[var(--ivory)] tracking-[-0.02em]">
        {title}
      </h3>
      <p className="mt-2 text-[15px] text-[var(--mist)] leading-relaxed">{subtitle}</p>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`lead-${source}`} className="sr-only">
          Votre adresse email
        </label>
        <input
          id={`lead-${source}`}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          className="flex-1 rounded-full border border-[var(--gold-line)] bg-[var(--ink)] px-5 py-3 text-base text-[var(--ivory)] placeholder:text-[var(--mist)] focus:border-[var(--gold)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!isValid || status === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-6 py-3 text-[15px] font-semibold text-[#0c0a09] transition-colors hover:bg-[#d4b15f] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0c0a09] border-t-transparent" aria-hidden />
          ) : (
            <>
              Recevoir
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {status === 'error' && (
        <p className="mt-3 text-[13px] text-destructive" role="alert">
          Un souci est survenu. Réessayez dans un instant.
        </p>
      )}
      <p className="mt-3 text-[12px] text-[var(--mist)]">
        Pas de spam. Des conseils déco utiles et votre offre de bienvenue.
      </p>
    </div>
  );
}
