'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { createGuestCheckoutSession } from '@/src/presentation/api/client';

interface GuestCheckoutDialogProps {
  /** Pack sélectionné. `null` ferme la boîte. */
  packId: string | null;
  /** Libellé du pack, affiché pour confirmer le choix (ex. « 25 crédits, 19,90 € »). */
  packLabel?: string;
  onClose: () => void;
  successUrl: string;
  cancelUrl: string;
  couponId?: string;
  /** Lien de connexion pour les clients qui ont déjà un compte. */
  loginHref: string;
}

/**
 * Achat de crédits sans création de compte préalable.
 *
 * Le visiteur saisit son email et part directement sur Stripe. Le compte est
 * créé par le webhook après paiement, qui envoie un magic link et crédite le
 * solde (chaîne déjà en place et testée côté serveur, elle n'était simplement
 * branchée sur aucune page).
 *
 * Pourquoi : jusqu'ici, un visiteur qui cliquait un pack était renvoyé vers
 * /login, sans que le pack choisi soit mémorisé. Il devait créer un compte,
 * confirmer un email, puis retrouver la page de prix et re-cliquer. Obliger à
 * s'inscrire avant de payer est l'une des premières causes d'abandon.
 */
export function GuestCheckoutDialog({
  packId,
  packLabel,
  onClose,
  successUrl,
  cancelUrl,
  couponId,
  loginHref,
}: GuestCheckoutDialogProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = !!packId;

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const value = email.trim();
    if (!value || !value.includes('@')) {
      setError('Entrez une adresse email valide pour recevoir vos crédits.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await createGuestCheckoutSession({
        email: value,
        packId: packId as string,
        successUrl,
        cancelUrl,
        couponId,
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      setError('Impossible de démarrer le paiement. Réessayez.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-checkout-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--gold-line)] bg-[var(--ink)] p-6 text-[var(--ivory)] shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 rounded-full p-1 text-[var(--ivory)]/60 transition-colors duration-300 hover:text-[var(--gold)]"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="guest-checkout-title" className="prestige-display mb-2 pr-8 text-2xl">
          Où envoyons-nous vos crédits ?
        </h2>
        <p className="mb-6 text-sm text-[var(--ivory)]/70">
          {packLabel ? `${packLabel}. ` : ''}Pas de compte à créer. Vous payez, et vos
          crédits vous attendent sur cette adresse.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="guest-email" className="sr-only">
              Adresse email
            </label>
            <input
              ref={inputRef}
              id="guest-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@agence.fr"
              className="w-full rounded-lg border border-[var(--gold-line)] bg-white/5 px-4 py-3 text-base text-[var(--ivory)] placeholder:text-[var(--ivory)]/40 focus:border-[var(--gold)] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-6 py-3 font-medium text-[var(--ink)] transition-opacity duration-300 disabled:opacity-60 [@media(hover:hover)]:hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ouverture du paiement
              </>
            ) : (
              <>
                Continuer vers le paiement
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs text-[var(--ivory)]/50">
          <ShieldCheck className="h-3.5 w-3.5" />
          Paiement sécurisé par Stripe
        </p>

        <p className="mt-4 text-center text-sm text-[var(--ivory)]/60">
          Vous avez déjà un compte ?{' '}
          <Link href={loginHref} className="text-[var(--gold)] hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
