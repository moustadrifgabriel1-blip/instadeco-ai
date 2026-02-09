'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-fill referral code from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
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
              newUserId: data.user.id,
            }),
          });
        } catch (refErr) {
          // Silently fail - ne pas bloquer l'inscription
          console.error('Referral error:', refErr);
        }
      }
      
      router.push('/generate');
    } catch (err: unknown) {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
    <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-[#1d1d1f] mb-2">
            Créer un compte
          </h1>
          <p className="text-[17px] text-[#86868b]">
            3 crédits gratuits pour commencer
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[12px] text-[14px] text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailSignup} className="space-y-5">
            <div>
              <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-[#d2d2d7] text-[17px] focus:outline-none focus:border-[#0071e3] transition-colors"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-[#d2d2d7] text-[17px] focus:outline-none focus:border-[#0071e3] transition-colors"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-[12px] border border-[#d2d2d7] text-[17px] focus:outline-none focus:border-[#0071e3] transition-colors"
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
              />
            </div>

            {/* Code parrainage */}
            <div>
              <label className="block text-[12px] font-medium text-[#86868b] uppercase tracking-[.1em] mb-2">
                Code parrainage <span className="text-[#E07B54] font-normal lowercase">(optionnel • 3 crédits bonus)</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-[12px] border border-[#d2d2d7] text-[17px] focus:outline-none focus:border-[#E07B54] transition-colors font-mono tracking-widest uppercase"
                placeholder="EX: A1B2C3D4"
                maxLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1d1d1f] text-white rounded-full text-[17px] font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#d2d2d7]"></div>
            </div>
            <div className="relative flex justify-center text-[14px]">
              <span className="bg-white px-4 text-[#86868b]">ou</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-3 bg-white border-2 border-[#d2d2d7] rounded-full text-[17px] font-medium hover:bg-[#f5f5f7] transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          <p className="mt-6 text-center text-[14px] text-[#86868b]">
            Déjà un compte ?{' '}
            <a href="/login" className="text-[#0071e3] hover:underline">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#1d1d1f] border-t-transparent rounded-full" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
