#!/usr/bin/env node

/**
 * Script d'initialisation automatique de Supabase
 * Exécute le schéma SQL et crée les buckets Storage
 * 
 * Usage: node scripts/setup-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('Vérifiez que .env.local contient:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupDatabase() {
  console.log('\n🗄️  SETUP DATABASE\n');

  // Lire le fichier SQL
  const sqlPath = path.join(__dirname, '../supabase/migrations/00001_initial_schema.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Fichier SQL introuvable:', sqlPath);
    return false;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📝 Exécution du schéma SQL...');
  
  // Supabase JS ne supporte pas l'exécution de SQL arbitraire
  // Il faut utiliser le SQL Editor du dashboard
  console.log('\n⚠️  IMPORTANT: Le script SQL doit être exécuté manuellement');
  console.log('📋 Étapes:');
  console.log('1. Allez sur: https://supabase.com/dashboard/project/tocgrsdlegabfkykhdrz/sql/new');
  console.log('2. Copiez le contenu de: supabase/migrations/00001_initial_schema.sql');
  console.log('3. Collez dans l\'éditeur SQL');
  console.log('4. Cliquez sur "Run"');
  console.log('\n✅ Une fois fait, les tables seront créées\n');

  return true;
}

async function setupStorage() {
  console.log('\n📦 SETUP STORAGE BUCKETS\n');

  // 1. Créer bucket input-images (public)
  console.log('Création du bucket "input-images"...');
  const { data: inputBucket, error: inputError } = await supabase.storage.createBucket('input-images', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  if (inputError) {
    if (inputError.message.includes('already exists')) {
      console.log('✓ Bucket "input-images" existe déjà');
    } else {
      console.error('❌ Erreur:', inputError.message);
    }
  } else {
    console.log('✅ Bucket "input-images" créé');
  }

  // 2. Créer bucket output-images (privé)
  console.log('Création du bucket "output-images"...');
  const { data: outputBucket, error: outputError } = await supabase.storage.createBucket('output-images', {
    public: false,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  });

  if (outputError) {
    if (outputError.message.includes('already exists')) {
      console.log('✓ Bucket "output-images" existe déjà');
    } else {
      console.error('❌ Erreur:', outputError.message);
    }
  } else {
    console.log('✅ Bucket "output-images" créé');
  }

  console.log('\n📋 Prochaine étape: Configurer les Storage Policies');
  console.log('Allez sur: https://supabase.com/dashboard/project/tocgrsdlegabfkykhdrz/storage/policies');
  console.log('\nPolicies à créer:');
  console.log(`
-- INPUT-IMAGES (bucket public)
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'input-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anyone can read input images" ON storage.objects
  FOR SELECT USING (bucket_id = 'input-images');

-- OUTPUT-IMAGES (bucket privé)
CREATE POLICY "Users can read own output images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'output-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
  `);

  return true;
}

async function testConnection() {
  console.log('\n🔌 TEST CONNEXION SUPABASE\n');

  try {
    // Tester la connexion avec une requête simple
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation "public.profiles" does not exist')) {
        console.log('⚠️  Table "profiles" n\'existe pas encore');
        console.log('→ Exécutez le schéma SQL dans le dashboard');
        return false;
      }
      console.error('❌ Erreur:', error.message);
      return false;
    }

    console.log('✅ Connexion Supabase OK');
    console.log(`✅ Table "profiles" accessible`);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 INITIALISATION SUPABASE - InstaDeco\n');
  console.log('Project:', supabaseUrl);
  console.log('='.repeat(50));

  // Test de connexion
  const connected = await testConnection();

  // Setup database
  await setupDatabase();

  // Setup storage
  await setupStorage();

  console.log('\n' + '='.repeat(50));
  console.log('✅ INITIALISATION TERMINÉE\n');

  if (!connected) {
    console.log('⚠️  ATTENTION: Exécutez le schéma SQL manuellement');
    console.log('Puis relancez ce script pour vérifier\n');
  }
}

main().catch(console.error);
