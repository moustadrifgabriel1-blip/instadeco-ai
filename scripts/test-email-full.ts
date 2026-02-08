/**
 * Script de test complet: Génère le rapport + upload fichier + envoie l'email
 * Usage: npx tsx scripts/test-email-full.ts
 */

// Charger les env vars AVANT tout import
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  // Imports dynamiques APRÈS le chargement des env vars
  const { generateAndStoreReport } = await import('../lib/notifications/backlink-report');
  const { sendBacklinkReport } = await import('../lib/notifications/email');
  console.log('🚀 Test complet : rapport + fichier + email\n');

  // 1. Générer le rapport + uploader le fichier dans Supabase Storage
  console.log('📄 Génération du rapport Markdown...');
  const report = await generateAndStoreReport();

  console.log(`   ✅ ${report.readyToContact.length} prospects prêts à contacter`);
  console.log(`   ✅ ${report.needFollowUp.length} relances nécessaires`);
  console.log(`   ✅ ${report.totalProspects} prospects au total`);
  console.log(`   📁 Fichier: ${report.fileUrl ? '✅ uploadé' : '❌ échec upload'}`);
  if (report.fileUrl) {
    console.log(`   🔗 Lien: ${report.fileUrl.substring(0, 80)}...`);
  }
  console.log('');

  // 2. Envoyer l'email avec le vrai lien du fichier
  console.log('📧 Envoi de l\'email...');
  const emailResult = await sendBacklinkReport({
    totalProspects: report.totalProspects,
    pipelineStats: report.pipelineStats,
    pitchesGenerated: 0,
    articlesGenerated: 0,
    readyToContact: report.readyToContact,
    needFollowUp: report.needFollowUp,
    fileUrl: report.fileUrl ?? undefined,
  });

  if (emailResult.success) {
    console.log('   ✅ Email envoyé ! Vérifie ta boîte mail.');
  } else {
    console.log(`   ❌ Erreur email: ${emailResult.error}`);
  }

  // 3. Afficher un extrait du Markdown
  console.log('\n--- Aperçu du fichier Markdown ---');
  console.log(report.markdownContent.substring(0, 500));
  console.log('...');
}

main().catch(console.error);
