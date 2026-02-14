#!/usr/bin/env node
/**
 * Test A/B de fal.ai : AVEC vs SANS easycontrols
 */
const { fal } = require('@fal-ai/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
fal.config({ credentials: FAL_KEY });

const MODEL_PATH = 'fal-ai/flux-general/image-to-image';

async function test() {
  const imagePath = path.join(__dirname, '..', 'public', 'images', 'before-chambre-1.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  
  console.log('Upload image...');
  const uploadedUrl = await fal.storage.upload(blob);
  console.log('URL:', uploadedUrl.substring(0, 60));

  // TEST 1: Sans easycontrols (img2img pur)
  console.log('\n=== TEST 1: SANS easycontrols ===');
  try {
    const start1 = Date.now();
    const result1 = await fal.run(MODEL_PATH, {
      input: {
        prompt: 'Modern minimalist bedroom interior design, clean lines, neutral colors, professional photography, 8k.',
        image_url: uploadedUrl,
        strength: 0.55,
        negative_prompt: 'different room layout, changed walls',
        image_size: 'landscape_4_3',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: true,
        output_format: 'jpeg',
      },
    });
    const d1 = ((Date.now() - start1) / 1000).toFixed(1);
    const url1 = result1?.data?.images?.[0]?.url || result1?.images?.[0]?.url;
    console.log(`SUCCES en ${d1}s ! Image: ${url1 ? url1.substring(0, 60) + '...' : 'NO URL'}`);
    if (!url1) console.log('Result keys:', Object.keys(result1 || {}));
  } catch (err) {
    console.error('ECHEC:', err.message);
    console.error('Detail:', JSON.stringify(err.body?.detail || '').substring(0, 200));
  }

  // TEST 2: Avec easycontrols depth
  console.log('\n=== TEST 2: AVEC easycontrols depth ===');
  try {
    const start2 = Date.now();
    const result2 = await fal.run(MODEL_PATH, {
      input: {
        prompt: 'Modern minimalist bedroom interior design, clean lines, neutral colors, professional photography, 8k.',
        image_url: uploadedUrl,
        strength: 0.55,
        easycontrols: [
          {
            control_method_url: 'depth',
            image_url: uploadedUrl,
            image_control_type: 'spatial',
            scale: 1.0,
          },
        ],
        negative_prompt: 'different room layout, changed walls',
        image_size: 'landscape_4_3',
        num_inference_steps: 28,
        guidance_scale: 3.5,
        enable_safety_checker: true,
        output_format: 'jpeg',
      },
    });
    const d2 = ((Date.now() - start2) / 1000).toFixed(1);
    const url2 = result2?.data?.images?.[0]?.url || result2?.images?.[0]?.url;
    console.log(`SUCCES en ${d2}s ! Image: ${url2 ? url2.substring(0, 60) + '...' : 'NO URL'}`);
  } catch (err) {
    console.error('ECHEC:', err.message);
    console.error('Detail:', JSON.stringify(err.body?.detail || '').substring(0, 200));
  }
}

test().catch(err => console.error('Fatal:', err.message));
