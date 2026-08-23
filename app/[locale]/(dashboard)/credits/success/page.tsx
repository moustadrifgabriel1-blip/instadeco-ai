'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Loader2, CheckCircle2, Crown, Sparkles, ArrowRight, ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseBrowser } from '@/hooks/use-supabase-browser';
import { trackPurchase } from '@/lib/analytics/gtag';
import { fbTrackPurchase } from '@/lib/analytics/fb-pixel';

const PLAN_LABEL: Record<string, string> = { solo: 'Solo', pro: 'Pro', agence: 'Agence' };

type Phase = 'verifying' | 'done' | 'pending';

function SuccessContent() {
  const sp = useSearchParams();
  const isSub = sp.get('type') === 'subscription';
  const planId = sp.get('plan') || 'pro';
  const planLabel = PLAN_LABEL[planId] ?? 'Pro';
  const expected = Number(sp.get('n')) || null;
  const value = Number(sp.get('v')) || 0;

  const sessionId = sp.get('session_id') || '';

  const { user, loading: authLoading } = useAuth();
  const supabase = useSupabaseBrowser();

  const [phase, setPhase] = useState<Phase>('verifying');
  const [credits, setCredits] = useState<number | null>(null);
  // Achat SANS compte : l'acheteur revient de Stripe sans session Supabase.
  const [guest, setGuest] = useState<{ credits: number | null; emailMasked: string | null; amount: number | null } | null>(null);
  const [guestEmail, setGuestEmail] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    try {
      setGuestEmail(sessionStorage.getItem('instadeco_guest_email'));
    } catch {
      /* sans gravité */
    }
  }, []);

  useEffect(() => {
    // On attend de savoir si une session existe avant de choisir la stratégie.
    if (authLoading) return;
    cancelled.current = false;
    let tries = 0;
    const MAX = 30; // ~60s d'attente active (le webhook Stripe peut prendre 10-30s en prod)
    const isGuest = !user && !isSub;

    const poll = async () => {
      tries += 1;
      try {
        if (isSub) {
          if (supabase && user) {
            const { data } = await supabase.from('profiles').select('pro_status').eq('id', user.id).single();
            if (data?.pro_status === 'active' && !cancelled.current) { setPhase('done'); return; }
          }
        } else if (isGuest) {
          // Pas de session : on interroge le statut public de la session Stripe.
          // Avant, la page tournait 60 s sur /api/v2/credits (401 sans compte)
          // puis affichait une impasse dont les boutons menaient au login.
          if (sessionId) {
            const res = await fetch(`/api/v2/payments/session-status?session_id=${encodeURIComponent(sessionId)}`);
            if (res.ok) {
              const d = await res.json();
              if (d.data?.paid && !cancelled.current) {
                setGuest({ credits: d.data.credits, emailMasked: d.data.emailMasked, amount: d.data.amount });
                setCredits(d.data.credits);
                setPhase('done');
                return;
              }
            } else if (res.status === 400 || res.status === 404) {
              // Session inconnue : inutile d'insister une minute.
              if (!cancelled.current) setPhase('pending');
              return;
            }
          }
        } else {
          const res = await fetch('/api/v2/credits');
          if (res.ok) {
            const d = await res.json();
            const c = d.data?.credits ?? null;
            if (!cancelled.current) setCredits(c);
            if (c !== null && (expected === null || c >= expected) && !cancelled.current) { setPhase('done'); return; }
          }
        }
      } catch {
        /* on retente */
      }
      if (cancelled.current) return;
      if (tries >= MAX) { setPhase('pending'); return; }
      setTimeout(poll, 2000);
    };

    poll();
    return () => { cancelled.current = true; };
  }, [isSub, supabase, user, authLoading, expected, sessionId]);

  // Conversion mesurée une seule fois par session de paiement (anti double-comptage
  // au refresh). Avant, seuls les abonnements déclenchaient purchase/Purchase :
  // un pack de crédits, invité ou connecté, n'était jamais compté.
  useEffect(() => {
    if (phase !== 'done') return;
    const key = `purchase_tracked_${sessionId || `${planId}_${value}`}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    if (isSub) {
      trackPurchase(`sub_${planId}`, value, 'EUR', sessionId || undefined);
      fbTrackPurchase(planId, value);
      return;
    }
    const amount = guest?.amount ?? value;
    const pack = guest?.credits ? `pack_${guest.credits}` : expected ? `pack_${expected}` : 'credits';
    trackPurchase(pack, amount, 'EUR', sessionId || undefined);
    fbTrackPurchase(pack, amount);
  }, [phase, isSub, planId, value, sessionId, guest, expected]);

  // ── En cours de vérification ──
  if (phase === 'verifying') {
    return (
      <Shell>
        <div className="relative w-[68px] h-[68px] mb-6">
          <div className="absolute inset-0 rounded-full border-[2px] border-[var(--gold-line)]" />
          <div className="absolute inset-0 rounded-full border-[2px] border-[var(--gold)] border-t-transparent animate-spin" />
          <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-[var(--gold)]" aria-hidden />
        </div>
        <p className="prestige-eyebrow text-[11px] text-[var(--gold)] mb-2">Paiement reçu</p>
        <h1 className="prestige-display text-[24px] sm:text-[28px] font-semibold text-[var(--ivory)] tracking-[-0.02em] text-center">
          {isSub ? 'Activation de votre abonnement' : 'Confirmation de votre achat'}
        </h1>
        <p className="mt-3 text-[14px] text-[var(--mist)] text-center max-w-sm">
          Quelques secondes, le temps que tout se mette en place.
        </p>
      </Shell>
    );
  }

  // ── Paiement reçu mais activation pas encore visible (webhook en retard) ──
  if (phase === 'pending') {
    return (
      <Shell>
        <Badge ok={false} />
        <h1 className="prestige-display text-[26px] sm:text-[32px] font-semibold text-[var(--ivory)] tracking-[-0.02em] text-center mt-5">
          Paiement bien reçu.
        </h1>
        <p className="mt-3 text-[15px] text-[var(--mist)] text-center max-w-md leading-relaxed">
          {!user && !isSub
            ? 'Vos crédits arrivent sur l’adresse utilisée au paiement, avec un lien de connexion. Comptez une minute, et regardez dans les courriers indésirables.'
            : `${isSub ? 'Votre abonnement sera actif' : 'Vos crédits seront ajoutés'} d’ici une minute. Vous recevez aussi un email de confirmation. Rafraîchissez votre espace si besoin.`}
        </p>
        {!user && !isSub ? (
          <p className="mt-6 text-[12px] text-[var(--mist)] text-center max-w-sm">
            Un doute ? Écrivez à contact@instadeco.app avec l&apos;adresse utilisée au paiement.
          </p>
        ) : (
          <Actions isSub={isSub} />
        )}
      </Shell>
    );
  }

  // ── Succès confirmé ──
  return (
    <Shell>
      <Badge ok />
      {isSub ? (
        <>
          <p className="prestige-eyebrow text-[11px] text-[var(--gold)] mb-2 mt-5 flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" /> Abonnement {planLabel}
          </p>
          <h1 className="prestige-display text-[28px] sm:text-[36px] font-semibold text-[var(--ivory)] tracking-[-0.02em] text-center leading-tight">
            Bienvenue dans <span className="text-[var(--gold)]">{planLabel}</span>.
          </h1>
          <p className="mt-3 text-[15px] text-[var(--mist)] text-center max-w-md leading-relaxed">
            Votre abonnement est actif. Transformez vos biens vides en intérieurs qui se vendent, sans limite.
          </p>
        </>
      ) : (
        <>
          <h1 className="prestige-display text-[28px] sm:text-[36px] font-semibold text-[var(--ivory)] tracking-[-0.02em] text-center leading-tight mt-5">
            Paiement confirmé.
          </h1>
          <div className="mt-5 inline-flex flex-col items-center rounded-2xl border border-[var(--gold)] bg-[rgba(200,162,77,0.08)] px-8 py-5">
            <span className="prestige-display text-[40px] font-bold text-[var(--gold)] leading-none">
              +{credits ?? expected ?? ''}
            </span>
            <span className="mt-1 text-[14px] text-[var(--ivory)] font-medium">{guest ? 'crédits' : 'crédits ajoutés'}</span>
          </div>
          {guest ? (
            <p className="mt-4 text-[15px] text-[var(--mist)] text-center max-w-md leading-relaxed">
              Vos crédits sont rattachés à{' '}
              <span className="text-[var(--ivory)] font-medium">{guestEmail || guest.emailMasked || 'votre adresse'}</span>.
              Ouvrez le lien de connexion que nous venons d&apos;y envoyer : il vous mène droit à votre
              espace, sans mot de passe.
            </p>
          ) : (
            credits !== null && (
              <p className="mt-3 text-[13px] text-[var(--mist)]">Nouveau solde : {credits} crédits.</p>
            )
          )}
        </>
      )}
      {guest ? (
        <div className="mt-8 flex flex-col items-center gap-3 w-full">
          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--gold)] text-[#0c0a09] px-7 py-3.5 rounded-full text-[15px] font-semibold hover:bg-transparent hover:text-[var(--gold)] border border-[var(--gold)] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            J&apos;ai ouvert le lien, accéder à mon espace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="text-[12px] text-[var(--mist)] text-center max-w-sm">
            Rien reçu après deux minutes ? Vérifiez les courriers indésirables, puis écrivez à
            contact@instadeco.app avec l&apos;adresse utilisée au paiement.
          </p>
        </div>
      ) : (
        <>
          <Actions isSub={isSub} />
          <p className="mt-6 text-[12px] text-[var(--mist)] text-center">
            Un email de confirmation vient de vous être envoyé.
          </p>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[var(--ink)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg flex flex-col items-center rounded-[28px] border border-[var(--gold-line)] bg-[var(--stone-900)] px-6 py-12 sm:px-10 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
        {children}
      </div>
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <div
      className={`w-16 h-16 rounded-full flex items-center justify-center ${
        ok ? 'bg-emerald-500/12 border border-emerald-500/30' : 'bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)]'
      }`}
    >
      {ok ? (
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      ) : (
        <Loader2 className="w-8 h-8 text-[var(--gold)] animate-spin" />
      )}
    </div>
  );
}

function Actions({ isSub }: { isSub: boolean }) {
  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
      <Link
        href="/generate"
        className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--gold)] text-[#0c0a09] px-7 py-3.5 rounded-full text-[15px] font-semibold hover:bg-transparent hover:text-[var(--gold)] border border-[var(--gold)] transition-all"
      >
        <Sparkles className="w-4 h-4" />
        Transformer une pièce
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full text-[14px] text-[var(--mist)] hover:text-[var(--gold)] border border-[var(--gold-line)] transition-colors"
      >
        <ImageIcon className="w-4 h-4" />
        {isSub ? 'Mon espace' : 'Mes créations'}
      </Link>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <Loader2 className="h-10 w-10 animate-spin text-[var(--gold)]" />
        </Shell>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
