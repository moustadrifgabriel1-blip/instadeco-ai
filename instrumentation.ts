/**
 * Next.js Instrumentation Hook — exécuté UNE fois au démarrage du serveur.
 *
 * On valide ici les variables d'environnement (fail-fast) : si une variable
 * critique manque ou est malformée, le serveur refuse de démarrer avec un
 * message clair plutôt que de crasher plus tard de façon obscure (ex: à la
 * première requête de génération ou de paiement).
 *
 * La validation ne tourne que dans le runtime Node.js (les secrets serveur ne
 * sont pas disponibles — et n'ont pas de sens — dans le runtime Edge).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { getEnv } = await import('@/src/infrastructure/config/env');
    getEnv(); // throw si une variable d'environnement est invalide
  }
}
