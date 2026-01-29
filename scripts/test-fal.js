const { fal } = require('@fal-ai/client');
require('dotenv').config({ path: '.env.local' });

fal.config({ credentials: process.env.FAL_KEY });

async function test() {
  const imageUrl = 'https://tocgrsdlegabfkykhdrz.supabase.co/storage/v1/object/public/input-images/f88c9b68-eda4-4d67-bfb4-f631d21b37c6/1769077890127.jpg';
  
  console.log('Testing with Supabase image:', imageUrl);
  
  try {
    console.log('Testing with Flux [dev] + ControlNet...');
    
    // Using fal.queue.submit to match the service implementation, 
    // but for a simple script, fal.subscribe is easier to wait for result.
    // However, the service uses queue.submit. Let's stick to subscribe for the test script 
    // to get immediate feedback without polling loop implementation in the script.
    // Ideally, we should test what the service does.
    
    const result = await fal.subscribe('fal-ai/flux-general', {
      input: {
        prompt: "Cinematic photo of a spacious living room, modern interior design, sleek lines, contemporary italian furniture, neutral color palette, warm lighting, high-end finishing, architectural digest style, 8k, photorealistic. Highly detailed, 8k resolution, professional interior design photography, architectural digest, sharp focus, perfect lighting.",
        control_loras: [
          {
            path: "https://huggingface.co/XLabs-AI/flux-controlnet-depth-v3/resolve/main/flux-depth-controlnet-v3.safetensors?download=true",
            control_image_url: imageUrl,
            scale: 1.0,
            preprocess: "depth"
          }
        ],
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: false,
        output_format: "jpeg"
      },
      logs: true,
    });
    
    const data = result?.data || result;
    // Flux returns images array usually
    const outputUrl = data?.images?.[0]?.url || data?.image?.url;
    
    console.log('✅ Success:', outputUrl);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Status:', error.status);
    console.error('Body:', JSON.stringify(error.body, null, 2));
  }
}

test();
