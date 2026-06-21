/**
 * Alias de compatibilité de l'endpoint webhook Stripe.
 *
 * L'endpoint configuré côté Stripe pointe historiquement sur
 * /api/payments/webhook. La logique réelle vit dans /api/v2/webhooks/stripe
 * (vérification de signature, idempotence, activation abonnement/crédits, emails
 * de confirmation). On re-sert le MÊME handler ici pour que l'endpoint Stripe
 * existant fonctionne sans avoir à reconfigurer son URL (qui renvoyait un 404).
 */
export { POST } from '../../v2/webhooks/stripe/route';

export const dynamic = 'force-dynamic';
