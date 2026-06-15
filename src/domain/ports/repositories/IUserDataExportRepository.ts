import { Result } from '@/src/shared/types/Result';

/**
 * Données brutes agrégées pour l'export RGPD d'un utilisateur.
 *
 * Les lignes sont volontairement typées en `Record<string, unknown>` :
 * la route d'export sérialise les colonnes telles quelles (`select('*')`)
 * et le use-case applique la même projection que la route historique.
 * Ne PAS restreindre/renommer les colonnes ici sous peine de modifier
 * le format d'export observable.
 */
export interface UserDataExportRaw {
  /** Ligne `profiles` (ou null si absente). */
  profile: Record<string, unknown> | null;
  /** Lignes `generations` (tri created_at desc). */
  generations: Array<Record<string, unknown>>;
  /** Lignes `credit_transactions` (tri created_at desc). */
  creditTransactions: Array<Record<string, unknown>>;
  /** Lignes `projects` (tri created_at desc). */
  projects: Array<Record<string, unknown>>;
  /** Lignes `referrals` où l'utilisateur est le parrain. */
  referralsGiven: Array<Record<string, unknown>>;
  /** Lignes `referrals` où l'utilisateur est le filleul. */
  referralsReceived: Array<Record<string, unknown>>;
}

/**
 * Port Repository - Lecture seule des données utilisateur pour l'export RGPD
 * (Art. 15 & 20). Agrège en une passe les tables `profiles`, `generations`,
 * `credit_transactions`, `projects` et `referrals`.
 */
export interface IUserDataExportRepository {
  /** Récupère toutes les données brutes liées à `userId`. */
  fetchAll(userId: string): Promise<Result<UserDataExportRaw>>;
}
