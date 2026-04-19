/**
 * Presets partagés — fal-ai/flux-general/image-to-image
 * Utilisés par FalImageGeneratorService et /api/trial/generate pour rester alignés.
 */

/**
 * Steps : 38 = bon compromis rendu premium / latence (~+2–4 s vs 30).
 * Monter à 42–45 seulement si budget temps/coût OK.
 */
export const FLUX_IMG2IMG_INFERENCE_STEPS = 38;

/**
 * Suffixe qualité (anglais) — ton « agence haut de gamme » : board client, photo pro, pas de rendu 3D cheap.
 */
export const FLUX_QUALITY_SUFFIX = `High-end residential interior presentation, as if photographed for a luxury design agency client board. Photorealistic, restrained color grading, natural window light with soft bounce fill, accurate white balance, tactile material truth (stone, wood, linen, metal), subtle film-like clarity without hdr excess, shot on full-frame at eye level, Architectural Digest quality, 8k ultra high resolution.`;

/**
 * Renfort du negative prompt (artefacts fréquents img2img).
 */
export const FLUX_NEGATIVE_SUFFIX =
  'oversaturated hdr halos, harsh on-camera flash, plastic-looking furniture, unnatural glossy reflections, warped perspective, melting architecture, duplicated furniture, cluttered hoarder mess, surreal proportions, amateur snapshot, cgi render, unreal engine look, video game screenshot, fisheye distortion';

/** Guidance : modes subtils ont besoin d’un peu plus d’adhérence au prompt texte */
export const GUIDANCE_BY_MODE: Record<
  'full_redesign' | 'keep_layout' | 'decor_only' | 'home_staging',
  number
> = {
  full_redesign: 5.72,
  keep_layout: 5.95,
  decor_only: 6.2,
  // Home staging : guidance élevée pour que l’IA suive strictement le prompt “ne rien déplacer”
  home_staging: 6.8,
};

/** NAG légèrement plus fort quand on doit surtout déplacer déco / accessoires */
export const NAG_SCALE_BY_MODE: Record<
  'full_redesign' | 'keep_layout' | 'decor_only' | 'home_staging',
  number
> = {
  full_redesign: 4,
  keep_layout: 4.15,
  decor_only: 4.35,
  // Home staging : NAG fort pour pousser le negative prompt (anti-déplacement structurel)
  home_staging: 4.8,
};

/* -------------------------------------------------------------------------- */
/* HOME STAGING — structure verrouillée                                        */
/* -------------------------------------------------------------------------- */

/**
 * Strength très bas : on modifie le moins possible de pixels.
 * En combinaison avec le prompt/negative/NAG/guidance, cela donne le meilleur
 * compromis possible SANS masque pour un “home staging virtuel”.
 *
 * Note : pour une vraie garantie pixel-près, utiliser le pipeline d’inpainting
 * (Phase B — /api/v2/stage) qui compose le résultat avec sharp.
 */
export const HOME_STAGING_STRENGTH = 0.38;

/**
 * Préfixe de prompt — on DICTE à l’IA ce qu’elle doit garder identique.
 * Anglais = meilleure adhérence Flux. Très explicite sur chaque élément
 * non déplaçable (ce que l’utilisateur a demandé mot pour mot).
 */
export const HOME_STAGING_LOCK_PROMPT = `Virtual home staging of the EXACT same room. The architectural shell is frozen and must stay pixel-identical to the reference photo: same walls, same wall corners, same ceiling height, same windows with identical frames and glazing bars and sills, same doors and door frames, same baseboards and skirting, same floor (material, color, pattern, grout lines must be preserved), same built-in kitchen appliances in place (cooktop stays a cooktop, oven stays an oven at the same location, never replaced by furniture), same radiators in their exact position, same wall outlets and light switches, same ceiling lamp position, same camera angle, same perspective, same focal length, same lens distortion, same natural lighting direction. Only the movable items change: free-standing furniture, soft furnishings, decor accessories, rugs, curtains, artwork on walls, cushions, throws, plants, books, tableware. Wall paint color may be restyled. No construction, no renovation, no structural change whatsoever.`;

/**
 * Negative prompt dédié — aligné mot pour mot sur les craintes du brief :
 * prises, plinthes, fenêtres, portes, sol, radiateurs, four/plaque, murs.
 */
export const HOME_STAGING_NEGATIVE = [
  // Structure
  'moved walls', 'modified walls', 'new walls', 'removed walls',
  'different room shape', 'different ceiling', 'different ceiling height',
  'different camera angle', 'different perspective', 'different lens',
  // Ouvertures
  'moved windows', 'resized windows', 'added windows', 'removed windows',
  'different window frames', 'different window sills', 'different glazing',
  'moved doors', 'different doors', 'different door frames',
  // Finitions non déplaçables
  'removed baseboards', 'different baseboards', 'different skirting',
  'moved outlets', 'removed outlets', 'different light switches',
  'moved radiator', 'removed radiator', 'different radiator',
  'moved ceiling lamp', 'different ceiling light position',
  // Sol (critique — l’utilisateur l’a explicitement demandé)
  'different floor', 'new floor', 'replaced floor', 'changed flooring',
  'different floor material', 'different floor color', 'different floor pattern',
  'new tiles', 'different tiles', 'changed parquet', 'different wood planks',
  // Cuisine / encastré
  'replaced cooktop', 'removed cooktop', 'cooktop replaced by furniture',
  'replaced oven', 'removed oven', 'oven replaced by cabinet',
  'different built-in appliances', 'moved kitchen island',
  // Généraux
  'construction site', 'unfinished renovation', 'under construction',
  'blurry', 'low quality', 'watermark', 'text overlay',
  'deformed', 'cartoon', 'painting', 'illustration', '3d render',
].join(', ');
