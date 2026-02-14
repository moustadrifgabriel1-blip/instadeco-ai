#!/usr/bin/env node
/**
 * Test direct de fal.ai pour isoler l'erreur "Unprocessable Entity".
 * Appelle fal.run() directement sans passer par l'API Next.js.
 */
const { fal } = require('@fal-ai/client');
const fs = require('fs');
const path = require('path');

// Charger les env vars
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY manquant dans .env.local');
  process.exit(1);
}

fal.config({ credentials: FAL_KEY });
console.log('FAL_KEY:', FAL_KEY.substring(0, 10) + '...');

const MODEL_PATH = 'fal-ai/flux-general/image-to-image';

async function test() {
  // 1. Charger l'image
  const imagePath = path.join(__dirname, '..', 'public', 'images', 'before-chambre-1.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  console.log('Image:', imagePath, '- Size:', (imageBuffer.length / 1024).toFixed(0), 'KB');

  // 2. Upload vers fal.storage
  console.log('\n1. Upload image vers fal.storage...');
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  const uploadedUrl = await fal.storage.upload(blob);
  console.log('   URL:', uploadedUrl);

  // 3. Appel fal.run() avec les mêmes params que la route trial
  const input = {
    prompt: 'Interior design transformation of this exact bedroom. Modern minimalist with clean lines, neutral colors, contemporary furniture. Professional architectural photograph, photorealistic, 8k, natural lighting.',
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
    negative_prompt: 'different room layout, changed walls, modified windows',
    image_size: 'landscape_4_3',
    num_inference_steps: 28,
    guidance_scale: 3.5,
    enable_safety_checker: true,
    output_format: 'jpeg',
  };

  console.log('\n2. Appel fal.run()...');
  console.log('   Model:', MODEL_PATH);
  console.log('   Input keys:', Object.keys(input).join(', '));

  try {
    const startTime = Date.now();
    const result = await fal.run(MODEL_PATH, { input });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n3. Resultat en ${duration}s:`);
    console.log('   Keys:', Object.keys(result || {}).join(', '));

    const imageUrl = result?.data?.images?.[0]?.url
      || result?.images?.[0]?.url
      || result?.data?.image?.url;

    if (imageUrl) {
      console.log('\n=== SUCCES ===');
      console.log('Image:', imageUrl.substring(0, 80) + '...');
    } else {
      console.log('\n=== PAS D\'IMAGE ===');
      console.log(JSON.stringify(result, null, 2).substring(0, 1000));
    }
  } catch (err) {
    console.error('\n=== ERREUR ===');
    console.error('Message:', err.message);
    console.error('Status:', err.status);
    console.error('Body:', JSON.stringify(err.body || err.data || {}, null, 2).substring(0, 500));
    
    // Essayer d'extraire les détails de validation
    if (err.body?.detail) {
      console.error('Detail:', JSON.stringify(err.body.detail, null, 2));
    }
    
    // Afficher toutes les propriétés de l'erreur
    console.error('\nError props:', Object.keys(err).join(', '));
    for (const key of Object.keys(err)) {
      if (key !== 'stack') {
        console.error(`  ${key}:`, JSON.stringify(err[key]).substring(0, 200));
      }
    }
  }
}

test().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
