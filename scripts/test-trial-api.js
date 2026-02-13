#!/usr/bin/env node
/**
 * Script de test de l'API Trial
 * 
 * Usage:
 *   node scripts/test-trial-api.js
 * 
 * Teste :
 * 1. Appel à /api/trial/generate avec une image de test
 * 2. Polling de /api/trial/status
 * 3. Affiche les logs détaillés
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Image de test 1x1 pixel en base64
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testTrialGenerate() {
  console.log('🧪 Test Trial Generate API');
  console.log('API Base:', API_BASE);

  try {
    console.log('\n1️⃣ Calling /api/trial/generate...');
    const response = await fetch(`${API_BASE}/api/trial/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: TEST_IMAGE_BASE64,
        roomType: 'salon',
        style: 'moderne',
        fingerprint: 'test-script',
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ Generate failed');
      return null;
    }

    if (!data.requestId) {
      console.error('❌ No requestId in response');
      return null;
    }

    console.log(`✅ Job submitted: ${data.requestId}`);
    return data.requestId;

  } catch (error) {
    console.error('❌ Error calling generate:', error.message);
    return null;
  }
}

async function testTrialStatus(requestId) {
  console.log(`\n2️⃣ Polling /api/trial/status for requestId=${requestId}`);

  for (let i = 0; i < 10; i++) {
    console.log(`\n⏳ Poll attempt ${i + 1}/10...`);
    
    try {
      const response = await fetch(`${API_BASE}/api/trial/status?requestId=${requestId}`);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));

      if (data.status === 'completed') {
        console.log('✅ Generation completed!');
        console.log('Image URL:', data.imageUrl);
        return true;
      }

      if (data.status === 'failed') {
        console.error('❌ Generation failed:', data.error);
        return false;
      }

      console.log('⏳ Still processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error('❌ Error polling status:', error.message);
      return false;
    }
  }

  console.error('⏰ Timed out after 10 polls (~30s)');
  return false;
}

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║  InstaDeco - Trial API Test          ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Vérifier que FAL_KEY est configuré
  if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) {
    console.error('❌ FAL_KEY not found in environment');
    console.error('Make sure .env.local has FAL_KEY set');
    process.exit(1);
  }

  const requestId = await testTrialGenerate();

  if (!requestId) {
    console.error('\n❌ Test failed at generate step');
    process.exit(1);
  }

  const success = await testTrialStatus(requestId);

  if (success) {
    console.log('\n✅ Test passed!');
  } else {
    console.error('\n❌ Test failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Unhandled error:', error);
  process.exit(1);
});
