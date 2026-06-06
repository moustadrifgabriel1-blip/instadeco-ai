/**
 * Presets partagés — Google Gemini 2.5 Flash Image ("Nano Banana") en image-to-image.
 *
 * Pendant Gemini de flux-presets.ts. Contrairement à Flux (qui pilote via strength /
 * guidance / negative_prompt), Gemini ne prend AUCUN paramètre numérique de ce type :
 * tout passe par le PROMPT TEXTE. On encode donc ici, en langage naturel très explicite,
 * exactement ce qui doit être préservé et ce qui peut changer pour chaque mode.
 *
 * Anglais = meilleure adhérence côté Gemini, comme pour Flux.
 */

import {
  getRoomLabel,
  getStyleDescription,
  type TransformMode,
} from '@/src/shared/constants/interior-design';

// Re-export pour compatibilité des imports existants (GeminiImageGeneratorService).
export type { TransformMode };

/**
 * Contrat de préservation architecturale commun à tous les modes.
 * C'est la force de Gemini : il "comprend" la scène et peut verrouiller la structure
 * bien mieux qu'un img2img piloté par strength.
 */
export const GEMINI_STRUCTURE_LOCK = `CRITICAL CONSTRAINT — preserve the architectural shell exactly as in the source photo: keep the same walls and wall corners, the same ceiling and ceiling height, the same windows (identical frames, glazing bars, sills and the exact view through them), the same doors and door frames, the same room proportions and overall geometry. Keep the EXACT same camera angle, perspective, focal length and lens characteristics as the original photograph — do not zoom, pan, rotate or re-frame. Keep the same natural lighting direction coming from the windows.`;

/**
 * Rappel qualité (équivalent FLUX_QUALITY_SUFFIX) — rendu "board client agence déco".
 */
export const GEMINI_QUALITY_SUFFIX = `Photorealistic result, indistinguishable from a real interior photograph shot on a full-frame camera at eye level. Restrained color grading, accurate white balance, natural window light with soft bounce fill, true material textures (stone, wood, linen, metal), Architectural Digest quality, ultra high resolution. No text, no watermark, no logo, no people, no surreal or cartoon rendering, no CGI / video-game look.`;

/**
 * Directive spécifique par mode — ce qui CHANGE vs ce qui reste figé.
 */
const MODE_DIRECTIVE: Record<TransformMode, string> = {
  // Refonte complète : meubles + déco entièrement renouvelés, structure intacte.
  full_redesign: `TASK: Perform a complete interior redesign of this room. Replace all the free-standing furniture and all decor with a fully cohesive new design. You may restyle wall paint, flooring finish, textiles and lighting fixtures to match the new style. Do NOT move walls, windows or doors, and do NOT change the room's shape or the camera framing.`,

  // Garde le layout : même implantation des meubles, on change le style.
  keep_layout: `TASK: Restyle this room while KEEPING the existing furniture layout. Every furniture piece must stay in the SAME position and at the same scale as in the source photo (the sofa stays where the sofa is, the bed where the bed is, the table where the table is). Change only the style, materials, colors, upholstery and finishes of those pieces, plus the decor and textiles. Do not add, remove or relocate any furniture, and do not alter the architecture or the camera framing.`,

  // Déco seulement : meubles inchangés, on ne touche qu'aux accessoires.
  decor_only: `TASK: Change ONLY the decorative accessories and soft furnishings of this room. The existing furniture must remain exactly the same — same pieces, same shapes, same positions, same materials and same colors (do not replace the sofa, bed, table, cabinets, etc.). You may only update: cushions, throws, rugs, curtains, wall art, plants, books, vases, tableware and small decorative objects. Do not alter the architecture, the furniture, or the camera framing.`,

  // Home staging : verrou maximal, on meuble/restyle une pièce vide ou défraîchie.
  home_staging: `TASK: Perform virtual home staging of this EXACT room. The architectural shell is frozen and must stay pixel-faithful to the reference: same walls, same ceiling height, same windows (frames, glazing bars, sills), same doors and door frames, same baseboards and skirting, same floor (material, color, pattern and grout lines preserved), same built-in kitchen appliances in place (a cooktop stays a cooktop at the same spot, an oven stays an oven, never replaced by furniture), same radiators, same wall outlets and light switches, same ceiling-lamp position. Only the movable items change: free-standing furniture, soft furnishings, decor accessories, rugs, curtains, artwork, cushions, throws, plants. Wall paint color may be gently restyled. Absolutely no construction, renovation or structural change.`,
};

/**
 * Construit le prompt Gemini complet.
 *
 * On combine, dans cet ordre : tâche par mode -> verrou structurel ->
 * style/pièce cible -> éventuel prompt custom fourni par l'appelant -> qualité.
 * L'instruction finale force Gemini à RENVOYER l'image éditée (et pas juste du texte).
 *
 * @param basePrompt prompt déjà construit par l'API route (peut être vide)
 */
export function buildGeminiImagePrompt(opts: {
  basePrompt?: string;
  transformMode: TransformMode;
  styleSlug?: string;
  roomType?: string;
}): string {
  const mode = opts.transformMode;
  const styleSlug = (opts.styleSlug || 'moderne').toLowerCase();
  const roomType = (opts.roomType || 'salon').toLowerCase();

  const styleDesc = getStyleDescription(styleSlug);
  const roomLabel = getRoomLabel(roomType);

  const styleLine =
    mode === 'decor_only'
      ? `Target decor mood for this ${roomLabel}: ${styleDesc}.`
      : `Target style for this ${roomLabel}: a ${styleSlug} interior — ${styleDesc}.`;

  // Le prompt custom de l'appelant (si présent) est ajouté comme direction additionnelle,
  // sans pouvoir contredire le verrou structurel placé juste au-dessus.
  const customLine = opts.basePrompt?.trim()
    ? `Additional styling direction: ${opts.basePrompt.trim()}`
    : '';

  return [
    MODE_DIRECTIVE[mode],
    GEMINI_STRUCTURE_LOCK,
    styleLine,
    customLine,
    GEMINI_QUALITY_SUFFIX,
    'Output: return the edited photograph as an image. Do not return only a textual description.',
  ]
    .filter(Boolean)
    .join('\n\n');
}
