/**
 * Réexécute `fn` en cas d'échec transitoire (réseau, timeout, blip Supabase).
 *
 * Backoff linéaire court (delayMs, 2x, 3x...). Relance la dernière erreur si
 * tous les essais échouent, pour que l'appelant décide du fallback.
 *
 * Utile pour les fetchs de données en SSR/ISR : un seul blip réseau ne doit
 * pas faire échouer un rendu (et, en ISR, mettre un résultat vide en cache).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; delayMs?: number } = {},
): Promise<T> {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const delayMs = opts.delayMs ?? 250;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
}
