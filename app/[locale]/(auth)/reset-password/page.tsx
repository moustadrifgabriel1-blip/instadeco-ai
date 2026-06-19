'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSupabaseBrowser } from '@/hooks/use-supabase-browser';

export default function ResetPasswordPage() {
  const supabase = useSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Configuration indisponible. Réessayez dans un instant.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard?tab=security`,
      });

      if (resetError) {
        setError(resetError.message);
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setError('Une erreur est survenue');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/logo-prestige.svg"
            alt="InstaDeco AI"
            width={64}
            height={64}
            className="mx-auto mb-4 rounded-2xl"
          />
          <h1 className="prestige-display text-[40px] font-semibold tracking-[-0.025em] text-foreground mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-[17px] text-muted-foreground">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="bg-card border border-[var(--gold-line)] rounded-[20px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.45)]">
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/15 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="prestige-display text-[20px] font-semibold text-foreground mb-2">
                Email envoyé !
              </h2>
              <p className="text-[14px] text-muted-foreground mb-6">
                Si un compte existe avec l&apos;adresse <strong className="text-foreground">{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-[13px] text-muted-foreground">
                Vérifiez aussi vos spams.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-[12px] text-[14px] text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="prestige-eyebrow block text-[12px] font-medium uppercase tracking-[.1em] mb-2">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] bg-background border border-border text-foreground text-[17px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--gold)] transition-colors"
                    placeholder="vous@exemple.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] rounded-full text-[17px] font-medium hover:bg-transparent hover:text-[var(--gold)] transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-[14px] text-muted-foreground">
            <Link href="/login" className="text-[var(--gold)] hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
