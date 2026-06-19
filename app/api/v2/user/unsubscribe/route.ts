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
  const accent = success ? '#c8a24d' : '#b3837a';
  const glyph = success
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0c0a09" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0c0a09" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${title} - InstaDeco AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0807; margin: 0; padding: 48px 20px; color: #faf8f4; }
    .container { max-width: 480px; margin: 0 auto; background: #0c0a09; border: 1px solid rgba(200,162,77,0.28); border-radius: 20px; padding: 44px 36px; text-align: center; }
    .badge { width: 56px; height: 56px; border-radius: 50%; background: ${accent}; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .eyebrow { font-family: Georgia, 'Times New Roman', serif; font-size: 12px; letter-spacing: 0.32em; text-transform: uppercase; color: #c8a24d; margin-bottom: 18px; }
    h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: normal; font-size: 25px; margin: 0 0 12px; color: #faf8f4; }
    p { color: #b3a89a; line-height: 1.7; margin: 0 0 26px; font-size: 15px; }
    a { color: #c8a24d; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="eyebrow">InstaDeco AI</div>
    <div class="badge">${glyph}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://instadeco.app">Retour à InstaDeco AI</a>
  </div>
</body>
</html>`;
}

