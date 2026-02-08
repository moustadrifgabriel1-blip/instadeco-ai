/**
 * Script de test: Envoi d'un email de rapport backlinks via Resend
 * Usage: npx tsx scripts/test-email.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { sendBacklinkReport } from '../lib/notifications/email';

async function main() {
  console.log('📧 Test d\'envoi email via Resend...\n');
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ configurée' : '❌ manquante'}`);
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'moustadrifgabriel1@gmail.com'}`);
  console.log('');

  const result = await sendBacklinkReport({
    totalProspects: 32,
    pipelineStats: {
      prospect: 28,
      contacted: 3,
      published: 1,
    },
    pitchesGenerated: 5,
    articlesGenerated: 1,
    readyToContact: [
      {
        site_name: 'Côté Maison',
        site_url: 'https://www.cotemaison.fr',
        category: 'presse',
        domain_authority: 70,
        priority: 1,
        pitch_generated: 'Subject: Collaboration article – IA et décoration intérieure\n\nBonjour,\n\nJe suis Gabriel, fondateur d\'InstaDeco AI...',
      },
      {
        site_name: 'AD Magazine',
        site_url: 'https://www.admagazine.fr',
        category: 'presse',
        domain_authority: 70,
        priority: 1,
        pitch_generated: 'Subject: [Nouveauté] Une IA suisse transforme votre intérieur en 10 secondes\n\nBonjour,\n\nUn salon daté des années 90...',
      },
      {
        site_name: 'Product Hunt',
        site_url: 'https://www.producthunt.com',
        category: 'annuaire',
        domain_authority: 90,
        priority: 1,
      },
    ],
    needFollowUp: [
      {
        site_name: 'Turbulences Déco',
        site_url: 'https://www.turbulences-deco.fr',
        outreach_sent_at: '2026-01-28T10:00:00Z',
      },
    ],
    fileUrl: 'https://example.com/test-file.md',
  });

  if (result.success) {
    console.log('✅ Email envoyé avec succès ! Vérifie ta boîte mail.');
  } else {
    console.log(`❌ Erreur: ${result.error}`);
  }
}

main().catch(console.error);
