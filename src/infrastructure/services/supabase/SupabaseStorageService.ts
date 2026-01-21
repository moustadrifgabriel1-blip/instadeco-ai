import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IStorageService, 
  UploadImageOptions 
} from '@/src/domain/ports/services/IStorageService';
import { getSupabaseAdmin } from '../../repositories/supabase/supabaseClient';

/**
 * Adapter: Supabase Storage Service
 * Implémente IStorageService avec Supabase Storage
 */
export class SupabaseStorageService implements IStorageService {
  private get supabase() {
    return getSupabaseAdmin();
  }

  async uploadFromBuffer(
    buffer: Buffer,
    options: UploadImageOptions
  ): Promise<Result<{ url: string; path: string }>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(options.bucket)
        .upload(options.fileName, buffer, {
          contentType: options.contentType,
          upsert: true,
        });

      if (error) {
        return failure(new Error(`Upload failed: ${error.message}`));
      }

      const urlResult = this.getPublicUrl(options.bucket, data.path);
      if (!urlResult.success) {
        return urlResult;
      }

      return success({
        url: urlResult.data,
        path: data.path,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Upload from buffer failed: ${message}`));
    }
  }

  async uploadFromUrl(
    sourceUrl: string,
    options: UploadImageOptions
  ): Promise<Result<{ url: string; path: string }>> {
    try {
      // Télécharger l'image depuis l'URL source
      const response = await fetch(sourceUrl);
      
      if (!response.ok) {
        return failure(new Error(`Failed to fetch image from URL: ${response.status}`));
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return this.uploadFromBuffer(buffer, options);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Upload from URL failed: ${message}`));
    }
  }

  async uploadFromBase64(
    base64: string,
    options: UploadImageOptions
  ): Promise<Result<{ url: string; path: string }>> {
    try {
      // Nettoyer le base64 (enlever le prefix data:image/...)
      let cleanBase64 = base64;
      if (base64.includes(',')) {
        cleanBase64 = base64.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');

      return this.uploadFromBuffer(buffer, options);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Upload from base64 failed: ${message}`));
    }
  }

  getPublicUrl(bucket: string, path: string): Result<string> {
    try {
      const { data } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return success(data.publicUrl);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to get public URL: ${message}`));
    }
  }

  async delete(bucket: string, path: string): Promise<Result<void>> {
    try {
      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return failure(new Error(`Delete failed: ${error.message}`));
      }

      return success(undefined);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Delete failed: ${message}`));
    }
  }

  async createSignedUrl(bucket: string, path: string, expiresIn: number): Promise<Result<string>> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return failure(new Error(`Signed URL creation failed: ${error.message}`));
      }

      return success(data.signedUrl);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Signed URL creation failed: ${message}`));
    }
  }
}
