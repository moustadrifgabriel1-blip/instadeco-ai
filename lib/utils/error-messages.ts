/**
 * Traduction des messages d'erreur Firebase en français
 */

const firebaseErrorMessages: Record<string, string> = {
  // Auth errors
  'auth/invalid-email': 'Adresse email invalide.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée.',
  'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
  'auth/popup-closed-by-user': 'La fenêtre de connexion a été fermée.',
  'auth/popup-blocked': 'La fenêtre de connexion a été bloquée par votre navigateur.',
  'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email mais avec une autre méthode de connexion.',
  'auth/requires-recent-login': 'Veuillez vous reconnecter pour effectuer cette action.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/network-request-failed': 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
  'auth/internal-error': 'Une erreur interne s\'est produite. Veuillez réessayer.',
  'auth/invalid-login-credentials': 'Email ou mot de passe incorrect.',
  
  // Firestore errors
  'permission-denied': 'Vous n\'avez pas la permission d\'effectuer cette action.',
  'unavailable': 'Service temporairement indisponible. Veuillez réessayer.',
  'not-found': 'Document introuvable.',
  'already-exists': 'Ce document existe déjà.',
  'failed-precondition': 'Opération impossible dans l\'état actuel.',
  'resource-exhausted': 'Quota dépassé. Veuillez réessayer plus tard.',
  'cancelled': 'Opération annulée.',
  'data-loss': 'Perte de données irrécupérable.',
  'unknown': 'Une erreur inconnue s\'est produite.',
  'deadline-exceeded': 'Délai d\'attente dépassé. Veuillez réessayer.',
  'aborted': 'Opération interrompue.',
  
  // Offline errors
  'Failed to get document because the client is offline.': 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
  'client is offline': 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
};

/**
 * Traduit un message d'erreur Firebase en français
 */
export function translateFirebaseError(error: unknown): string {
  if (!error) {
    return 'Une erreur est survenue.';
  }

  // Si c'est un objet Error avec un code Firebase
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string };
    
    // Essayer d'abord avec le code d'erreur
    if (err.code && firebaseErrorMessages[err.code]) {
      return firebaseErrorMessages[err.code];
    }
    
    // Essayer avec le message
    if (err.message) {
      // Vérifier si le message contient une clé connue
      for (const [key, translation] of Object.entries(firebaseErrorMessages)) {
        if (err.message.includes(key)) {
          return translation;
        }
      }
      
      // Si le message est en anglais et contient "offline"
      if (err.message.toLowerCase().includes('offline')) {
        return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      }
    }
  }

  // Si c'est une chaîne
  if (typeof error === 'string') {
    if (firebaseErrorMessages[error]) {
      return firebaseErrorMessages[error];
    }
    
    for (const [key, translation] of Object.entries(firebaseErrorMessages)) {
      if (error.includes(key)) {
        return translation;
      }
    }
    
    if (error.toLowerCase().includes('offline')) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    }
  }

  // Message par défaut
  return 'Une erreur est survenue. Veuillez réessayer.';
}
