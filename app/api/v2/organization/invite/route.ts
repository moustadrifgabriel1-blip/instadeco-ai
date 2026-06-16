import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/api-auth';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v2/organization/invite  { email }
 * L'owner invite un membre (cap = sièges de l'org Agence).
 */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === 'string' ? body.email : '';

  const result = await useCases.inviteMember.execute({ ownerId: auth.user.id, email });
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, member: result.data });
}
