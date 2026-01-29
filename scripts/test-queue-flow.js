const { fal } = require('@fal-ai/client');
require('dotenv').config({ path: '.env.local' });

fal.config({ credentials: process.env.FAL_KEY });

const MODEL = 'fal-ai/flux-general';

async function test() {
  // 1. Submit job
  console.log('1. Submitting job...');
  const { request_id } = await fal.queue.submit(MODEL, {
    input: {
      prompt: 'A modern living room, interior design, 8k',
      image_size: 'landscape_4_3',
      num_inference_steps: 10,
      guidance_scale: 3.5
    }
  });
  console.log('Request ID:', request_id);
  
  // 2. Poll status
  let done = false;
  while (!done) {
    console.log('2. Checking status...');
    const status = await fal.queue.status(MODEL, { requestId: request_id, logs: false });
    console.log('Status object:', JSON.stringify(status, null, 2));
    
    const statusCode = (status.status || '').toUpperCase();
    
    if (statusCode === 'COMPLETED' || statusCode === 'SUCCEEDED' || statusCode === 'OK') {
      done = true;
      console.log('3. Getting result...');
      const result = await fal.queue.result(MODEL, { requestId: request_id });
      console.log('Result keys:', Object.keys(result));
      console.log('result.data:', result.data ? Object.keys(result.data) : 'NO DATA');
      console.log('result.images:', result.images);
      console.log('result.data?.images:', result.data?.images);
      
      // This is what we need to extract
      const imageUrl = result.data?.images?.[0]?.url || result.images?.[0]?.url;
      console.log('\n✅ EXTRACTED IMAGE URL:', imageUrl);
    } else if (statusCode === 'FAILED') {
      console.log('FAILED');
      done = true;
    } else {
      console.log('Still processing, waiting 2s...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

test().catch(e => {
  console.error('Error:', e.message);
  console.error(e.stack);
});
