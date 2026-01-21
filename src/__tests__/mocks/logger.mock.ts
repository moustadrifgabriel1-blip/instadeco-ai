import { vi } from 'vitest';
import { ILoggerService, LogContext } from '@/src/domain/ports/services/ILoggerService';

/**
 * Mock du Logger Service pour les tests
 */
export function createMockLogger(): ILoggerService {
  const mockLogger: ILoggerService = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
    time: vi.fn().mockImplementation(async <T>(_label: string, fn: () => Promise<T>) => fn()),
  };
  
  return mockLogger;
}
