'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/logo-v3-house-sparkle.svg"
            alt="InstaDeco AI"
            width={64}
            height={64}
            className="mx-auto mb-4 rounded-2xl"
          />
          <h1 className="text-[40px] font-semibold tracking-[-0.025em] text-[#1d1d1f] mb-2">
            Mot de passe oublié
          </h1>
          <p className="text-[17px] text-[#636366]">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
          {status === 'success' ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-[20px] font-semibold text-[#1d1d1f] mb-2">
                Email envoyé !
              </h2>
              <p className="text-[14px] text-[#636366] mb-6">
                Si un compte existe avec l&apos;adresse <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-[13px] text-[#636366]">
                Vérifiez aussi vos spams.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[12px] text-[14px] text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">
                <div>
                  <label htmlFor="reset-email" className="block text-[12px] font-medium text-[#636366] uppercase tracking-[.1em] mb-2">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-[12px] border border-[#d2d2d7] text-[17px] focus:outline-none focus:border-[#0071e3] transition-colors"
                    placeholder="vous@exemple.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 bg-[#1d1d1f] text-white rounded-full text-[17px] font-medium hover:bg-black transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-[14px] text-[#636366]">
            <Link href="/login" className="text-[#0071e3] hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
