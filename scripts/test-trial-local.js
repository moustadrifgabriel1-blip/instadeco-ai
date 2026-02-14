#!/usr/bin/env node
/**
 * Test end-to-end de l'API trial/generate en local.
 * Usage: node scripts/test-trial-local.js
 */

const fs = require('fs');
const path = require('path');

const DEV_TOKEN = '0e42f7f1085622e2e15d5c47d0e3402aa4f83573b63a13a539b8650929bbdbb1';

// Charger before-chambre-1.jpg depuis public/images/
const imagePath = path.join(__dirname, '..', 'public', 'images', 'before-chambre-1.jpg');
let imageBase64;
try {
  const imageBuffer = fs.readFileSync(imagePath);
  imageBase64 = 'data:image/jpeg;base64,' + imageBuffer.toString('base64');
  console.log('Image chargee:', imagePath);
  console.log('Taille base64:', (imageBase64.length / 1024).toFixed(0), 'KB');
} catch (e) {
  console.error('Impossible de charger l image:', e.message);
  process.exit(1);
}

async function testTrialGeneration() {
  const url = 'http://localhost:3000/api/trial/generate';
  
  console.log('=== TEST TRIAL GENERATION ===');
  console.log('URL:', url);
  console.log('Dev bypass: ON');
  console.log('');

  const startTime = Date.now();

  try {
    console.log('1. Envoi de la requete...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `instadeco_dev=${DEV_TOKEN}`,
      },
      body: JSON.stringify({
        imageBase64: imageBase64,
        roomType: 'chambre',
        style: 'moderne',
        fingerprint: 'test-local-' + Date.now(),
      }),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const data = await response.json();

    console.log(`2. Reponse recue en ${duration}s (status: ${response.status})`);
    console.log('');

    if (response.ok && data.imageUrl) {
      console.log('==============================================');
      console.log('  SUCCES ! La generation fonctionne !');
      console.log('==============================================');
      console.log('Image URL:', data.imageUrl.substring(0, 100) + '...');
      console.log('Message:', data.message);
      process.exit(0);
    } else {
      console.log('==============================================');
      console.log('  ECHEC - Pas d\'image retournee');
      console.log('==============================================');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
      process.exit(1);
    }
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`ERREUR apres ${duration}s:`, err.message);
    process.exit(1);
  }
}

testTrialGeneration();
