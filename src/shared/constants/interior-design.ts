/**
 * Source unique de vérité — descriptions déco (style / pièce / mobilier) pour
 * la construction des prompts IA, partagée par TOUS les providers et routes :
 *   - FalImageGeneratorService (Flux)
 *   - GeminiImageGeneratorService (Nano Banana)
 *   - /api/trial/generate (essai gratuit)
 *
 * Avant ce module, ces maps étaient dupliquées (et désynchronisées) entre la route
 * d'essai et gemini-image-presets. On centralise ici les DESCRIPTIONS en anglais
 * (meilleure adhérence Flux + Gemini) ainsi que les helpers de lookup tolérants.
 *
 * Les suffixes qualité / negative restent par-provider (FLUX_* dans flux-presets,
 * GEMINI_* dans gemini-image-presets) car ils encodent les spécificités de chaque
 * moteur ; seules les données déco communes vivent ici.
 */

/** Modes de transformation supportés par les providers. */
export type TransformMode = 'full_redesign' | 'keep_layout' | 'decor_only' | 'home_staging';

/**
 * Descriptions de style en anglais — version canonique (la plus détaillée).
 * Utilisée telle quelle par Flux et Gemini pour décrire l'ambiance cible.
 */
export const STYLE_DESCRIPTIONS: Record<string, string> = {
  moderne:
    'contemporary modern interior, clean architectural lines, matte white walls, warm neutral upholstery, light hardwood floors, sculptural low-profile furniture, recessed LED and geometric pendant lighting',
  scandinave:
    'Scandinavian hygge interior, warm white textured walls, light oak plank floors, bouclé upholstery, sheepskin throws draped over furniture, clustered white candles, woven wool area rug, pendant globe lights, soft cream palette',
  boheme:
    'bohemian interior, layered Persian and kilim rugs, macramé wall hangings, abundant trailing indoor plants, rattan and wicker furniture, terracotta and ochre palette, vintage brass lanterns, embroidered cushions',
  japandi:
    'Japandi interior, wabi-sabi handcrafted ceramics, light ash wood furniture, dried pampas grass, neutral linen textiles, paper lantern pendants, muted earth tones, organic natural textures',
  industriel:
    'industrial loft interior, exposed red brick accent wall, black steel frame elements, Edison filament bulb pendant cluster, raw concrete floor, aged brown leather Chesterfield sofa, matte black pipe shelving',
  minimaliste:
    'ultra-minimalist interior, pure white space with warm wood accents, essential furniture only, generous negative space, monochrome palette, Japanese-inspired serenity, soft diffused light',
  haussmannien:
    'classic Parisian Haussmannian interior, ornate plaster crown moldings, herringbone oak parquet, white marble fireplace, floor-to-ceiling French windows, crystal chandelier, navy velvet upholstery',
  artdeco:
    'Art Deco interior, bold geometric patterns and brass inlays, emerald green velvet tufted seating, black lacquered surfaces, sunburst mirrors, dramatic pendant lighting, jewel tones with gold',
  midcentury:
    'mid-century modern interior, Eames-inspired organic forms, warm teak and walnut wood, tapered legs, mustard and olive palette, Nelson bubble pendant, bold abstract art on walls',
  coastal:
    'coastal interior, ocean blue and sandy white palette, whitewashed shiplap paneling, woven seagrass pendants, natural linen slipcovers, weathered driftwood accents, sisal rug, sheer curtains',
  luxe:
    'luxury interior, book-matched Calacatta marble surfaces, polished brass fixtures, deep velvet upholstery, crystal chandelier, champagne gold accents, plush mohair throws, sculptural art objects',
};

/** Description de repli quand le slug de style est inconnu. */
export const DEFAULT_STYLE_DESCRIPTION =
  'modern minimalist interior, clean lines, neutral tones, contemporary furniture';

/** Libellés anglais des pièces (pour intégration dans le prompt). */
export const ROOM_LABELS: Record<string, string> = {
  salon: 'living room',
  chambre: 'bedroom',
  cuisine: 'kitchen',
  'salle-de-bain': 'bathroom',
  bureau: 'home office',
  'salle-a-manger': 'dining room',
};

/** Libellé de pièce par défaut. */
export const DEFAULT_ROOM_LABEL = 'living room';

/** Mobilier attendu par type de pièce (pour les prompts qui meublent la scène). */
export const ROOM_FURNITURE: Record<string, string> = {
  salon: 'designer sofa, sculptural coffee table, accent armchair, bookshelf, floor lamp',
  chambre: 'upholstered bed with layered bedding, nightstands with lamps, elegant wardrobe',
  cuisine: 'premium cabinetry, stone countertops, integrated appliances, pendant-lit island',
  'salle-de-bain': 'floating vanity, backlit mirror, rainfall shower, premium fixtures',
  bureau: 'executive desk, ergonomic chair, open shelving, task and ambient lighting',
  'salle-a-manger': 'dining table set for six, designer chairs, sideboard, overhead pendant',
};

/** Mobilier par défaut. */
export const DEFAULT_ROOM_FURNITURE = 'beautiful designer furniture';

/** Lookup tolérant : description de style (normalise la casse, repli si inconnu). */
export function getStyleDescription(styleSlug?: string): string {
  if (!styleSlug) return DEFAULT_STYLE_DESCRIPTION;
  return STYLE_DESCRIPTIONS[styleSlug.toLowerCase()] || DEFAULT_STYLE_DESCRIPTION;
}

/** Lookup tolérant : libellé anglais de la pièce. */
export function getRoomLabel(roomType?: string): string {
  if (!roomType) return DEFAULT_ROOM_LABEL;
  return ROOM_LABELS[roomType.toLowerCase()] || DEFAULT_ROOM_LABEL;
}

/** Lookup tolérant : mobilier de la pièce. */
export function getRoomFurniture(roomType?: string): string {
  if (!roomType) return DEFAULT_ROOM_FURNITURE;
  return ROOM_FURNITURE[roomType.toLowerCase()] || DEFAULT_ROOM_FURNITURE;
}
