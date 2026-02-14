require('dotenv').config({ path: '.env.local' });

const key = process.env.FAL_KEY || process.env.FAL_API_KEY;
console.log('Key found:', key ? key.substring(0, 10) + '...' : 'NO KEY');

const requestId = '043b7eba-780c-46b7-88b2-fa924eadef34';
const MODEL_PATH = 'fal-ai/flux-general/image-to-image';

async function test() {
  // 1. Check status
  console.log('\n--- STATUS ---');
  const statusRes = await fetch(`https://queue.fal.run/${MODEL_PATH}/requests/${requestId}/status`, {
    headers: { 'Authorization': `Key ${key}` }
  });
  console.log('Status HTTP:', statusRes.status);
  const statusBody = await statusRes.text();
  console.log('Status body:', statusBody);

  // 2. Check result
  console.log('\n--- RESULT ---');
  const resultRes = await fetch(`https://queue.fal.run/${MODEL_PATH}/requests/${requestId}`, {
    headers: { 'Authorization': `Key ${key}` }
  });
  console.log('Result HTTP:', resultRes.status);
  const resultBody = await resultRes.text();
  console.log('Result body:', resultBody.substring(0, 1000));

  // 3. Test with SDK
  console.log('\n--- SDK ---');
  const { fal } = require('@fal-ai/client');
  fal.config({ credentials: key });
  
  try {
    const sdkStatus = await fal.queue.status(MODEL_PATH, { requestId, logs: false });
    console.log('SDK status:', JSON.stringify(sdkStatus));
  } catch (e) {
    console.error('SDK status error:', e.message, e.body || e.status);
  }

  try {
    const sdkResult = await fal.queue.result(MODEL_PATH, { requestId });
    console.log('SDK result keys:', Object.keys(sdkResult || {}));
    console.log('SDK result.data keys:', Object.keys(sdkResult?.data || {}));
    console.log('SDK result:', JSON.stringify(sdkResult).substring(0, 500));
  } catch (e) {
    console.error('SDK result error:', e.message, e.body || e.status);
  }
}

test().catch(console.error);
