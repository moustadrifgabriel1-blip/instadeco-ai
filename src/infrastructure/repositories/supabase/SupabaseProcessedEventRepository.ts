import { Result, success, failure } from '@/src/shared/types/Result';
import { IProcessedEventRepository } from '@/src/domain/ports/repositories/IProcessedEventRepository';
import { getSupabaseAdmin } from './supabaseClient';

/** Code d'erreur PostgreSQL pour violation de contrainte unique. */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Adapter: Supabase ProcessedEvent Repository
 *
 * Implémente le verrou d'idempotence via la table `processed_stripe_events`.
 * L'INSERT de la clé primaire (event_id) sert de verrou atomique : une
 * collision (23505) signifie que l'événement a déjà été traité.
 */
export class SupabaseProcessedEventRepository implements IProcessedEventRepository {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async markProcessed(eventId: string, eventType: string): Promise<Result<boolean>> {
    const { error } = await this.supabase
      .from('processed_stripe_events')
      .insert({ event_id: eventId, type: eventType });

    if (error) {
      // Collision sur la clé primaire → événement déjà traité (rejeu légitime).
      if (error.code === PG_UNIQUE_VIOLATION) {
        return success(false);
      }
      return failure(new Error(`Failed to mark event as processed: ${error.message}`));
    }

    return success(true);
  }

  async unmarkProcessed(eventId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('processed_stripe_events')
      .delete()
      .eq('event_id', eventId);

    if (error) {
      return failure(new Error(`Failed to unmark event: ${error.message}`));
    }

    return success(undefined);
  }
}
