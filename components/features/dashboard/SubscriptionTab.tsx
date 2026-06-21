'use client';

import { useEffect, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { Link } from '@/i18n/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, ArrowRight, CheckCircle2, AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';

interface SubscriptionTabProps {
  user: User | null;
  supabase: SupabaseClient | null;
}

type ProStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | null;
type ProPlan = 'solo' | 'pro' | 'agence' | string | null;

const PLAN_LABEL: Record<string, string> = {
  solo: 'Solo',
  pro: 'Pro',
  agence: 'Agence',
};
const PLAN_DETAIL: Record<string, string> = {
  solo: '40 images par mois, 1 utilisateur, qualité HD, licence commerciale.',
  pro: 'Générations illimitées (fair-use), export pièce vide, support prioritaire.',
  agence: 'Illimité, jusqu\'à 3 sièges, facturation centralisée, support dédié.',
};

export function SubscriptionTab({ user, supabase }: SubscriptionTabProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ProStatus>(null);
  const [plan, setPlan] = useState<ProPlan>(null);
  const [renewsAt, setRenewsAt] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase || !user) { setLoading(false); return; }
      const { data } = await supabase
        .from('profiles')
        .select('pro_status, pro_plan, pro_renews_at')
        .eq('id', user.id)
        .single();
      if (!active) return;
      if (data) {
        setStatus((data.pro_status as ProStatus) ?? null);
        setPlan((data.pro_plan as ProPlan) ?? null);
        setRenewsAt(data.pro_renews_at ?? null);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [supabase, user]);

  const openPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v2/payments/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || 'Le portail est momentanément indisponible.');
        setPortalLoading(false);
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setError('Erreur réseau. Réessayez.');
      setPortalLoading(false);
    }
  };

  const hasCustomer = status !== null; // a déjà un abonnement (actif, en attente, annulé...)
  const isActive = status === 'active' || status === 'trialing';
  const planLabel = plan ? PLAN_LABEL[plan] ?? plan : null;
  const renewsLabel = renewsAt
    ? new Date(renewsAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="prestige-display text-2xl font-semibold text-foreground mb-6">Abonnement</h1>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Statut de l'abonnement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              {hasCustomer ? `Abonnement ${planLabel ?? ''}`.trim() : 'Aucun abonnement actif'}
            </CardTitle>
            <CardDescription>
              {hasCustomer ? 'Votre formule et son statut' : 'Vous utilisez la formule gratuite (crédits)'}
            </CardDescription>
          </div>
          {hasCustomer && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                isActive
                  ? 'bg-emerald-500/12 text-emerald-400'
                  : status === 'past_due'
                    ? 'bg-amber-500/12 text-amber-400'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
              {status === 'past_due' && <AlertTriangle className="w-3.5 h-3.5" />}
              {isActive ? 'Actif' : status === 'past_due' ? 'Paiement en attente' : status === 'canceled' ? 'Annulé' : 'Inactif'}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCustomer ? (
            <>
              {plan && PLAN_DETAIL[plan] && (
                <p className="text-sm text-muted-foreground">{PLAN_DETAIL[plan]}</p>
              )}
              {isActive && renewsLabel && (
                <p className="text-sm text-foreground">
                  Prochain renouvellement le <strong>{renewsLabel}</strong>.
                </p>
              )}
              {status === 'past_due' && (
                <p className="text-sm text-amber-400">
                  Votre dernier paiement a échoué. Mettez à jour votre carte pour garder votre accès.
                </p>
              )}
              <Button onClick={openPortal} disabled={portalLoading} className="gap-2">
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Gérer mon abonnement
              </Button>
              <p className="text-xs text-muted-foreground">
                Changez de formule, mettez à jour votre carte, téléchargez vos factures ou annulez en un clic via le
                portail sécurisé Stripe.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Passez à un abonnement Pro pour des générations illimitées, l&apos;export pièce vide et la
                facturation professionnelle.
              </p>
              <Link
                href="/pro"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Sparkles className="w-4 h-4" />
                Découvrir les offres Pro
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-muted-foreground">
                Déjà client ?{' '}
                <button onClick={openPortal} disabled={portalLoading} className="underline hover:text-foreground">
                  Gérer ma facturation
                </button>
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rappel des formules */}
      <Card>
        <CardHeader>
          <CardTitle>Les formules</CardTitle>
          <CardDescription>Sans engagement, annulez en un clic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {(['solo', 'pro', 'agence'] as const).map((p) => (
              <div
                key={p}
                className={`rounded-xl border p-4 ${plan === p && isActive ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{PLAN_LABEL[p]}</span>
                  {plan === p && isActive && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{PLAN_DETAIL[p]}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/pro" className="text-sm text-primary underline-offset-4 hover:underline">
              Voir le détail et les tarifs
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
