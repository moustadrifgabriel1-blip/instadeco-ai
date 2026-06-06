/**
 * Protection anti-SSRF pour les fetch côté serveur d'URLs fournies/dérivées de
 * l'utilisateur (imageUrl du flux de génération, output Fal, signed URLs Supabase).
 *
 * Sans ce garde, un utilisateur authentifié peut forcer le serveur à requêter des
 * cibles internes : 169.254.169.254 (metadata cloud AWS/GCP), localhost, IP privées
 * (10/8, 172.16/12, 192.168/16), link-local, IPv6 loopback/ULA.
 *
 * Stratégie (fail-closed) :
 *   1. Protocole https uniquement.
 *   2. Rejet des hôtes IP-littéraux privés/loopback/link-local.
 *   3. Résolution DNS de l'hôte + rejet si l'IP résolue est privée (anti DNS-rebinding).
 *
 * Runtime Node requis (les routes de génération tournent en Node, pas Edge).
 */
import { lookup } from 'node:dns/promises';
import net from 'node:net';

/** Vrai si l'IP (v4 ou v6) est privée / loopback / link-local / réservée. */
export function isPrivateIp(ip: string): boolean {
  const type = net.isIP(ip);

  if (type === 4) {
    const p = ip.split('.').map(Number);
    if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = p;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local + metadata 169.254.169.254
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
    if (a >= 224) return true; // multicast/réservé
    return false;
  }

  if (type === 6) {
    const v = ip.toLowerCase();
    if (v === '::1' || v === '::') return true; // loopback / unspecified
    if (v.startsWith('fc') || v.startsWith('fd')) return true; // ULA fc00::/7
    if (v.startsWith('fe80')) return true; // link-local
    if (v.startsWith('::ffff:')) {
      // IPv4-mapped → revalider la partie v4
      const v4 = v.split(':').pop() || '';
      if (net.isIP(v4) === 4) return isPrivateIp(v4);
    }
    return false;
  }

  // Pas une IP → on ne tranche pas ici (l'appelant fait la résolution DNS)
  return false;
}

/**
 * Valide qu'une URL est sûre à fetcher côté serveur. Throw sinon.
 * @returns l'objet URL validé
 */
export async function assertSafeImageUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('URL invalide');
  }

  if (url.protocol !== 'https:') {
    throw new Error(`Protocole non autorisé: ${url.protocol} (https requis)`);
  }

  const host = url.hostname.replace(/^\[|\]$/g, ''); // IPv6 entre crochets

  // Hôte = IP littérale → vérif directe
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Cible interne interdite (SSRF)');
    return url;
  }

  // Hôte = nom de domaine → bloquer localhost explicitement puis résoudre
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new Error('Cible interne interdite (SSRF)');
  }

  let resolved: { address: string }[];
  try {
    resolved = await lookup(host, { all: true });
  } catch {
    throw new Error('Résolution DNS impossible');
  }

  if (resolved.length === 0 || resolved.some((r) => isPrivateIp(r.address))) {
    throw new Error('Cible interne interdite (SSRF)');
  }

  return url;
}

/**
 * fetch() durci : valide l'URL (anti-SSRF) puis fetch avec timeout.
 * @param timeoutMs timeout d'abandon (défaut 30s)
 */
export async function safeFetchImage(
  rawUrl: string,
  init?: RequestInit,
  timeoutMs = 30_000,
): Promise<Response> {
  await assertSafeImageUrl(rawUrl);
  return fetch(rawUrl, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
