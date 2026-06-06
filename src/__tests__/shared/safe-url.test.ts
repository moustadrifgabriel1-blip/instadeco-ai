/**
 * Tests de la garde anti-SSRF (src/shared/utils/safe-url.ts).
 *
 * On vérifie que les cibles internes (metadata cloud, loopback, IP privées,
 * IPv6 ULA/link-local) sont rejetées, et que les hôtes publics passent.
 * La résolution DNS est mockée pour rester déterministe et hors-réseau.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLookup = vi.hoisted(() => vi.fn());
vi.mock('node:dns/promises', () => ({
  lookup: mockLookup,
}));

import { isPrivateIp, assertSafeImageUrl } from '@/src/shared/utils/safe-url';

describe('isPrivateIp', () => {
  it('détecte les IPv4 privées / loopback / metadata', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('10.0.0.5')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true); // metadata cloud
    expect(isPrivateIp('100.64.0.1')).toBe(true); // CGNAT
    expect(isPrivateIp('0.0.0.0')).toBe(true);
  });

  it('accepte les IPv4 publiques', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
  });

  it('détecte les IPv6 internes', () => {
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('fd00::1')).toBe(true);
    expect(isPrivateIp('fe80::1')).toBe(true);
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped loopback
  });
});

describe('assertSafeImageUrl', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejette les protocoles non-https', async () => {
    await expect(assertSafeImageUrl('http://example.com/x.jpg')).rejects.toThrow(/Protocole/);
  });

  it('rejette une IP littérale privée sans toucher au DNS', async () => {
    await expect(assertSafeImageUrl('https://169.254.169.254/latest/meta-data')).rejects.toThrow(/SSRF/);
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('rejette localhost', async () => {
    await expect(assertSafeImageUrl('https://localhost/x.jpg')).rejects.toThrow(/SSRF/);
  });

  it('rejette un domaine qui résout vers une IP privée (anti DNS-rebinding)', async () => {
    mockLookup.mockResolvedValue([{ address: '10.0.0.5' }]);
    await expect(assertSafeImageUrl('https://evil.example.com/x.jpg')).rejects.toThrow(/SSRF/);
  });

  it('accepte un domaine public qui résout vers une IP publique', async () => {
    mockLookup.mockResolvedValue([{ address: '93.184.216.34' }]);
    const url = await assertSafeImageUrl('https://example.com/x.jpg');
    expect(url).toBeInstanceOf(URL);
    expect(url.hostname).toBe('example.com');
  });

  it('accepte une IP littérale publique', async () => {
    const url = await assertSafeImageUrl('https://8.8.8.8/x.jpg');
    expect(url.hostname).toBe('8.8.8.8');
  });
});
