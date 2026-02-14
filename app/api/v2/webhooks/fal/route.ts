import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v2/webhooks/fal
 * 
 * ⚠️ DEPRECATED — Ce webhook n'est plus utilisé.
 * La génération utilise fal.run() synchrone depuis février 2026.
 * Le webhook n'est jamais appelé car on n'envoie plus de webhookUrl à fal.ai.
 * 
 * Route gardée pour éviter les erreurs 404 si fal.ai envoie encore d'anciens callbacks.
 * NE PAS SUPPRIMER — NE PAS AJOUTER DE LOGIQUE ICI.
 * Lire docs/GENERATION_ARCHITECTURE.md pour l'architecture actuelle.
 */
export async function POST(req: Request) {
  console.log('[Fal Webhook] ⚠️ Webhook reçu mais ignoré (architecture synchrone)');
  return NextResponse.json({ received: true, note: 'webhook deprecated - sync mode' });
}
