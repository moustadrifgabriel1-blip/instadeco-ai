import { NextResponse } from 'next/server';

/**
 * GET /api/v2/debug/env
 * 
 * Debug: Vérifier les variables d'environnement Stripe
 */
export async function GET() {
  return NextResponse.json({
    STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER ? 'SET' : 'MISSING',
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO ? 'SET' : 'MISSING',
    STRIPE_PRICE_UNLIMITED: process.env.STRIPE_PRICE_UNLIMITED ? 'SET' : 'MISSING',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
    timestamp: new Date().toISOString(),
  });
}
