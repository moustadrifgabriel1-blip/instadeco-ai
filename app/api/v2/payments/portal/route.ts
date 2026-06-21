import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/api-auth';
import { useCases } from '@/src/infrastructure/config/di-container';
import { NoStripeCustomerError } from '@/src/application/use-cases/payments/CreateBillingPortalSessionUseCase';

/**
 * POST /api/v2/payments/portal
 *
 * Ouvre le portail de facturation Stripe (gestion d'abonnement : changer de plan,
 * mettre à jour la carte, annuler, télécharger les factures). Le customerId vient
 * TOUJOURS du profil serveur (jamais du client).
 */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const origin = new URL(req.url).origin;
    const result = await useCases.createBillingPortal.execute({
      userId: auth.user.id,
      returnUrl: `${origin}/dashboard`,
    });

    if (!result.success) {
      // Pas de client Stripe (jamais abonné/acheté) → 400 avec message utile.
      if (result.error instanceof NoStripeCustomerError) {
        return NextResponse.json({ error: result.error.message }, { status: 400 });
      }
      // Erreur Stripe/interne : on logge le détail, message générique au client.
      console.error('[Portal] ❌ Erreur:', result.error.message);
      return NextResponse.json(
        { error: 'Le portail est momentanément indisponible. Merci de réessayer dans quelques minutes.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: result.data.url });
  } catch (error) {
    console.error('[Portal] ❌ Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
