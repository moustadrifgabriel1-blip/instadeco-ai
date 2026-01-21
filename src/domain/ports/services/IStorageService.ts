import { Result } from '@/src/shared/types/Result';

/**
 * Options d'upload d'image
 */
export interface UploadImageOptions {
  bucket: 'input-images' | 'output-images';
  fileName: string;
  contentType: string;
}

/**
 * Port Service - Storage
 * Interface pour le stockage de fichiers (Supabase Storage)
 */
export interface IStorageService {
  /**
   * Upload une image depuis un buffer
   */
  uploadFromBuffer(
    buffer: Buffer,
    options: UploadImageOptions
  ): Promise<Result<{ url: string; path: string }>>;

  /**
   * Upload une image depuis une URL externe
   */
  uploadFromUrl(
    sourceUrl: string,
    options: UploadImageOptions
  ): Promise<Result<{ url: string; path: string }>>;

  /**
   * Upload une image depuis base64
   */
  uploadFromBase64(
    base64: string,
    options: UploadImageOptions
  ): Promise<Result<{ url: string; path: string }>>;

  /**
   * Récupère l'URL publique d'un fichier
   */
  getPublicUrl(bucket: string, path: string): Result<string>;

  /**
   * Supprime un fichier
   */
  delete(bucket: string, path: string): Promise<Result<void>>;

  /**
   * Génère une URL signée temporaire
   */
  createSignedUrl(bucket: string, path: string, expiresIn: number): Promise<Result<string>>;
}
