/**
 * Niveaux de log
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Contexte de log
 */
export interface LogContext {
  userId?: string;
  generationId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Port Service - Logger
 * Interface pour le logging centralisé
 */
export interface ILoggerService {
  /**
   * Log de niveau debug (développement uniquement)
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log d'information
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log d'avertissement
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log d'erreur
   */
  error(message: string, error?: Error, context?: LogContext): void;

  /**
   * Crée un logger enfant avec contexte persistant
   */
  child(context: LogContext): ILoggerService;

  /**
   * Mesure le temps d'exécution d'une fonction
   */
  time<T>(label: string, fn: () => Promise<T>): Promise<T>;
}
