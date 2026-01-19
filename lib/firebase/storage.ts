import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Upload un fichier image vers Firebase Storage
 * 
 * @param file - Fichier image à uploader
 * @param userId - ID de l'utilisateur (pour organiser les fichiers)
 * @param folder - Dossier de destination ('inputs' ou 'outputs')
 * @returns Promise<string> - URL publique du fichier uploadé
 * 
 * @example
 * const url = await uploadImageToStorage(file, 'user123', 'inputs');
 */
export async function uploadImageToStorage(
  file: File | Blob,
  userId: string,
  folder: 'inputs' | 'outputs' = 'inputs'
): Promise<string> {
  try {
    // Créer un nom de fichier unique : userId/folder/timestamp-random.ext
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const fileName = `${userId}/${folder}/${timestamp}-${randomId}.${extension}`;
    
    // Référence au fichier dans Storage
    const storageRef = ref(storage, fileName);
    
    console.log(`[Storage] Uploading file: ${fileName}`);
    
    // Upload du fichier
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
    });
    
    // Récupérer l'URL publique
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`[Storage] ✅ File uploaded: ${downloadURL}`);
    
    return downloadURL;
  } catch (error) {
    console.error('[Storage] ❌ Upload error:', error);
    throw new Error('Erreur lors de l\'upload de l\'image');
  }
}

/**
 * Upload une image depuis une URL (pour sauvegarder les résultats Replicate)
 * 
 * @param imageUrl - URL de l'image à télécharger et uploader
 * @param userId - ID de l'utilisateur
 * @param folder - Dossier de destination
 * @returns Promise<string> - URL Firebase Storage
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
    
    const blob = await response.blob();
    
    // Upload vers Firebase Storage
    return await uploadImageToStorage(blob, userId, folder);
  } catch (error) {
    console.error('[Storage] ❌ Error uploading from URL:', error);
    throw error;
  }
}

/**
 * Convertir un fichier base64 en Blob
 * 
 * @param base64String - String base64 (avec ou sans préfixe data:image/...)
 * @returns Blob
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
