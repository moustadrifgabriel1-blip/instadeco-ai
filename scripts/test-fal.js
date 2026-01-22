const { fal } = require('@fal-ai/client');
require('dotenv').config({ path: '.env.local' });

fal.config({ credentials: process.env.FAL_KEY });

async function test() {
  const imageUrl = 'https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/input-images/f88c9b68-eda4-4d67-bfb4-f631d21b37c6/1769077890127.jpg';
  
  console.log('Testing with Supabase image:', imageUrl);
  
  try {
    const result = await fal.subscribe('half-moon-ai/ai-home/style', {
      input: {
        input_image_url: imageUrl,
        architecture_type: 'living room-interior',
        style: 'modern-interior',
        color_palette: 'muted sands',
        input_image_strength: 0.85,
        output_format: 'jpeg',
      },
    });
    
    const data = result?.data || result;
    console.log('✅ Success:', data?.image?.url?.substring(0, 80) + '...');
    console.log('Status:', data?.status);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Body:', JSON.stringify(error.body, null, 2));
  }
}

test();
