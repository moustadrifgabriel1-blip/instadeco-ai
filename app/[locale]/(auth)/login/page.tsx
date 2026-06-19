'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseBrowser } from '@/hooks/use-supabase-browser';
import Image from 'next/image';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/generate';
  const supabase = useSupabaseBrowser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Configuration indisponible. Réessayez dans un instant.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email ou mot de passe incorrect');
        } else {
          setError(signInError.message);
        }
        return;
      }

      router.push(redirectTo);
    } catch (err: unknown) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/logo-v3-house-sparkle.svg"
            alt="InstaDeco AI"
            width={64}
            height={64}
            className="mx-auto mb-4 rounded-2xl"
          />
          <h1 className="prestige-display text-[40px] font-semibold tracking-[-0.025em] text-foreground mb-2">
            Connexion
          </h1>
          <p className="prestige-body text-[17px] text-muted-foreground">
            Accédez à votre compte InstaDeco
          </p>
        </div>

        <div className="bg-card rounded-[20px] p-8 border border-[var(--gold-line)] shadow-[0_2px_24px_rgba(0,0,0,0.4)]">
          {error && (
            <div className="mb-6 p-4 bg-[rgba(220,80,80,0.12)] border border-destructive/40 rounded-[12px] text-[14px] text-destructive" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-[12px] font-medium text-muted-foreground uppercase tracking-[.1em] mb-2">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-background text-foreground placeholder:text-muted-foreground text-[17px] focus:outline-none focus:border-[var(--gold)] transition-colors"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[12px] font-medium text-muted-foreground uppercase tracking-[.1em] mb-2">
                Mot de passe
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-border bg-background text-foreground placeholder:text-muted-foreground text-[17px] focus:outline-none focus:border-[var(--gold)] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex justify-end">
              <Link href="/reset-password" className="text-[13px] text-[var(--gold)] hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] rounded-full text-[17px] font-medium hover:bg-transparent hover:text-[var(--gold)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
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
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-transparent text-foreground border border-border rounded-full text-[17px] font-medium hover:border-[var(--gold)] hover:text-[var(--gold)] transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
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
            Pas encore de compte ?{' '}
            <Link href={`/signup${redirectTo !== '/generate' ? `?redirect=${redirectTo}` : ''}`} className="text-[var(--gold)] hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-[var(--gold)] rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
