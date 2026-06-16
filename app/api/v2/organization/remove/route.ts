import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/api-auth';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v2/organization/remove  { memberId }
 * L'owner retire un membre (libère un siège). Le owner ne peut pas se retirer.
 */
export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const memberId = typeof body.memberId === 'string' ? body.memberId : '';
  if (!memberId) {
    return NextResponse.json({ error: 'memberId requis' }, { status: 400 });
  }

  const result = await useCases.removeMember.execute({ ownerId: auth.user.id, memberId });
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
