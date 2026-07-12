/**
 * build-outbound-kit.ts — Transforme l'export brut Vibe (outbound-kit/leads-raw.csv)
 * en kit exploitable pour l'outbound agents immo (playbook M4) :
 *   - outbound-kit/leads.csv         : liste propre (prenom, nom, agence, ville, email, site...)
 *   - outbound-kit/suivi-pipeline.csv: suivi pre-rempli (statut a_contacter)
 *   - outbound-kit/messages-remplis.md : les messages generiques remplis (prenom + ville), prets a coller
 *
 * Aucune donnee perso n'est versionnee : tout est ecrit dans outbound-kit/ (gitignore).
 * Usage : npx tsx scripts/build-outbound-kit.ts
 */
import * as fs from 'fs';
import * as path from 'path';

const DIR = path.resolve(process.cwd(), 'outbound-kit');
const RAW = path.join(DIR, 'leads-raw.csv');
const LINK = 'https://instadeco.app/fr/pro?utm_source=outbound&utm_medium=email&utm_campaign=before-after';
// Page HTML du visuel avant/après (app/outbound/[slug]) : cible de lien propre pour le
// cold email. Un lien vers une vraie page évite l'avertissement de redirection Gmail
// que déclenchait le lien direct vers le .jpg brut.
const VISUAL_PAGE = 'https://instadeco.app/outbound/salon-minimaliste';

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const SMALL = new Set(['sur', 'les', 'le', 'la', 'de', 'du', 'des', 'd', 'l', 'en', 'aux', 'au', 'et', 'lez', 'sous']);
function titleCase(s: string, keepSmall = false): string {
  if (!s) return '';
  return s.split(/([\s\-']+)/).map((part, idx) => {
    if (/^[\s\-']+$/.test(part)) return part;
    const lower = part.toLowerCase();
    if (keepSmall && idx > 0 && SMALL.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join('');
}

function pickEmail(professions: string, emailsJson: string): string {
  if (professions && professions.includes('@')) return professions.trim();
  try {
    const arr = JSON.parse(emailsJson) as Array<{ address: string; type: string }>;
    const pro = arr.find((e) => e.type === 'current_professional');
    return (pro || arr[0])?.address || '';
  } catch { return ''; }
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function isAgencySite(site: string): boolean {
  if (!site) return false;
  const s = site.toLowerCase();
  // Pages de recrutement de reseaux = pas exploitables pour une annonce.
  return !/(join-|recrutement|rejoignez|carrier|career|jobs)/.test(s);
}

const rows = parseCSV(fs.readFileSync(RAW, 'utf8'));
const header = rows[0];
const idx = (name: string) => header.indexOf(name);
const iFirst = idx('prospect_first_name'), iLast = idx('prospect_last_name');
const iJob = idx('prospect_job_title'), iCity = idx('prospect_city'), iRegion = idx('prospect_region_name');
const iCompany = idx('prospect_company_name'), iSite = idx('prospect_company_website');
const iEmail = idx('contact_professions_email'), iStatus = idx('contact_professional_email_status'), iEmails = idx('contact_emails');
const iLinkedin = idx('prospect_linkedin');

interface Lead {
  prenom: string; nom: string; agence: string; ville: string; region: string;
  email: string; statut: string; site: string; job: string; linkedin: string; premium: boolean;
}

const leads: Lead[] = [];
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.length < header.length) continue;
  const email = pickEmail(row[iEmail], row[iEmails]);
  if (!email) continue;
  const site = (row[iSite] || '').trim();
  leads.push({
    prenom: titleCase(row[iFirst] || ''),
    nom: titleCase(row[iLast] || ''),
    agence: titleCase(row[iCompany] || ''),
    ville: titleCase(row[iCity] || '', true),
    region: titleCase(row[iRegion] || '', true),
    email,
    statut: (row[iStatus] || '').trim(),
    site,
    job: (row[iJob] || '').trim(),
    linkedin: (row[iLinkedin] || '').trim(),
    premium: isAgencySite(site),
  });
}

// 1. leads.csv propre
const leadsHeader = ['prenom', 'nom', 'agence', 'ville', 'region', 'email', 'statut_email', 'site_web', 'job', 'premium_candidat', 'linkedin'];
const leadsCsv = [leadsHeader.join(',')]
  .concat(leads.map((l) => [l.prenom, l.nom, l.agence, l.ville, l.region, l.email, l.statut, l.site, l.job, l.premium ? 'oui' : 'non', l.linkedin].map(csvEscape).join(',')))
  .join('\n');
fs.writeFileSync(path.join(DIR, 'leads.csv'), leadsCsv + '\n');

// 2. suivi-pipeline.csv pre-rempli
const suiviHeader = 'prenom,nom,agence,ville,email,source,type_message,date_envoi,relance_48h,statut,date_statut,notes';
const suiviRows = leads.map((l) =>
  [l.prenom, l.nom, l.agence, l.ville, l.email, 'vibe', 'generique', '', '', 'a_contacter', '', ''].map(csvEscape).join(','));
fs.writeFileSync(path.join(DIR, 'suivi-pipeline.csv'), [suiviHeader, ...suiviRows].join('\n') + '\n');

// 3. messages-remplis.md (message generique rempli, pret a coller)
const blocks = leads.map((l, i) => {
  const lieu = l.ville && l.ville.length > 1 ? l.ville : l.region;
  return `## ${i + 1}. ${l.prenom} ${l.nom} — ${l.agence} — ${lieu}
**À :** ${l.email}  (${l.statut})
**Objet :** Vos annonces, meublées en moins d'une minute

Bonjour ${l.prenom},

Vous vendez des biens sur ${lieu}. Quand une pièce est vide, l'acheteur a du mal à se projeter, et l'annonce attire moins de visites.

J'ai conçu un outil qui meuble une pièce à partir d'une seule photo, en moins d'une minute. Un exemple avant/après ici : ${VISUAL_PAGE}

Vous pouvez le faire sur tous vos biens, en illimité, pour 49 € par mois. Le premier essai est gratuit et ne demande pas de carte : ${LINK}

Bien à vous,
Gabriel Moustadrif, InstaDeco

*Si vous préférez ne plus recevoir de message de ma part, répondez stop et je vous retire de ma liste.*
`;
}).join('\n---\n\n');

fs.writeFileSync(path.join(DIR, 'messages-remplis.md'), `# Messages génériques remplis (${leads.length} agents)\n\nVisuel à joindre : voir outbound-kit/. Plafond 20 envois/jour, relance 48h.\n\n---\n\n${blocks}`);

const premiumCount = leads.filter((l) => l.premium).length;
console.log(`Kit construit : ${leads.length} leads avec email.`);
console.log(`  - outbound-kit/leads.csv`);
console.log(`  - outbound-kit/suivi-pipeline.csv`);
console.log(`  - outbound-kit/messages-remplis.md`);
console.log(`Candidats premium (site agence exploitable) : ${premiumCount}`);
