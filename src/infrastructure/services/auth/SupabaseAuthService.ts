import { Result, success, failure } from '@/src/shared/types/Result';
import { IAuthService, GuestProvisionResult } from '@/src/domain/ports/services/IAuthService';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { sendGuestCheckoutMagicLink } from '@/lib/notifications/guest-checkout-email';

/**
 * Adapter: Supabase Auth Service (provisionnement de compte serveur).
 *
 * Utilise le client admin (service_role) pour matérialiser un compte après un
 * achat invité, de façon idempotente :
 *  - si un profil existe déjà pour l'email → on le réutilise (pas de doublon),
 *  - sinon on crée le compte auth (le trigger `handle_new_user` crée le profil),
 *    puis on envoie un magic link de connexion (best-effort).
 */
export class SupabaseAuthService implements IAuthService {
  async provisionGuestForPurchase(
    email: string,
    creditsPurchased: number,
  ): Promise<Result<GuestProvisionResult>> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      return failure(new Error('Email requis pour le provisionnement guest'));
    }

    const admin = getSupabaseAdmin();

    // 1. Compte déjà existant ? (profil lié à auth.users via le trigger).
    const { data: existing, error: findError } = await admin
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (findError) {
      return failure(new Error(`Recherche profil échouée: ${findError.message}`));
    }

    if (existing?.id) {
      // Compte existant : on se contente de retourner l'id (le crédit-tage
      // est fait par le use-case appelant). Pas de magic link envoyé.
      return success({ userId: existing.id as string, created: false });
    }

    // 2. Création du compte auth (email confirmé d'emblée, achat = preuve).
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
    });

    if (createError || !created?.user?.id) {
      // Cas de course : un autre webhook a pu créer le compte entre-temps.
      const { data: retry } = await admin
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();
      if (retry?.id) {
        return success({ userId: retry.id as string, created: false });
      }
      return failure(new Error(`Création du compte échouée: ${createError?.message ?? 'inconnue'}`));
    }

    const userId = created.user.id;

    // 3. Magic link de connexion (best-effort : un échec ne bloque pas le crédit).
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/auth/callback` },
      });

      const actionLink = linkData?.properties?.action_link;
      if (!linkError && actionLink) {
        await sendGuestCheckoutMagicLink(normalizedEmail, actionLink, creditsPurchased);
      } else if (linkError) {
        console.error('[SupabaseAuthService] generateLink échec:', linkError.message);
      }
    } catch (err) {
      console.error('[SupabaseAuthService] envoi magic link échoué (non bloquant):', err);
    }

    return success({ userId, created: true });
  }
}
