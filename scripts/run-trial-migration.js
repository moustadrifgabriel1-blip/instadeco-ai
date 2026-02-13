#!/usr/bin/env node
/**
 * Script pour exécuter la migration trial_usage dans Supabase.
 * Usage: node scripts/run-trial-migration.js
 */
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function run() {
  console.log('🔍 Vérification si la table trial_usage existe...');

  // Vérifier si la table existe
  const { error: checkError } = await supabase.from('trial_usage').select('id').limit(1);

  if (!checkError) {
    console.log('✅ La table trial_usage existe déjà. Rien à faire.');
    process.exit(0);
  }

  if (checkError.code === '42P01') {
    console.log('📦 Table trial_usage introuvable. Création via rpc...');
  } else {
    console.log('⚠️  Erreur inattendue:', checkError.message, '— on tente la création quand même...');
  }

  // Utiliser la fonction rpc pour exécuter du SQL brut (si elle existe)
  // Sinon, on la crée d'abord via le Management API
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  const mgmtUrl = `https://${projectRef}.supabase.co/rest/v1/`;

  // Méthode: utiliser le SQL Editor endpoint de Supabase Management API
  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS trial_usage (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      ip_address VARCHAR(45) NOT NULL,
      fingerprint VARCHAR(64),
      style VARCHAR(50),
      room_type VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_trial_usage_ip_created ON trial_usage (ip_address, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_trial_usage_fingerprint ON trial_usage (fingerprint) WHERE fingerprint IS NOT NULL`,
    `ALTER TABLE trial_usage ENABLE ROW LEVEL SECURITY`,
    `COMMENT ON TABLE trial_usage IS 'Suivi anti-abus des essais gratuits. Accessible uniquement via service_role.'`,
  ];

  // Exécuter via le endpoint SQL de Supabase (pg-meta)
  const pgMetaUrl = `https://${projectRef}.supabase.co/pg/query`;

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`  [${i + 1}/${sqlStatements.length}] Exécution...`);

    try {
      const res = await fetch(pgMetaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (res.ok) {
        console.log(`  ✅ OK`);
      } else {
        const body = await res.text();
        // Essayer aussi via le REST SQL endpoint alternatif
        if (res.status === 404) {
          console.log(`  ⚠️  pg/query endpoint non disponible (${res.status}). Tentative alternative...`);
          break; // Sortir de la boucle pour essayer la méthode alternative
        }
        console.error(`  ❌ Erreur ${res.status}:`, body.substring(0, 200));
      }
    } catch (err) {
      console.error(`  ❌ Exception:`, err.message);
    }
  }

  // Vérification finale
  console.log('\n🔍 Vérification finale...');
  const { error: finalCheck } = await supabase.from('trial_usage').select('id').limit(1);

  if (!finalCheck) {
    console.log('✅ Table trial_usage créée avec succès !');
  } else {
    console.log('❌ La table n\'a pas été créée automatiquement.');
    console.log('');
    console.log('👉 Exécutez le SQL manuellement dans le dashboard Supabase:');
    console.log(`   ${supabaseUrl.replace('.supabase.co', '.supabase.co')}/project/default/sql/new`);
    console.log('');
    console.log('   Copiez le contenu de: supabase/migrations/20260212_trial_usage.sql');
    console.log('   et collez-le dans le SQL Editor, puis cliquez "Run".');
  }
}

run().catch(console.error);
