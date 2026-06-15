import { Result, success, failure } from '@/src/shared/types/Result';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { ILeadRepository } from '@/src/domain/ports/repositories/ILeadRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

/**
 * Use Case : désinscription marketing.
 *
 * Coupe le consentement marketing sur le profil (s'il existe — 0 ligne = no-op) ET
 * marque le lead désinscrit (table optionnelle, non bloquant). L'email est supposé
 * déjà validé en amont (token HMAC côté route).
 */
export class UnsubscribeUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly leadRepo: ILeadRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(email: string): Promise<Result<{ unsubscribed: boolean }>> {
    const normalized = email.toLowerCase();

    // Opération principale : consentement marketing du profil.
    const profile = await this.userRepo.setMarketingConsentByEmail(normalized, false);
    if (!profile.success) {
      this.logger.error('Unsubscribe: échec maj consentement profil', profile.error as Error);
      return failure(profile.error);
    }

    // Secondaire (non bloquant) : la table leads est optionnelle.
    const lead = await this.leadRepo.markUnsubscribed(normalized);
    if (!lead.success) {
      this.logger.warn('Unsubscribe: maj lead ignorée', { error: lead.error.message });
    }

    return success({ unsubscribed: true });
  }
}
