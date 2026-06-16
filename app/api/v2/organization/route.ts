import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/api-auth';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/organization
 * Renvoie l'organisation Agence dont l'utilisateur est owner + ses membres.
 * organization=null si l'utilisateur n'est pas propriétaire d'une org.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const result = await useCases.getOrganization.execute(auth.user.id);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  return NextResponse.json(result.data);
}
