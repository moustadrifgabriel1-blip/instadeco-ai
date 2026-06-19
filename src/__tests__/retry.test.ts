import { describe, it, expect, vi } from 'vitest';
import { withRetry } from '@/lib/utils/retry';

describe('withRetry', () => {
  it('retourne le résultat au premier succès, sans réessai', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    await expect(withRetry(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('réessaie après un échec transitoire puis réussit', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('blip réseau'))
      .mockResolvedValue('ok');
    await expect(withRetry(fn, { attempts: 3, delayMs: 1 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('relance la dernière erreur après épuisement des essais', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('service down'));
    await expect(withRetry(fn, { attempts: 2, delayMs: 1 })).rejects.toThrow('service down');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
