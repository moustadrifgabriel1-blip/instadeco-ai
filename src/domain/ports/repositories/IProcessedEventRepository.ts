import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - ProcessedEvent
 *
 * Verrou d'idempotence pour les webhooks de paiement.
 * Stripe rejoue les webhooks (retries réseau, redéploiements) : chaque
 * événement ne doit produire ses effets (crédit) qu'une seule fois.
 */
export interface IProcessedEventRepository {
  /**
   * Tente de marquer un événement comme traité (insertion d'un verrou).
   *
   * @returns Result<true>  si l'événement est nouveau → il FAUT le traiter.
   *          Result<false> si l'événement était déjà présent (rejeu) → NE PAS retraiter.
   *          Result.failure uniquement en cas d'erreur infrastructure inattendue.
   */
  markProcessed(eventId: string, eventType: string): Promise<Result<boolean>>;

  /**
   * Annule le marquage d'un événement (rollback).
   * À appeler si le traitement (crédit) échoue après le marquage, afin
   * qu'un éventuel rejeu Stripe puisse retraiter l'événement.
   */
  unmarkProcessed(eventId: string): Promise<Result<void>>;
}
