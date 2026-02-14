#!/usr/bin/env node
/**
 * Convertit le logo SVG en PNG de différentes tailles
 * 
 * Usage:
 *   npm install sharp
 *   node scripts/convert-logo-to-png.js
 * 
 * Génère:
 *   public/images/logo-instadeco-180.png   (Facebook profile)
 *   public/images/logo-instadeco-512.png   (High res)
 *   public/images/logo-instadeco-1024.png  (Super high res)
 */

const fs = require('fs');
const path = require('path');

// Vérifier si sharp est installé
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp n\'est pas installé. Exécutez d\'abord:');
  console.error('   npm install sharp');
  process.exit(1);
}

const inputSvg = path.join(__dirname, '../public/images/logo-v3-house-sparkle.svg');
const outputDir = path.join(__dirname, '../public/images');

const sizes = [
  { width: 180, suffix: '180' },   // Facebook profile pic
  { width: 512, suffix: '512' },   // High res
  { width: 1024, suffix: '1024' }, // Super high res
];

async function convertLogo() {
  console.log('🎨 Conversion du logo en PNG...\n');

  if (!fs.existsSync(inputSvg)) {
    console.error(`❌ Fichier introuvable: ${inputSvg}`);
    process.exit(1);
  }

  for (const { width, suffix } of sizes) {
    const outputPath = path.join(outputDir, `logo-instadeco-${suffix}.png`);
    
    try {
      await sharp(inputSvg)
        .resize(width, width)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      const sizeKb = (stats.size / 1024).toFixed(1);
      console.log(`✅ ${width}x${width}px → logo-instadeco-${suffix}.png (${sizeKb} Ko)`);
    } catch (error) {
      console.error(`❌ Erreur pour ${width}px:`, error.message);
    }
  }

  console.log('\n✨ Conversion terminée!');
  console.log(`📁 Fichiers générés dans: ${outputDir}`);
}

convertLogo().catch(error => {
  console.error('\n❌ Erreur:', error.message);
  process.exit(1);
});
