import { Result } from '@/src/shared/types/Result';

/**
 * Résultat du provisionnement d'un compte pour un achat invité (guest checkout).
 */
export interface GuestProvisionResult {
  /** Identifiant du compte Supabase auth (créé ou existant). */
  userId: string;
  /** true si le compte vient d'être créé, false s'il existait déjà. */
  created: boolean;
}

/**
 * Port Service - Auth (provisionnement de compte côté serveur).
 *
 * Utilisé par le webhook Stripe pour matérialiser un compte après un achat
 * effectué sans être connecté (guest checkout), de façon idempotente.
 */
export interface IAuthService {
  /**
   * Trouve le compte associé à un email, ou le crée s'il n'existe pas.
   *
   * Quand un compte est créé, un magic link de connexion est envoyé par email
   * (best-effort : un échec d'envoi n'invalide pas le provisionnement, car les
   * crédits achetés doivent toujours être attribués).
   *
   * @param email Email du client Stripe.
   * @param creditsPurchased Nombre de crédits achetés (pour le contenu de l'email).
   */
  provisionGuestForPurchase(
    email: string,
    creditsPurchased: number,
  ): Promise<Result<GuestProvisionResult>>;
}
