import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client admin (bypass RLS) 
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Upload une image base64 vers Supabase Storage (côté serveur)
 * 
 * @param base64String - Image en base64
 * @param userId - ID de l'utilisateur
 * @param folder - Bucket destination ('input-images' ou 'output-images')
 */
export async function uploadImageFromBase64(
  base64String: string,
  userId: string,
  folder: 'inputs' | 'outputs' = 'inputs'
): Promise<string> {
  try {
    // Supprimer le préfixe "data:image/xxx;base64," si présent
    const base64Data = base64String.includes(',')
      ? base64String.split(',')[1]
      : base64String;

    const buffer = Buffer.from(base64Data, 'base64');

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${userId}/${timestamp}-${randomId}.jpg`;

    // Choisir le bucket selon le dossier
    const bucket = folder === 'inputs' ? 'input-images' : 'output-images';

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[Storage] ❌ Upload error:', error);
      throw new Error('Erreur lors de l\'upload de l\'image');
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`[Storage] ✅ Image uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Storage] ❌ Upload error:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
}

/**
 * Upload une image depuis une URL vers Supabase Storage (côté serveur)
 * Utilisé pour sauvegarder les résultats Replicate
 * 
 * @param imageUrl - URL de l'image à télécharger et uploader
 * @param userId - ID de l'utilisateur
 * @param folder - Bucket destination ('inputs' ou 'outputs')
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  userId: string,
  folder: 'inputs' | 'outputs' = 'outputs'
): Promise<string> {
  try {
    console.log(`[Storage] Downloading image from: ${imageUrl}`);

    // Télécharger l'image depuis l'URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileName = `${userId}/${timestamp}-${randomId}.jpg`;

    // Choisir le bucket selon le dossier
    const bucket = folder === 'inputs' ? 'input-images' : 'output-images';

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('[Storage] ❌ Upload from URL error:', error);
      throw error;
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`[Storage] ✅ Image uploaded from URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Storage] ❌ Error uploading from URL:', error);
    throw error;
  }
}

/**
 * Convertir un fichier base64 en Blob (côté client)
 */
export function base64ToBlob(base64String: string): Blob {
  // Supprimer le préfixe "data:image/xxx;base64," si présent
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String;

  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/jpeg' });
}

/**
 * Upload un fichier image vers Supabase Storage (côté client)
 */
export async function uploadImageToStorageClient(
  file: File | Blob,
  userId: string,
  folder: 'inputs' | 'outputs' = 'inputs',
  supabaseClient: ReturnType<typeof createSupabaseClient>
): Promise<string> {
  try {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const fileName = `${userId}/${timestamp}-${randomId}.${extension}`;

    const bucket = folder === 'inputs' ? 'input-images' : 'output-images';

    console.log(`[Storage] Uploading file: ${fileName}`);

    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.error('[Storage] ❌ Upload error:', error);
      throw new Error('Erreur lors de l\'upload de l\'image');
    }

    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log(`[Storage] ✅ File uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[Storage] ❌ Upload error:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
}
