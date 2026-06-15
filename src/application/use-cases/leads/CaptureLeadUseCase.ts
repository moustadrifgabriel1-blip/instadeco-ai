import { Result, success, failure } from '@/src/shared/types/Result';
import { ILeadRepository, CaptureLeadInput } from '@/src/domain/ports/repositories/ILeadRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

export interface CaptureLeadOutput {
  /** true si un nouveau lead a été créé, false s'il existait déjà (dédup). */
  captured: boolean;
}

/**
 * Use Case : capture d'un lead (email marketing).
 * Dédup silencieuse : si l'email existe déjà, succès sans rien révéler.
 */
export class CaptureLeadUseCase {
  constructor(
    private readonly leadRepo: ILeadRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: CaptureLeadInput): Promise<Result<CaptureLeadOutput>> {
    const existing = await this.leadRepo.existsByEmail(input.email);
    if (!existing.success) {
      return failure(existing.error);
    }
    if (existing.data) {
      return success({ captured: false });
    }

    const created = await this.leadRepo.create(input);
    if (!created.success) {
      this.logger.error('Lead capture failed', created.error as Error, { source: input.source });
      return failure(created.error);
    }

    this.logger.info('Lead captured', { source: input.source });
    return success({ captured: true });
  }
}
