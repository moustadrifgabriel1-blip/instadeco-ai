/**
 * Script: Génère les pitchs + envoie le rapport complet
 * Usage: npx tsx scripts/generate-and-notify.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const { BacklinkOutreachService } = await import('../lib/seo/backlink-outreach');
  const { generateAndStoreReport } = await import('../lib/notifications/backlink-report');
  const { sendBacklinkReport } = await import('../lib/notifications/email');

  // 1. Générer 5 pitchs
  console.log('🤖 Génération de 5 pitchs via les templates...');
  const pitchCount = await BacklinkOutreachService.batchGeneratePitches(5);
  console.log(`   ✅ ${pitchCount} pitchs générés\n`);

  // 2. Générer le rapport + upload
  console.log('📄 Export du rapport...');
  const report = await generateAndStoreReport();
  console.log(`   ✅ ${report.readyToContact.length} prospects prêts`);
  console.log(`   📁 Fichier: ${report.fileUrl ? 'uploadé' : 'échec'}\n`);

  // 3. Envoyer l'email avec pitchs dans le corps + fichier en pièce jointe
  console.log('📧 Envoi de l\'email...');
  const emailResult = await sendBacklinkReport({
    totalProspects: report.totalProspects,
    pipelineStats: report.pipelineStats,
    pitchesGenerated: pitchCount,
    articlesGenerated: 0,
    readyToContact: report.readyToContact,
    needFollowUp: report.needFollowUp,
    fileUrl: report.fileUrl ?? undefined,
    markdownContent: report.markdownContent,
  });

  if (emailResult.success) {
    console.log('   ✅ Email envoyé ! Vérifie ta boîte mail.');
  } else {
    console.log(`   ❌ ${emailResult.error}`);
  }
}

main().catch(console.error);
