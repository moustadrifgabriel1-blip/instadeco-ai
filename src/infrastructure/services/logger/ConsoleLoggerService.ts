import { ILoggerService, LogContext, LogLevel } from '@/src/domain/ports/services/ILoggerService';

/**
 * Adapter: Console Logger Service
 * Implémente ILoggerService avec console.log (développement)
 */
export class ConsoleLoggerService implements ILoggerService {
  private context: LogContext;
  private readonly isDev: boolean;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.isDev = process.env.NODE_ENV !== 'production';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    const contextStr = Object.keys(mergedContext).length > 0 
      ? ` ${JSON.stringify(mergedContext)}` 
      : '';
    
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return '📝';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📋';
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.isDev) return; // Debug uniquement en développement
    
    console.debug(
      `${this.getEmoji('debug')} ${this.formatMessage('debug', message, context)}`
    );
  }

  info(message: string, context?: LogContext): void {
    console.info(
      `${this.getEmoji('info')} ${this.formatMessage('info', message, context)}`
    );
  }

  warn(message: string, context?: LogContext): void {
    console.warn(
      `${this.getEmoji('warn')} ${this.formatMessage('warn', message, context)}`
    );
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? { ...context, errorMessage: error.message, errorStack: error.stack }
      : context;

    console.error(
      `${this.getEmoji('error')} ${this.formatMessage('error', message, errorContext)}`
    );

    // Observabilité low-cost : tout log CRITICAL (échec remboursement/webhook = argent
    // perdu) alerte l'admin par email. Fire-and-forget, import dynamique (pas de coût
    // si jamais déclenché, pas de bundling Resend dans les contextes qui ne loggent pas
    // de CRITICAL). L'alerte est elle-même no-op hors prod / sans RESEND_API_KEY.
    if (message.startsWith('CRITICAL')) {
      void import('@/lib/notifications/critical-alert')
        .then((m) => m.notifyAdminCritical(message, { ...this.context, ...errorContext }))
        .catch(() => {});
    }
  }

  child(context: LogContext): ILoggerService {
    return new ConsoleLoggerService({ ...this.context, ...context });
  }

  async time<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, error as Error, { duration });
      throw error;
    }
  }
}
