/**
 * Script pour vérifier les utilisateurs Supabase
 * et créer les profils manquants
 * 
 * Usage: npx tsx scripts/fix-missing-profiles.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🔍 Vérification des utilisateurs Supabase...\n');

  // 1. Récupérer tous les utilisateurs auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Erreur récupération users:', authError);
    process.exit(1);
  }

  console.log(`📊 ${authUsers.users.length} utilisateurs dans auth.users:\n`);

  for (const user of authUsers.users) {
    console.log('─'.repeat(50));
    console.log(`👤 ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Provider: ${user.app_metadata.provider}`);
    console.log(`   Créé: ${user.created_at}`);
    
    // Vérifier si le profil existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      console.log('   ⚠️  PROFIL MANQUANT! Création...');
      
      // Créer le profil manquant
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          credits: 3, // 3 crédits gratuits
          role: 'user',
        });

      if (insertError) {
        console.log(`   ❌ Erreur création profil: ${insertError.message}`);
      } else {
        console.log('   ✅ Profil créé avec 3 crédits gratuits!');
      }
    } else if (profile) {
      console.log(`   ✅ Profil OK - ${profile.credits} crédits`);
    } else if (profileError) {
      console.log(`   ❌ Erreur: ${profileError.message}`);
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log('✅ Vérification terminée!');
}

main().catch(console.error);
