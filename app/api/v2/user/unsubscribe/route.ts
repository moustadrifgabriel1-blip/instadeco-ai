/**
 * API Route: /api/v2/user/unsubscribe
 * 
 * Gère la désinscription des emails marketing.
 * Accessible via un lien dans les emails (sans authentification requise).
 * Utilise un token HMAC pour valider l'email.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { useCases } from '@/src/infrastructure/config/di-container';

export const dynamic = 'force-dynamic';

function generateUnsubscribeToken(email: string): string {
  // Secret dédié de préférence ; repli sur CRON_SECRET (roté). Plus de littéral
  // prédictible 'fallback-secret' (qui rendait les tokens forgeables).
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error('UNSUBSCRIBE_SECRET (ou CRON_SECRET) requis pour signer les liens de désinscription.');
  }
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32);
}

/**
 * GET /api/v2/user/unsubscribe?email=xxx&token=xxx
 * 
 * Page de confirmation de désinscription.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  const token = req.nextUrl.searchParams.get('token');

  if (!email || !token) {
    return new NextResponse(renderPage('Lien invalide', 'Le lien de désinscription est incomplet.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const expectedToken = generateUnsubscribeToken(email);
  if (token !== expectedToken) {
    return new NextResponse(renderPage('Lien invalide', 'Le lien de désinscription n\'est pas valide.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Appliquer la désinscription via le use case (DI container)
  const result = await useCases.unsubscribe.execute(email);
  if (!result.success) {
    return new NextResponse(
      renderPage('Erreur', 'Une erreur est survenue lors de la désinscription. Réessayez plus tard.', false),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  return new NextResponse(
    renderPage(
      'Désinscription confirmée',
      `L'adresse ${email} a été retirée de notre liste de diffusion. Vous ne recevrez plus d'emails marketing de notre part.`,
      true
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function renderPage(title: string, message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - InstaDeco AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f9f9; margin: 0; padding: 40px 20px; color: #1d1d1f; }
    .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 20px; padding: 40px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; margin: 0 0 12px; }
    p { color: #6B6B6B; line-height: 1.6; margin: 0 0 24px; }
    a { color: #E07B54; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${success ? '✅' : '❌'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://instadeco.app">← Retour à InstaDeco AI</a>
  </div>
</body>
</html>`;
}

