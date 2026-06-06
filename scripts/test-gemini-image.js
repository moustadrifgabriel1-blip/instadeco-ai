#!/usr/bin/env node
/**
 * Test direct de Google Gemini 2.5 Flash Image ("Nano Banana") en REST pur.
 *
 * Prend une image locale, l'envoie en image-to-image avec un prompt de restyling
 * déco (structure verrouillée), récupère l'image éditée en base64 et la sauve sur disque.
 * But : PROUVER que la génération Gemini fonctionne sans passer par Next.js / Supabase.
 *
 * Usage :
 *   node scripts/test-gemini-image.js
 *   node scripts/test-gemini-image.js public/images/before-chambre-1.jpg scandinave chambre keep_layout
 *
 * Pré-requis : GEMINI_API_KEY valide dans .env.local
 *   (override possible : GEMINI_IMAGE_MODEL, défaut gemini-2.5-flash-image)
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY manquant dans .env.local');
  process.exit(1);
}

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// --- Args CLI ---
const imageArg = process.argv[2] || 'public/images/before-chambre-1.jpg';
const styleArg = (process.argv[3] || 'scandinave').toLowerCase();
const roomArg = (process.argv[4] || 'chambre').toLowerCase();
const modeArg = (process.argv[5] || 'full_redesign').toLowerCase();

const imagePath = path.isAbsolute(imageArg)
  ? imageArg
  : path.join(__dirname, '..', imageArg);

if (!fs.existsSync(imagePath)) {
  console.error(`❌ Image introuvable: ${imagePath}`);
  process.exit(1);
}

// --- mimeType à partir de l'extension ---
const ext = path.extname(imagePath).toLowerCase();
const MIME = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

// --- Directives par mode (version condensée du presets serveur) ---
const MODE_DIRECTIVE = {
  full_redesign:
    'Perform a complete interior redesign. Replace all free-standing furniture and decor with a cohesive new design. You may restyle wall paint, flooring finish, textiles and lighting.',
  keep_layout:
    'Restyle the room while KEEPING the exact same furniture layout and positions. Change only style, materials, colors and decor of the existing pieces. Do not move, add or remove furniture.',
  decor_only:
    'Change ONLY the decorative accessories and soft furnishings (cushions, rugs, curtains, art, plants). Keep every furniture piece identical in shape, position, material and color.',
  home_staging:
    'Virtual home staging: keep the architectural shell pixel-faithful (walls, ceiling, windows, doors, baseboards, floor, built-in appliances, radiators, outlets). Only add/restyle movable furniture and decor.',
};

const STYLE_DESC = {
  moderne: 'contemporary modern interior, clean lines, warm neutral palette, light wood floors',
  scandinave: 'Scandinavian hygge interior, light oak floors, bouclé upholstery, soft cream palette',
  boheme: 'bohemian interior, layered rugs, rattan furniture, trailing plants, terracotta palette',
  japandi: 'Japandi interior, light wood, linen textiles, muted earth tones, wabi-sabi ceramics',
  industriel: 'industrial loft, exposed brick, black steel, leather sofa, Edison pendants',
  minimaliste: 'ultra-minimalist interior, warm wood accents, essential furniture, generous negative space',
  luxe: 'luxury interior, marble surfaces, brass fixtures, deep velvet, crystal chandelier',
};

const ROOM_LABEL = {
  salon: 'living room',
  chambre: 'bedroom',
  cuisine: 'kitchen',
  'salle-de-bain': 'bathroom',
  bureau: 'home office',
  'salle-a-manger': 'dining room',
};

const STRUCTURE_LOCK =
  'CRITICAL: preserve the architectural shell exactly — same walls, ceiling height, windows (frames, glazing, sills) and their view, same doors, same room proportions. Keep the EXACT same camera angle, perspective and framing as the source photo. Keep the natural window lighting direction.';

const QUALITY =
  'Photorealistic, indistinguishable from a real interior photograph, accurate white balance, true material textures, Architectural Digest quality, ultra high resolution. No text, no watermark, no people, no cartoon or CGI look.';

const prompt = [
  MODE_DIRECTIVE[modeArg] || MODE_DIRECTIVE.full_redesign,
  STRUCTURE_LOCK,
  `Target style for this ${ROOM_LABEL[roomArg] || 'room'}: a ${styleArg} interior — ${
    STYLE_DESC[styleArg] || 'modern interior, neutral tones, contemporary furniture'
  }.`,
  QUALITY,
  'Output: return the edited photograph as an image. Do not return only text.',
].join('\n\n');

async function main() {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  console.log('──────────────────────────────────────────────');
  console.log('🍌 Test Gemini Image (Nano Banana)');
  console.log('  modèle   :', MODEL);
  console.log('  image    :', imagePath, `(${(imageBuffer.length / 1024).toFixed(0)} KB, ${MIME})`);
  console.log('  style    :', styleArg, '| pièce:', roomArg, '| mode:', modeArg);
  console.log('  clé      :', API_KEY.slice(0, 10) + '…');
  console.log('──────────────────────────────────────────────');

  const startedAt = Date.now();
  const response = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: MIME, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        temperature: 0.4,
      },
    }),
  });

  console.log('HTTP', response.status, response.statusText);

  if (!response.ok) {
    const errText = await response.text();
    console.error('❌ Erreur API:', errText.slice(0, 800));
    if (response.status === 403 && /leaked/i.test(errText)) {
      console.error(
        '\n⚠️  La clé GEMINI_API_KEY a été signalée comme divulguée par Google.\n' +
          '    Génère une nouvelle clé sur https://aistudio.google.com/apikey\n' +
          '    et remplace GEMINI_API_KEY dans .env.local.',
      );
    }
    process.exit(2);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];

  let outBase64 = null;
  let outMime = null;
  let outText = null;
  for (const p of parts) {
    const inline = p.inlineData || p.inline_data;
    if (inline && inline.data) {
      outBase64 = inline.data;
      outMime = inline.mimeType || inline.mime_type || 'image/png';
    } else if (p.text) {
      outText = p.text;
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`⏱  ${elapsed}s | parts: ${parts.length} | finishReason: ${data?.candidates?.[0]?.finishReason || 'n/a'}`);
  if (outText) console.log('📝 texte renvoyé:', outText.slice(0, 160));

  if (!outBase64) {
    console.error(
      '❌ Aucune image dans la réponse.',
      'promptFeedback:',
      JSON.stringify(data?.promptFeedback || {}),
    );
    process.exit(3);
  }

  const outExt = outMime.includes('png') ? 'png' : 'jpg';
  const outPath = path.join(
    __dirname,
    '..',
    `gemini-image-out-${styleArg}-${modeArg}.${outExt}`,
  );
  fs.writeFileSync(outPath, Buffer.from(outBase64, 'base64'));
  const outKb = (fs.statSync(outPath).size / 1024).toFixed(0);

  console.log('✅ Image générée et sauvegardée :');
  console.log('   ', outPath, `(${outKb} KB, ${outMime})`);
}

main().catch((err) => {
  console.error('❌ Erreur inattendue:', err && err.message ? err.message : err);
  process.exit(4);
});
