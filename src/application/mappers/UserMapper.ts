import { User } from '@/src/domain/entities/User';
import { UserDTO } from '../dtos/UserDTO';

/**
 * Mapper: User Entity ↔ UserDTO
 */
export class UserMapper {
  /**
   * Entity → DTO
   */
  static toDTO(entity: User): UserDTO {
    return {
      id: entity.id,
      email: entity.email,
      fullName: entity.fullName,
      avatarUrl: entity.avatarUrl,
      credits: entity.credits,
      createdAt: entity.createdAt.toISOString(),
    };
  }

  /**
   * Entity[] → DTO[]
   */
  static toDTOList(entities: User[]): UserDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * DTO → Entity
   */
  static toEntity(dto: UserDTO): User {
    return {
      id: dto.id,
      email: dto.email,
      fullName: dto.fullName,
      avatarUrl: dto.avatarUrl,
      credits: dto.credits,
      stripeCustomerId: null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.createdAt),
    };
  }
}
