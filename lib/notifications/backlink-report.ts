/**
 * Service: Export des pitchs en fichier Markdown
 * 
 * Génère un fichier Markdown structuré avec tous les pitchs prêts à envoyer.
 * Le fichier est uploadé dans Supabase Storage et un lien signé est généré.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { BacklinkOutreachService, BacklinkProspect } from '@/lib/seo/backlink-outreach';

const STORAGE_BUCKET = 'backlink-reports';

/**
 * Génère le fichier Markdown avec les pitchs prêts et le stocke dans Supabase
 */
export async function generateAndStoreReport(): Promise<{
  markdownContent: string;
  fileUrl: string | null;
  readyToContact: Array<{
    site_name: string;
    site_url: string;
    category: string;
    domain_authority?: number;
    priority: number;
    pitch_generated?: string;
    contact_email?: string;
  }>;
  needFollowUp: Array<{
    site_name: string;
    site_url: string;
    outreach_sent_at?: string;
  }>;
  pipelineStats: Record<string, number>;
  totalProspects: number;
}> {
  // Récupérer les données
  const [pipeline, nextActions] = await Promise.all([
    BacklinkOutreachService.getPipeline(),
    BacklinkOutreachService.getNextActions(),
  ]);

  const { readyToContact, needFollowUp } = nextActions;
  const { stats, prospects } = pipeline;

  // Générer le Markdown
  const markdown = buildMarkdown(readyToContact, needFollowUp, stats, prospects.length);

  // Uploader dans Supabase Storage
  const fileUrl = await uploadToStorage(markdown);

  return {
    markdownContent: markdown,
    fileUrl,
    readyToContact: readyToContact.map(p => ({
      site_name: p.site_name,
      site_url: p.site_url,
      category: p.category,
      domain_authority: p.domain_authority,
      priority: p.priority,
      pitch_generated: p.pitch_generated,
      contact_email: p.contact_email,
    })),
    needFollowUp: needFollowUp.map(p => ({
      site_name: p.site_name,
      site_url: p.site_url,
      outreach_sent_at: p.outreach_sent_at,
    })),
    pipelineStats: stats,
    totalProspects: prospects.length,
  };
}

/**
 * Construit le contenu Markdown du rapport
 */
function buildMarkdown(
  readyToContact: BacklinkProspect[],
  needFollowUp: BacklinkProspect[],
  stats: Record<string, number>,
  totalProspects: number,
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let md = `# 🔗 Rapport Backlinks InstaDeco\n`;
  md += `> Généré le ${dateStr}\n\n`;

  // --- Pipeline stats ---
  md += `## 📊 Pipeline (${totalProspects} prospects)\n\n`;
  md += `| Statut | Nombre |\n`;
  md += `|--------|--------|\n`;
  for (const [status, count] of Object.entries(stats)) {
    md += `| ${status} | ${count} |\n`;
  }
  md += `\n`;

  // --- Pitchs prêts ---
  md += `## 📬 Pitchs prêts à envoyer (${readyToContact.length})\n\n`;

  if (readyToContact.length === 0) {
    md += `> Aucun pitch prêt cette semaine.\n\n`;
  } else {
    for (let i = 0; i < readyToContact.length; i++) {
      const p = readyToContact[i];
      md += `---\n\n`;
      md += `### ${i + 1}. ${p.site_name}\n\n`;
      md += `- **URL:** ${p.site_url}\n`;
      md += `- **Catégorie:** ${p.category}\n`;
      md += `- **DA:** ${p.domain_authority || '?'}\n`;
      md += `- **Priorité:** P${p.priority}\n`;
      if (p.contact_email) {
        md += `- **Email:** ${p.contact_email}\n`;
      }
      md += `\n`;

      if (p.pitch_generated) {
        md += `#### ✉️ Email prêt à copier-coller :\n\n`;
        md += `\`\`\`\n`;
        md += `${p.pitch_generated}\n`;
        md += `\`\`\`\n\n`;
      }
    }
  }

  // --- Relances ---
  md += `## 🔄 Relances nécessaires (${needFollowUp.length})\n\n`;

  if (needFollowUp.length === 0) {
    md += `> Aucune relance nécessaire.\n\n`;
  } else {
    for (const p of needFollowUp) {
      const sentDate = p.outreach_sent_at
        ? new Date(p.outreach_sent_at as string).toLocaleDateString('fr-FR')
        : '?';
      md += `- **${p.site_name}** — contacté le ${sentDate} → [${p.site_url}](${p.site_url})\n`;
    }
    md += `\n`;
  }

  // --- Actions rapides ---
  md += `## 📋 Actions\n\n`;
  md += `1. Copie-colle chaque pitch dans un email\n`;
  md += `2. Envoie-les aux prospects listés ci-dessus\n`;
  md += `3. Note les réponses via l'API :\n`;
  md += `   \`\`\`bash\n`;
  md += `   # Marquer un prospect comme contacté\n`;
  md += `   curl -X POST https://instadeco.app/api/v2/backlinks \\\n`;
  md += `     -H "Authorization: Bearer $CRON_SECRET" \\\n`;
  md += `     -H "Content-Type: application/json" \\\n`;
  md += `     -d '{"action":"update-status","prospectId":"<ID>","status":"contacted"}'\n`;
  md += `   \`\`\`\n\n`;

  md += `---\n`;
  md += `*Email automatique — InstaDeco AI Backlink System*\n`;

  return md;
}

/**
 * Upload le fichier Markdown dans Supabase Storage et retourne un lien signé 7 jours
 */
async function uploadToStorage(content: string): Promise<string | null> {
  try {
    // Créer le bucket s'il n'existe pas
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 1024 * 1024, // 1MB max
      });
      console.log(`[Storage] Bucket "${STORAGE_BUCKET}" créé`);
    }

    // Nom du fichier avec date
    const now = new Date();
    const fileName = `pitchs-${now.toISOString().split('T')[0]}.md`;

    // Upload (écrase si existe déjà)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, content, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (uploadError) {
      console.error('[Storage] Upload error:', uploadError);
      return null;
    }

    // Générer un lien signé valide 7 jours
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(fileName, 7 * 24 * 60 * 60); // 7 jours

    if (signError || !signedUrl) {
      console.error('[Storage] Signed URL error:', signError);
      return null;
    }

    console.log(`[Storage] Fichier uploadé: ${fileName}`);
    return signedUrl.signedUrl;
  } catch (err) {
    console.error('[Storage] Failed:', err);
    return null;
  }
}
