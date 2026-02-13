import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGenerationInsert() {
  const userId = 'f88c9b68-eda4-4d67-bfb4-f631d21b37c6'; // The admin user ID we found earlier

  console.log('Testing generation insert for user:', userId);

  const { data, error } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      style_slug: 'moderne',
      room_type_slug: 'chambre',
      input_image_url: 'https://via.placeholder.com/150',
      custom_prompt: 'Test prompt',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Insert successful:', data);
  }
}

testGenerationInsert();
