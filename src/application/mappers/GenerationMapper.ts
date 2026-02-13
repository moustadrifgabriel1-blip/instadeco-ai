import { Generation } from '@/src/domain/entities/Generation';
import { GenerationDTO } from '../dtos/GenerationDTO';

/**
 * Mapper: Generation Entity ↔ GenerationDTO
 */
export class GenerationMapper {
  /**
   * Entity → DTO
   */
  static toDTO(entity: Generation): GenerationDTO {
    return {
      id: entity.id,
      userId: entity.userId,
      styleSlug: entity.styleSlug,
      roomType: entity.roomType,
      inputImageUrl: entity.inputImageUrl,
      outputImageUrl: entity.outputImageUrl,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  /**
   * Entity[] → DTO[]
   */
  static toDTOList(entities: Generation[]): GenerationDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * DTO → Entity (pour les cas de reconstruction)
   */
  static toEntity(dto: GenerationDTO): Generation {
    return {
      id: dto.id,
      userId: dto.userId,
      styleSlug: dto.styleSlug,
      roomType: dto.roomType,
      inputImageUrl: dto.inputImageUrl,
      outputImageUrl: dto.outputImageUrl,
      status: dto.status as Generation['status'],
      prompt: null,
      stripeSessionId: null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
