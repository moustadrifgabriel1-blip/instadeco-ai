import { CreditTransaction } from '@/src/domain/entities/Credit';
import { CreditTransactionDTO } from '../dtos/CreditDTO';

/**
 * Mapper: CreditTransaction Entity ↔ CreditTransactionDTO
 */
export class CreditMapper {
  /**
   * Entity → DTO
   */
  static toDTO(entity: CreditTransaction): CreditTransactionDTO {
    return {
      id: entity.id,
      amount: entity.amount,
      type: entity.type,
      description: entity.description,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  /**
   * Entity[] → DTO[]
   */
  static toDTOList(entities: CreditTransaction[]): CreditTransactionDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }
}
