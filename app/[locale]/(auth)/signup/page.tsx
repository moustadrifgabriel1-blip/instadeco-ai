'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSupabaseBrowser } from '@/hooks/use-supabase-browser';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabaseBrowser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill referral code from URL & get redirect
  const redirectTo = searchParams.get('redirect') || '/generate';
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Configuration indisponible. Réessayez dans un instant.');
      return;
    }
    setLoading(true);
    setError('');

    // Validation mot de passe (même règles que le changement de mdp)
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule et 1 chiffre');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            consent_marketing: acceptMarketing,
            consent_marketing_date: new Date().toISOString(),
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Cet email est déjà utilisé');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Le profil est créé automatiquement via le trigger Supabase
      
      // Appliquer le code de parrainage si fourni
      if (referralCode.trim() && data?.user?.id) {
        try {
          await fetch('/api/v2/referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referralCode: referralCode.trim().toUpperCase(),
            }),
          });
        } catch (refErr) {
          // Silently fail - ne pas bloquer l'inscription
          console.error('Referral error:', refErr);
        }
      }
      
      router.push(redirectTo);
    } catch (err: unknown) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!acceptTerms) {
      setError('Veuillez accepter les CGV et la Politique de Confidentialité.');
      return;
    }
    if (!supabase) {
      setError('Configuration indisponible. Réessayez dans un instant.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      }
      // La redirection est gérée par Supabase
    } catch (err: unknown) {
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6 py-12">
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
            Créer un compte
          </h1>
          <p className="text-[17px] text-muted-foreground">
            <span className="text-[var(--gold)]">3 crédits gratuits</span> pour commencer
          </p>
        </div>

        <div className="bg-card border border-[var(--gold-line)] rounded-[20px] p-8 shadow-[0_2px_24px_rgba(0,0,0,0.4)]">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/40 rounded-[12px] text-[14px] text-destructive" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-5">
            <div>
              <label htmlFor="signup-fullname" className="prestige-eyebrow block !text-[12px] !tracking-[.1em] text-muted-foreground mb-2">
                Nom complet
              </label>
              <input
                id="signup-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-background text-foreground text-[17px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--gold)] transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="prestige-eyebrow block !text-[12px] !tracking-[.1em] text-muted-foreground mb-2">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-background text-foreground text-[17px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--gold)] transition-colors"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="prestige-eyebrow block !text-[12px] !tracking-[.1em] text-muted-foreground mb-2">
                Mot de passe
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-background text-foreground text-[17px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--gold)] transition-colors"
                placeholder="Min. 8 caractères (majuscule + chiffre)"
                required
                minLength={8}
              />
            </div>

            {/* Code parrainage */}
            <div>
              <label htmlFor="signup-referral" className="prestige-eyebrow block !text-[12px] !tracking-[.1em] text-muted-foreground mb-2">
                Code parrainage <span className="text-[var(--gold)] font-normal lowercase">(optionnel • 3 crédits bonus)</span>
              </label>
              <input
                id="signup-referral"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-background text-foreground text-[17px] placeholder:text-muted-foreground focus:outline-none focus:border-[var(--gold)] transition-colors font-mono tracking-widest uppercase"
                placeholder="EX: A1B2C3D4"
                maxLength={8}
              />
            </div>

            {/* Consentement RGPD obligatoire */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border bg-background text-[var(--gold)] accent-[var(--gold)] focus:ring-[var(--gold)]"
                required
              />
              <label htmlFor="accept-terms" className="text-[13px] text-muted-foreground leading-5">
                J&apos;accepte les{' '}
                <a href="/legal/cgv" target="_blank" className="text-[var(--gold)] hover:underline">
                  Conditions Générales de Vente
                </a>{' '}
                et la{' '}
                <a href="/legal/privacy" target="_blank" className="text-[var(--gold)] hover:underline">
                  Politique de Confidentialité
                </a>.
              </label>
            </div>

            {/* Consentement marketing séparé (opt-in RGPD) */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="accept-marketing"
                checked={acceptMarketing}
                onChange={(e) => setAcceptMarketing(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-border bg-background text-[var(--gold)] accent-[var(--gold)] focus:ring-[var(--gold)]"
              />
              <label htmlFor="accept-marketing" className="text-[13px] text-muted-foreground leading-5">
                J&apos;accepte de recevoir des emails d&apos;inspiration déco et des offres promotionnelles.
                <span className="block text-[11px] mt-0.5">Optionnel • Désinscription en 1 clic</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptTerms}
              className="w-full py-3 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] rounded-full text-[17px] font-medium hover:bg-transparent hover:text-[var(--gold)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--gold-line)]"></div>
            </div>
            <div className="relative flex justify-center text-[14px]">
              <span className="bg-card px-4 text-muted-foreground">ou</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3 bg-transparent text-foreground border-2 border-[var(--gold-line)] rounded-full text-[17px] font-medium hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <p className="mt-6 text-center text-[14px] text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[var(--gold)] hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
