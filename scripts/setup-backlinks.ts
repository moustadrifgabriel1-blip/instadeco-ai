/**
 * Script: Applique la migration backlink_outreach et seed les prospects
 * 
 * Usage: npx tsx scripts/setup-backlinks.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Charger .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Utilise: source .env.local && npx tsx scripts/setup-backlinks.ts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// Prospects pré-remplis
// ============================================================

const PROSPECTS = [
  // BLOGS DÉCO FR
  { site_name: 'Côté Maison', site_url: 'https://www.cotemaison.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 70, priority: 1, status: 'prospect' },
  { site_name: 'Maison Créative', site_url: 'https://www.maisoncreative.com', category: 'presse', country: 'FR', language: 'fr', domain_authority: 55, priority: 2, status: 'prospect' },
  { site_name: 'Turbulences Déco', site_url: 'https://www.turbulences-deco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 45, priority: 2, status: 'prospect' },
  { site_name: 'Blog Déco', site_url: 'https://www.blogdeco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 35, priority: 3, status: 'prospect' },
  { site_name: 'JOLI PLACE', site_url: 'https://www.joliplace.com', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 40, priority: 2, status: 'prospect' },
  { site_name: 'Aventure Déco', site_url: 'https://www.aventuredeco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 30, priority: 3, status: 'prospect' },
  { site_name: 'Clem Around The Corner', site_url: 'https://www.clemaroundthecorner.com', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 40, priority: 2, status: 'prospect' },
  { site_name: 'Shake My Blog', site_url: 'https://www.shakemyblog.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 35, priority: 3, status: 'prospect' },
  { site_name: 'Planete Deco', site_url: 'https://www.planete-deco.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 45, priority: 2, status: 'prospect' },
  { site_name: 'MyHomeDesign', site_url: 'https://www.myhomedesign.fr', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 30, priority: 3, status: 'prospect' },
  { site_name: 'Billie Blanket', site_url: 'https://www.billieblanket.com', category: 'blog_deco', country: 'FR', language: 'fr', domain_authority: 35, priority: 3, status: 'prospect' },

  // BLOGS ARCHI / DESIGN / PRESSE
  { site_name: 'Journal du Design', site_url: 'https://www.journal-du-design.fr', category: 'blog_archi', country: 'FR', language: 'fr', domain_authority: 50, priority: 2, status: 'prospect' },
  { site_name: 'DECO.fr', site_url: 'https://www.deco.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 65, priority: 1, status: 'prospect' },
  { site_name: 'AD Magazine', site_url: 'https://www.admagazine.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 70, priority: 1, status: 'prospect' },
  { site_name: 'Houzz France', site_url: 'https://www.houzz.fr', category: 'forum', country: 'FR', language: 'fr', domain_authority: 80, priority: 1, status: 'prospect' },

  // SUISSE
  { site_name: 'Habitation.ch', site_url: 'https://www.habitation.ch', category: 'presse', country: 'CH', language: 'fr', domain_authority: 35, priority: 2, status: 'prospect' },
  { site_name: 'Swiss Property', site_url: 'https://www.swisspropertyguide.com', category: 'presse', country: 'CH', language: 'fr', domain_authority: 35, priority: 3, status: 'prospect' },

  // BELGIQUE
  { site_name: 'Home Magazine BE', site_url: 'https://www.homemagazine.be', category: 'presse', country: 'BE', language: 'fr', domain_authority: 30, priority: 3, status: 'prospect' },

  // ANNUAIRES
  { site_name: 'DMOZ / Curlie', site_url: 'https://curlie.org', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 90, priority: 1, status: 'prospect' },
  { site_name: 'WebRankInfo', site_url: 'https://www.webrankinfo.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 55, priority: 2, status: 'prospect' },
  { site_name: 'Gralon', site_url: 'https://www.gralon.net', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 45, priority: 3, status: 'prospect' },
  { site_name: 'Bottin.fr', site_url: 'https://www.bottin.fr', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 40, priority: 3, status: 'prospect' },

  // TECH / STARTUP
  { site_name: 'Product Hunt', site_url: 'https://www.producthunt.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 90, priority: 1, status: 'prospect', notes: 'Lancement produit - faire un post dédié' },
  { site_name: 'BetaList', site_url: 'https://betalist.com', category: 'annuaire', country: 'FR', language: 'fr', domain_authority: 70, priority: 1, status: 'prospect' },
  { site_name: 'Hacker News', site_url: 'https://news.ycombinator.com', category: 'forum', country: 'FR', language: 'fr', domain_authority: 90, priority: 1, status: 'prospect', notes: 'Show HN post' },
  { site_name: 'Maddyness', site_url: 'https://www.maddyness.com', category: 'presse', country: 'FR', language: 'fr', domain_authority: 65, priority: 1, status: 'prospect' },
  { site_name: 'FrenchWeb', site_url: 'https://www.frenchweb.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 60, priority: 2, status: 'prospect' },
  { site_name: 'Les Echos START', site_url: 'https://start.lesechos.fr', category: 'presse', country: 'FR', language: 'fr', domain_authority: 75, priority: 1, status: 'prospect' },

  // IMMOBILIER / HOME STAGING
  { site_name: 'SeLoger', site_url: 'https://www.seloger.com', category: 'partenaire', country: 'FR', language: 'fr', domain_authority: 80, priority: 1, status: 'prospect', notes: 'Partenariat contenu home staging' },
  { site_name: 'PAP.fr', site_url: 'https://www.pap.fr', category: 'partenaire', country: 'FR', language: 'fr', domain_authority: 70, priority: 2, status: 'prospect' },
  { site_name: 'Homegate.ch', site_url: 'https://www.homegate.ch', category: 'partenaire', country: 'CH', language: 'fr', domain_authority: 65, priority: 2, status: 'prospect' },
  { site_name: 'Immoweb.be', site_url: 'https://www.immoweb.be', category: 'partenaire', country: 'BE', language: 'fr', domain_authority: 65, priority: 2, status: 'prospect' },
];

async function main() {
  console.log('🚀 Setup du système de backlink outreach\n');

  // ============================================================
  // ÉTAPE 1: Appliquer la migration SQL
  // ============================================================
  console.log('📦 Étape 1: Application de la migration SQL...');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260208_backlink_outreach.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Exécuter la migration via rpc si disponible, sinon via REST
  const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();

  if (migrationError) {
    // RPC n'existe probablement pas, on exécute via l'API SQL (Supabase Management API)
    // Fallback: exécuter chaque statement séparément
    console.log('   ⚠️  RPC exec_sql non disponible, exécution via requêtes individuelles...');
    
    // Créer la table backlink_prospects
    const { error: err1 } = await supabase.from('backlink_prospects').select('id').limit(1);
    if (err1 && err1.message.includes('does not exist')) {
      console.log('   ❌ La table backlink_prospects n\'existe pas.');
      console.log('');
      console.log('   👉 Tu dois exécuter la migration manuellement:');
      console.log('   1. Va sur https://supabase.com/dashboard');
      console.log('   2. Ouvre ton projet');
      console.log('   3. Va dans "SQL Editor" (menu gauche)');
      console.log('   4. Copie-colle le contenu de ce fichier:');
      console.log(`      ${migrationPath}`);
      console.log('   5. Clique "Run"');
      console.log('   6. Relance ce script: npx tsx scripts/setup-backlinks.ts');
      process.exit(1);
    } else {
      console.log('   ✅ Table backlink_prospects existe déjà');
    }
  } else {
    console.log('   ✅ Migration SQL appliquée');
  }

  // ============================================================
  // ÉTAPE 2: Seeder les prospects
  // ============================================================
  console.log('\n📋 Étape 2: Seed des prospects...');

  let inserted = 0;
  let skipped = 0;

  for (const prospect of PROSPECTS) {
    const { data: existing } = await supabase
      .from('backlink_prospects')
      .select('id')
      .eq('site_url', prospect.site_url)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from('backlink_prospects').insert(prospect);
    if (!error) {
      inserted++;
      console.log(`   ✅ ${prospect.site_name} (${prospect.country}, DA:${prospect.domain_authority})`);
    } else {
      console.log(`   ❌ ${prospect.site_name}: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n   📊 Résultat: ${inserted} ajoutés, ${skipped} déjà existants`);

  // ============================================================
  // ÉTAPE 3: Afficher le récap
  // ============================================================
  console.log('\n📊 Étape 3: Récapitulatif du pipeline...');

  const { data: allProspects, error: fetchErr } = await supabase
    .from('backlink_prospects')
    .select('*')
    .order('priority', { ascending: true });

  if (fetchErr) {
    console.error('   ❌ Erreur:', fetchErr.message);
    process.exit(1);
  }

  const byCategory: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const byPriority: Record<number, number> = {};

  for (const p of allProspects || []) {
    byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    byCountry[p.country] = (byCountry[p.country] || 0) + 1;
    byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
  }

  console.log(`\n   Total prospects: ${allProspects?.length || 0}`);
  console.log(`\n   Par catégorie:`);
  Object.entries(byCategory).sort().forEach(([k, v]) => console.log(`     ${k}: ${v}`));
  console.log(`\n   Par pays:`);
  Object.entries(byCountry).sort().forEach(([k, v]) => console.log(`     ${k}: ${v}`));
  console.log(`\n   Par priorité (1=haute):`);
  Object.entries(byPriority).sort().forEach(([k, v]) => console.log(`     P${k}: ${v}`));

  // Top 5 prioritaires
  const top5 = (allProspects || []).slice(0, 5);
  console.log(`\n   🎯 Top 5 prospects prioritaires:`);
  top5.forEach((p, i) => {
    console.log(`     ${i+1}. ${p.site_name} (DA:${p.domain_authority}, ${p.country}) — ${p.category}`);
  });

  console.log('\n✅ Setup terminé! Prochaines étapes ci-dessous.\n');
}

main().catch(console.error);
