import { Generation, CreateGenerationInput, UpdateGenerationInput, PublicGalleryItem, PublicGalleryQuery } from '../../entities/Generation';
import { Result } from '@/src/shared/types/Result';

/**
 * Port Repository - Generation
 * Interface pour la persistance des générations
 */
export interface IGenerationRepository {
  /**
   * Crée une nouvelle génération
   */
  create(input: CreateGenerationInput): Promise<Result<Generation>>;

  /**
   * Récupère une génération par ID
   */
  findById(id: string): Promise<Result<Generation | null>>;

  /**
   * Récupère toutes les générations d'un utilisateur
   */
  findByUserId(userId: string, limit?: number): Promise<Result<Generation[]>>;

  /**
   * Met à jour une génération
   */
  update(id: string, input: UpdateGenerationInput): Promise<Result<Generation>>;

  /**
   * Transition conditionnelle (et atomique) 'pending'/'processing' → 'failed'.
   *
   * Idempotent : la mise à jour n'a lieu QUE si le statut courant est encore
   * 'pending' ou 'processing'. Permet de garantir qu'un seul appelant (sous
   * polling concurrent) effectue réellement la transition — et donc qu'un
   * remboursement de crédit n'est déclenché qu'une seule fois.
   *
   * @returns `transitioned: true` si CET appel a effectué la transition,
   *          `false` si la ligne était déjà dans un autre statut (déjà transité
   *          par un appel concurrent, ou déjà completed/failed).
   *          `generation` reflète l'état courant en base dans les deux cas.
   */
  markFailedIfPending(id: string): Promise<Result<{ transitioned: boolean; generation: Generation }>>;

  /**
   * Récupère les générations bloquées en 'pending'/'processing' dont la dernière
   * mise à jour remonte à plus de `olderThanMs` ms (candidates à la réconciliation
   * serveur + remboursement). `limit` borne le travail d'un run cron.
   */
  findStuck(olderThanMs: number, limit?: number): Promise<Result<Generation[]>>;

  /**
   * Galerie publique : générations 'completed' ANONYMISÉES (jamais userId/inputImageUrl),
   * récentes d'abord, paginées, avec total (filtres style/pièce respectés).
   */
  findPublicGallery(query: PublicGalleryQuery): Promise<Result<{ items: PublicGalleryItem[]; total: number }>>;

  /**
   * Supprime une génération
   */
  delete(id: string): Promise<Result<void>>;

  /**
   * Compte le nombre de générations d'un utilisateur
   */
  countByUserId(userId: string): Promise<Result<number>>;
}
