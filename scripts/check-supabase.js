const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('=== VÉRIFICATION SUPABASE ===\n');
  
  // Vérifier profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, email, credits').limit(5);
  if (pErr) {
    console.log('❌ Table profiles:', pErr.message);
  } else {
    console.log('✅ Table profiles:', profiles.length, 'utilisateurs');
    profiles.forEach(p => console.log('   -', p.email, ':', p.credits, 'crédits'));
  }
  
  // Vérifier generations
  const { data: gens, error: gErr } = await supabase.from('generations').select('id, status').limit(5);
  if (gErr) {
    console.log('❌ Table generations:', gErr.message);
  } else {
    console.log('✅ Table generations:', gens.length, 'générations');
  }
  
  // Vérifier credit_transactions
  const { data: tx, error: txErr } = await supabase.from('credit_transactions').select('id, type, amount').limit(5);
  if (txErr) {
    console.log('❌ Table credit_transactions:', txErr.message);
  } else {
    console.log('✅ Table credit_transactions:', tx.length, 'transactions');
  }
  
  // Vérifier Storage buckets
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.log('❌ Storage buckets:', bErr.message);
  } else {
    console.log('✅ Storage buckets:', buckets.map(b => b.name).join(', ') || '(aucun)');
  }
}

check().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
