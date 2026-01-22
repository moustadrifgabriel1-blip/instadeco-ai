import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Check .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = 'moustadrifgabriel1@gmail.com';

async function setAdminUser() {
  console.log(`Searching for user with email: ${TARGET_EMAIL}...`);

  // 1. Get user profile
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', TARGET_EMAIL);

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.error(`User not found! Please sign up with ${TARGET_EMAIL} first.`);
    return;
  }

  const user = profiles[0];
  console.log('User found:', user.id);

  // 2. Update profile
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      role: 'admin',
      credits: 999999, // Unlimited credits
      is_test_account: true
    })
    .eq('id', user.id)
    .select();

  if (updateError) {
    console.error('Error updating profile:', updateError);
    return;
  }

  console.log('✅ User successfully upgraded to ADMIN with UNLIMITED credits!');
  console.log(updated[0]);
}

setAdminUser();
