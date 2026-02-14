const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../public/images');
const OUTPUT_DIR = INPUT_DIR;

// Dimensions Facebook cover: 820x312 (minimum) / 1640x624 (recommandé haute résolution)
const SVG_FILES = [
  // Version 1: Avant/Après avec images
  { input: 'facebook-cover-v1.svg', output: 'facebook-cover-v1.png', width: 1640, height: 624 },
  { input: 'facebook-cover-v1.svg', output: 'facebook-cover-v1-medium.png', width: 1200, height: 457 },
  { input: 'facebook-cover-v1.svg', output: 'facebook-cover-v1-small.png', width: 820, height: 312 },
  
  // Version 2: Moderne minimaliste
  { input: 'facebook-cover-v2-modern.svg', output: 'facebook-cover-v2-modern.png', width: 1640, height: 624 },
  { input: 'facebook-cover-v2-modern.svg', output: 'facebook-cover-v2-modern-medium.png', width: 1200, height: 457 },
  { input: 'facebook-cover-v2-modern.svg', output: 'facebook-cover-v2-modern-small.png', width: 820, height: 312 },
  
  // Version 3: Premium Dark (effet wow maximal)
  { input: 'facebook-cover-v3-premium.svg', output: 'facebook-cover-v3-premium.png', width: 1640, height: 624 },
  { input: 'facebook-cover-v3-premium.svg', output: 'facebook-cover-v3-premium-medium.png', width: 1200, height: 457 },
  { input: 'facebook-cover-v3-premium.svg', output: 'facebook-cover-v3-premium-small.png', width: 820, height: 312 },
];

async function convertCovers() {
  console.log('🎨 Conversion des covers Facebook en cours...\n');

  for (const { input, output, width, height } of SVG_FILES) {
    const inputPath = path.join(INPUT_DIR, input);
    const outputPath = path.join(OUTPUT_DIR, output);

    if (!fs.existsSync(inputPath)) {
      console.warn(`⚠️  Fichier source non trouvé: ${input}`);
      continue;
    }

    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .png({
          quality: 100,
          compressionLevel: 9,
          palette: false
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`✅ ${output}`);
      console.log(`   Dimensions: ${width}x${height}px`);
      console.log(`   Taille: ${sizeKB} Ko\n`);
    } catch (error) {
      console.error(`❌ Erreur lors de la conversion de ${input}:`, error.message);
    }
  }

  console.log('✨ Conversion terminée! Les fichiers sont dans public/images/\n');
  console.log('📱 Utilisez facebook-cover-v1.png (1640x624) pour la meilleure qualité');
  console.log('💻 Alternative: facebook-cover-v1-medium.png (1200x457) pour un bon compromis');
  console.log('📦 Mobile: facebook-cover-v1-small.png (820x312) pour le minimum requis\n');
}

convertCovers().catch(console.error);
