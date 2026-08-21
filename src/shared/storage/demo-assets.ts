/**
 * Protection des images de démonstration dans le storage.
 *
 * Les photos « avant » du compte démo ne sont pas des uploads jetables : ce
 * sont les images de preuve affichées sur la home, /pro, /exemples et la
 * galerie. La purge hebdomadaire de `input-images` les a détruites deux fois
 * (juillet, puis août), laissant les comparatifs avant/après à moitié vides
 * sur les pages qui vendent. Les deux fois, seules les images avaient été
 * remplacées, jamais la règle qui les supprimait.
 *
 * Isolé ici pour être testable, et pour qu'un seul endroit fasse foi.
 */

/** Compte démo, seul autorisé à alimenter les pages indexées (règle RGPD). */
export const DEMO_USER_ID = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6';

/** Préfixe des objets de ce compte dans le bucket `input-images`. */
export const DEMO_INPUT_PREFIX = `${DEMO_USER_ID}/`;

/**
 * Un objet de `input-images` est-il protégé contre la purge automatique ?
 *
 * Les photos des vrais utilisateurs ne le sont pas : elles ne servent qu'à la
 * génération initiale et doivent continuer d'être purgées, pour la vie privée
 * comme pour le quota de stockage.
 */
export function isProtectedDemoInput(objectName: string): boolean {
  return objectName.startsWith(DEMO_INPUT_PREFIX);
}
