import { NextResponse } from 'next/server';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * CRON : Réconciliation des générations zombies.
 *
 * Filet de sécurité SERVEUR : rembourse (idempotemment) les générations bloquées
 * en 'pending'/'processing' depuis > 5 min — cas où l'onglet client a été fermé
 * pendant un crash de fal.run(), donc où le remboursement piloté par le polling
 * client ne s'est jamais déclenché. Crédits = argent : on ne laisse jamais un crédit
 * perdu.
 *
 * Protégé par CRON_SECRET (Bearer). NB : à fondre dans le cron orchestrateur lors de
 * la consolidation des crons (cf. docs/CLOUDFLARE_MIGRATION.md §5).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await useCases.reconcileStuckGenerations.execute({ olderThanMs: 5 * 60 * 1000 });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...result.data });
}
