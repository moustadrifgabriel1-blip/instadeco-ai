/**
 * Utilitaire pour générer les liens de désinscription email.
 * Utilisé par les templates d'email et le cron email-nurturing.
 */

import crypto from 'crypto';

export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret';
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

export function buildUnsubscribeUrl(email: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://instadeco.app';
  const token = generateUnsubscribeToken(email);
  return `${baseUrl}/api/v2/user/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
