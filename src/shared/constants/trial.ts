/**
 * Constantes de l'essai gratuit (anti-abus + conversion).
 *
 * Source de vérité UNIQUE pour le nombre de générations offertes sans compte.
 * Modifier ici suffit : la route /api/trial/generate (rate limit + check Supabase)
 * et l'UI (compteur affiché) s'appuient toutes deux sur cette valeur.
 */

/** Nombre de générations gratuites autorisées par IP/fingerprint sur la fenêtre ci-dessous. */
export const TRIAL_MAX_GENERATIONS = 2;

/** Fenêtre du rate limit en secondes (24h). */
export const TRIAL_WINDOW_SECONDS = 86_400;

/** Fenêtre (en heures) sur laquelle on compte les essais persistés en base. */
export const TRIAL_PERSISTENT_WINDOW_HOURS = 48;
