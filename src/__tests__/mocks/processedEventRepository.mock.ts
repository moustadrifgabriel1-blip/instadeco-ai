import { vi } from 'vitest';
import { success } from '@/src/shared/types/Result';
import { IProcessedEventRepository } from '@/src/domain/ports/repositories/IProcessedEventRepository';

/**
 * Mock du ProcessedEvent Repository (verrou d'idempotence) pour les tests.
 *
 * Par défaut, simule un verrou réel en mémoire : le premier markProcessed
 * d'un event_id renvoie true (nouveau), les suivants renvoient false (rejeu).
 */
export function createMockProcessedEventRepository(
  overrides: Partial<IProcessedEventRepository> = {},
): IProcessedEventRepository {
  const seen = new Set<string>();

  return {
    markProcessed: vi.fn(async (eventId: string) => {
      if (seen.has(eventId)) {
        return success(false);
      }
      seen.add(eventId);
      return success(true);
    }),
    unmarkProcessed: vi.fn(async (eventId: string) => {
      seen.delete(eventId);
      return success(undefined);
    }),
    ...overrides,
  };
}
