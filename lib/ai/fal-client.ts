import Replicate from 'replicate';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Client Replicate
const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN,
});

// Modèle Flux.1 avec ControlNet sur Replicate
// ControlNet Canny préserve les contours (murs, fenêtres, structure)
// ControlNet Depth préserve la profondeur de la pièce
const REPLICATE_MODEL = 'black-forest-labs/flux-1.1-pro-ultra';
const REPLICATE_CONTROLNET_MODEL = 'black-forest-labs/flux-canny-pro';

// ============================================
// TYPES
// ============================================

export interface FalGenerationOptions {
  /** URL de l'image source (conditioning image) */
  imageUrl: string;
  /** Type de pièce (salon, chambre, cuisine, etc.) */
  roomType: string;
  /** Style de décoration (boheme, minimaliste, industriel, etc.) */
  style: string;
  /** Mode ControlNet: canny (contours) ou depth (profondeur) */
  controlMode?: 'canny' | 'depth';
  /** Force de l'image source (0.0 à 1.0) - plus élevé = plus fidèle */
  imageStrength?: number;
  /** Nombre d'étapes d'inférence (plus = meilleure qualité) */
  numInferenceSteps?: number;
  /** Guidance scale (adhérence au prompt) */
  guidanceScale?: number;
  /** Mode de transformation (full_redesign, keep_layout, decor_only) */
  transformMode?: TransformMode;
}

export interface FalGenerationResponse {
  requestId: string;
  status: string;
}

export interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress?: number;
  images?: Array<{ url: string; content_type?: string }>;
  error?: string;
}

export interface FalResultResponse {
  images: Array<{ url: string; width: number; height: number }>;
  timings?: { inference: number };
  seed?: number;
  prompt?: string;
}

// ============================================
// PROMPT TEMPLATE PROFESSIONNEL V2
// ============================================

/**
 * Options de personnalisation pour la génération
 */
export interface GenerationOptions {
  mode: 'full_redesign' | 'keep_layout' | 'decor_only';
  keepExistingFurniture?: boolean;
  focusAreas?: ('furniture' | 'decor' | 'lighting' | 'colors' | 'layout')[];
}

// Mode de transformation par défaut
export type TransformMode = 'full_redesign' | 'keep_layout' | 'decor_only';

// Instructions spécifiques par mode de transformation
export const TRANSFORM_MODE_INSTRUCTIONS = {
  full_redesign: {
    name: 'Transformation complète',
    instruction: `COMPLETE TRANSFORMATION MODE:
- REMOVE ALL existing furniture completely from the scene
- ADD entirely NEW furniture pieces matching the requested style
- CHANGE all decorative elements (art, plants, accessories)
- NEW lighting fixtures and lamps
- FRESH textiles (curtains, rugs, pillows)
- Only PRESERVE: walls, windows, doors, ceiling, floor structure`,
    negative: 'existing furniture, original furniture, same furniture, minor changes, subtle modifications, keeping current items',
  },
  
  keep_layout: {
    name: 'Conserver la disposition',
    instruction: `KEEP LAYOUT - NEW FURNITURE MODE:
- PRESERVE the exact furniture POSITIONS and LAYOUT
- REPLACE furniture with NEW pieces of SIMILAR SIZE at SAME LOCATIONS
- Sofa stays where sofa is, table stays where table is, etc.
- UPDATE style of furniture to match requested aesthetic
- Change decorative elements, textiles, and accessories
- Maintain room flow and traffic patterns`,
    negative: 'moving furniture, rearranging, different layout, empty spaces where furniture was',
  },
  
  decor_only: {
    name: 'Décoration uniquement',
    instruction: `DECOR-ONLY MODE:
- KEEP ALL existing furniture pieces EXACTLY as they are
- DO NOT change or replace any furniture
- ONLY modify: wall art, plants, decorative accessories
- ADD: new lighting fixtures, throw pillows, blankets
- CHANGE: curtains, rugs, small decorative items
- UPDATE color scheme through accessories only
- Furniture shape, color, and position stay IDENTICAL`,
    negative: 'new furniture, replacing furniture, different furniture, furniture change, modified furniture',
  },
} as const;

/**
 * Génère le prompt optimisé pour la décoration d'intérieur
 * Ces prompts sont conçus pour produire une TRANSFORMATION COMPLÈTE
 * avec du mobilier et de la décoration ENTIÈREMENT NOUVEAUX
 * tout en préservant la structure architecturale (murs, fenêtres, proportions)
 * 
 * IMPORTANT: Le prompt inclut des contraintes strictes pour éviter
 * que l'IA sorte du cadre de la photo originale
 * 
 * @param roomType - Type de pièce (living room, bedroom, etc.)
 * @param styleKey - Clé du style de décoration (boheme, minimaliste, etc.)
 * @param transformMode - Mode de transformation (full_redesign, keep_layout, decor_only)
 */
export function buildInteriorDesignPrompt(
  roomType: string, 
  styleKey: string,
  transformMode: TransformMode = 'full_redesign'
): string {
  // Récupérer le méga-prompt spécifique au style
  const stylePrompt = MEGA_STYLE_PROMPTS[styleKey as DecorationStyle] || MEGA_STYLE_PROMPTS.moderne;
  
  // Récupérer les instructions du mode de transformation
  const modeInstructions = TRANSFORM_MODE_INSTRUCTIONS[transformMode];
  
  // Instructions de base pour RESTER DANS LE CADRE - RENFORCÉES
  const frameConstraints = `
⚠️ ABSOLUTE FRAME BOUNDARIES - CRITICAL ⚠️
The input image defines EXACT boundaries. You MUST NOT generate ANY content outside these boundaries.

FORBIDDEN ACTIONS (will result in failure):
❌ DO NOT extend walls beyond the visible edges
❌ DO NOT add new walls, columns, or architectural elements on the sides
❌ DO NOT generate plants, furniture, or decor outside the original frame
❌ DO NOT change the perspective or camera angle
❌ DO NOT zoom out or expand the visible area
❌ DO NOT add content where the original image ends

MANDATORY CONSTRAINTS:
✅ Work ONLY within the exact pixel boundaries of the input image
✅ Keep all 4 edges (top, bottom, left, right) exactly as they appear
✅ Preserve the exact camera position and field of view
✅ If an edge of the room is cut off in the original, keep it cut off
✅ Transform ONLY what is visible in the original photograph
✅ The output must have IDENTICAL framing to the input`;

  // Adapter le contenu du prompt en fonction du mode
  let furnitureSection = '';
  let decorSection = '';
  
  if (transformMode === 'full_redesign') {
    furnitureSection = `FURNITURE TO ADD (inspired by real European furniture brands style):
${stylePrompt.furniture}`;
    decorSection = `DECORATION ELEMENTS:
${stylePrompt.decor}`;
  } else if (transformMode === 'keep_layout') {
    furnitureSection = `REPLACEMENT FURNITURE (same positions, new style):
${stylePrompt.furniture}
IMPORTANT: Replace furniture at EXACT SAME LOCATIONS, matching approximate sizes`;
    decorSection = `NEW DECORATION ELEMENTS:
${stylePrompt.decor}`;
  } else if (transformMode === 'decor_only') {
    furnitureSection = `KEEP ALL EXISTING FURNITURE - DO NOT CHANGE`;
    decorSection = `ADD/CHANGE DECORATIVE ELEMENTS ONLY:
${stylePrompt.decor}
- New wall art and frames
- New plants and greenery
- New throw pillows and blankets
- New small accessories and vases
- Updated curtains or blinds
- New rugs (if appropriate)`;
  }

  // Construire le prompt complet avec emphase sur la TRANSFORMATION
  return `[INPAINTING MODE] Transform the interior of this ${roomType} photograph. ${stylePrompt.prompt}.

IMPORTANT: This is an INPAINTING task. You must ONLY modify content WITHIN the existing photograph boundaries. Do NOT extend or expand the image in any direction.

${frameConstraints}

${modeInstructions.instruction}

${furnitureSection}

${decorSection}

COLOR PALETTE: ${stylePrompt.colors}
LIGHTING MOOD: ${stylePrompt.lighting}
FLOORING STYLE: ${transformMode === 'decor_only' ? 'KEEP EXISTING FLOOR' : stylePrompt.flooring}
TEXTILES & FABRICS: ${stylePrompt.textiles}
PLANTS & GREENERY: ${stylePrompt.plants}

STRICT PRESERVATION:
- Keep exact wall positions and boundaries
- Keep exact window positions, sizes, and frames
- Keep exact door positions
- Keep room proportions and ceiling height
- Keep floor area exactly as visible in original photo
- Keep same natural lighting direction from windows
- DO NOT add any content outside the original photo edges

STYLE REFERENCE: ${stylePrompt.description}

QUALITY: Ultra photorealistic interior design photography, professional architectural photography. Perfect composition strictly within ORIGINAL FRAME BOUNDARIES, cinematic natural lighting, high-end European furniture showroom quality.`;
}

/**
 * Méga-prompts détaillés pour chaque style de décoration
 * Avec références à des styles de meubles inspirés des grandes enseignes
 * (IKEA, Maisons du Monde, Habitat, AM.PM, La Redoute Intérieurs)
 */
export const MEGA_STYLE_PROMPTS = {
  boheme: {
    description: 'Bohemian Chic - Free-spirited eclectic warmth with global influences',
    prompt: 'Transform into a warm bohemian sanctuary with layered textures and global artisan pieces. Style inspired by Maisons du Monde Nomade and La Redoute ethnic collections',
    furniture: 'low mango wood coffee table with carved details, natural rattan peacock armchair, floor poufs with kilim patterns, vintage-style wooden sideboard with cane doors, hanging egg chair in natural rattan, low platform daybed with linen cushions, IKEA STOCKHOLM style rattan pieces',
    decor: 'macramé wall hangings, layered vintage-style Moroccan rugs, brass Moroccan lanterns, woven seagrass baskets on walls, global artisan pottery in terracotta, beaded curtains, ornate mirrors with distressed gold frames, ethnic textile wall art',
    colors: 'warm terracotta, burnt orange, mustard yellow, deep rust, off-white cream, sage green, golden honey tones',
    lighting: 'warm ambient string lights, rattan pendant lamps like IKEA SINNERLIG, brass floor lamps, cluster of pillar candles, soft diffused golden glow',
    flooring: 'natural jute sisal rugs layered over wooden floors, vintage-style Persian runner',
    textiles: 'velvet throw pillows in jewel tones, chunky knit blankets, embroidered ethnic cushions, tasseled cotton throws, ikat pattern fabrics',
    plants: 'abundant trailing pothos on shelves, large fiddle leaf fig in woven basket, snake plants in terracotta pots, dried pampas grass in ceramic vases, eucalyptus branches',
  },
  
  minimaliste: {
    description: 'Minimalist Scandinavian - Clean serenity with functional elegance',
    prompt: 'Transform into a serene minimalist Scandinavian space. Style inspired by IKEA, HAY, Muuto, and Nordic design principles',
    furniture: 'streamlined light oak 3-seater sofa with clean lines like IKEA LANDSKRONA, wishbone-style dining chairs, floating white wall shelves, minimal oak TV console like IKEA BESTA, sculptural round coffee table, low platform bed with hidden storage, slim Scandinavian dining table',
    decor: 'single large abstract art print in neutral tones, minimal white ceramic vases, simple geometric brass sculptures, one large round mirror with thin black frame, carefully curated coffee table books, subtle wall-mounted reading lights',
    colors: 'pure white walls, warm greige accents, soft dove grey upholstery, natural blonde oak wood, minimal black metal accents',
    lighting: 'maximized natural daylight, sleek white pendant lights like MUUTO style, minimal arc floor lamp, hidden LED strips, sheer white curtains',
    flooring: 'light blonde oak wide plank floors, single cream wool area rug with subtle texture',
    textiles: 'natural linen curtains and cushions, bouclé texture sofa throw, cream cashmere blanket, crisp white cotton bedding',
    plants: 'single large monstera deliciosa or olive tree in minimal white pot, one small succulent arrangement',
  },
  
  industriel: {
    description: 'Industrial Modern - Raw urban loft with refined edge',
    prompt: 'Transform into an authentic industrial loft with exposed materials and urban sophistication. Style inspired by Maisons du Monde Factory collection and AM.PM industrial range',
    furniture: 'distressed leather Chesterfield sofa, reclaimed wood dining table with metal legs, vintage factory cart coffee table, metal and wood open shelving, industrial bar stools, Edison-style pendant clusters, rolling metal side tables',
    decor: 'exposed brick walls, metal wall art, vintage factory clocks, old maps and blueprints, antique gears, wire cage pendant lights, concrete planters, black framed mirrors',
    colors: 'charcoal grey, rust orange, matte black, aged bronze, warm wood tones, exposed concrete grey',
    lighting: 'Edison bulb pendant clusters, vintage factory lamps, exposed conduit lighting, metal cage fixtures, warm tungsten glow',
    flooring: 'polished concrete with area rugs, dark stained wide plank wood, industrial rubber mats',
    textiles: 'aged leather, heavy canvas, wool blankets, burlap accents, raw linen',
    plants: 'succulents in concrete planters, tall cacti, snake plants in metal containers',
  },
  
  moderne: {
    description: 'Modern Contemporary - Sophisticated current luxury',
    prompt: 'Transform into a sophisticated modern space with current trends and elegant simplicity',
    furniture: 'curved velvet sofa in neutral tone, sculptural accent chairs, travertine coffee table, fluted wood sideboard, bouclé armchairs, glass and brass side tables, upholstered platform bed',
    decor: 'large scale abstract art, sculptural vases, coffee table books, marble accessories, designer objects, statement mirrors, curated art gallery wall',
    colors: 'warm white, taupe, soft camel, cream, black accents, gold metallic touches',
    lighting: 'statement sculptural chandelier, architectural floor lamps, LED strip ambient, large format table lamps',
    flooring: 'herringbone oak parquet, plush wool area rugs in neutral tones',
    textiles: 'bouclé fabric, velvet cushions, cashmere throws, silk curtains, high-thread-count linens',
    plants: 'architectural fiddle leaf fig, birds of paradise, monstera in designer ceramic planters',
  },
  
  classique: {
    description: 'Classic Elegant - Timeless refined sophistication',
    prompt: 'Transform into a timeless classic interior with traditional elegance and refined details',
    furniture: 'tufted Chesterfield sofa, wingback chairs, French Louis XVI armchairs, ornate carved wood coffee table, antique secretary desk, four-poster bed, crystal-topped dining table',
    decor: 'ornate gilded mirrors, classical oil paintings, crystal chandeliers, antique clocks, porcelain vases, decorative moldings, damask patterns, classical sculptures',
    colors: 'deep navy blue, burgundy, forest green, cream, gold accents, warm wood mahogany',
    lighting: 'crystal chandeliers, brass wall sconces, silk-shaded table lamps, candlestick fixtures',
    flooring: 'dark wood parquet floors, Persian or Aubusson rugs, marble tile in entryways',
    textiles: 'silk damask, velvet upholstery, brocade curtains, tasseled trim, embroidered pillows',
    plants: 'formal arrangements in classical urns, topiaries, orchids in porcelain cachepots',
  },
  
  japandi: {
    description: 'Japandi Fusion - Japanese minimalism meets Scandinavian warmth',
    prompt: 'Transform into a harmonious Japandi space blending Japanese zen with Nordic coziness',
    furniture: 'low platform sofa, shoji screen room dividers, tatami-inspired seating, simple wooden dining table, meditation floor cushions, minimal floating shelves, futon-style bed on low platform',
    decor: 'ceramic ikebana vases, wabi-sabi pottery, paper lanterns, bamboo accents, zen rock gardens, calligraphy art, natural wood sculptures, minimal artwork',
    colors: 'soft white, warm beige, charcoal, forest green, natural wood tones, muted sage',
    lighting: 'paper lantern pendants, natural daylight emphasis, warm minimal fixtures, candle light',
    flooring: 'light natural wood, tatami mat areas, simple wool rugs in earth tones',
    textiles: 'linen in natural colors, cotton throws, wool blankets, simple cotton curtains',
    plants: 'bonsai trees, bamboo arrangements, simple single stem ikebana, zen moss gardens',
  },
  
  midcentury: {
    description: 'Mid-Century Modern - Iconic retro sophistication',
    prompt: 'Transform into an authentic mid-century modern interior with iconic furniture and retro warmth',
    furniture: 'Eames lounge chair and ottoman, teak sideboard, tulip dining table, egg chair, Nelson bench, Noguchi coffee table, Danish teak bed frame, molded plastic chairs',
    decor: 'sunburst mirrors, abstract expressionist art, atomic age clocks, vintage globe bar, Calder-style mobiles, ceramic starburst wall art, vintage radios',
    colors: 'mustard yellow, burnt orange, olive green, teak brown, cream, black, turquoise accents',
    lighting: 'Sputnik chandeliers, arc floor lamps, mushroom table lamps, globe pendants, colored glass fixtures',
    flooring: 'warm teak or walnut wood floors, shag area rugs, geometric pattern carpets',
    textiles: 'tweed upholstery, bold geometric prints, velvet in jewel tones, textured wool',
    plants: 'fiddle leaf figs, rubber plants, spider plants in ceramic planters, terrariums',
  },
  
  coastal: {
    description: 'Coastal Beach - Relaxed seaside elegance',
    prompt: 'Transform into a breezy coastal retreat with ocean-inspired tranquility',
    furniture: 'white slipcovered sofa, driftwood coffee table, wicker armchairs, light wood dining table, rope-wrapped mirrors, weathered wood console, white four-poster bed with sheer canopy',
    decor: 'coral sculptures, nautical rope accents, seashell collections, blue glass vases, coastal artwork, vintage maps, ship wheels, lighthouse prints, driftwood art',
    colors: 'ocean blue, seafoam green, sandy beige, crisp white, soft coral, weathered grey',
    lighting: 'natural abundant sunlight, rope-wrapped pendants, lantern-style fixtures, seashell chandeliers',
    flooring: 'whitewashed wide plank floors, sisal area rugs, blue and white striped runners',
    textiles: 'white linen, blue and white stripes, light cotton, rope textures, nautical prints',
    plants: 'palm fronds, succulents, air plants, sea grass arrangements, tropical leaves',
  },
  
  farmhouse: {
    description: 'Modern Farmhouse - Rustic charm with contemporary comfort',
    prompt: 'Transform into a warm modern farmhouse with rustic character and cozy appeal',
    furniture: 'farmhouse dining table with bench seating, slipcovered linen sofa, reclaimed wood coffee table, vintage barn door, apron front sink, shiplap accent walls, spindle-back chairs, wrought iron bed frame',
    decor: 'galvanized metal accents, vintage signage, mason jar arrangements, antique scales, farm animal prints, vintage pitchers, wooden cutting boards, enamelware',
    colors: 'warm white, sage green, black accents, natural wood tones, soft blue, cream',
    lighting: 'black iron chandeliers, mason jar pendants, lantern-style sconces, vintage barn lights',
    flooring: 'wide plank distressed wood, natural fiber rugs, black and white checkered tile',
    textiles: 'buffalo check, ticking stripe, grain sack fabric, cotton throws, linen curtains',
    plants: 'lavender bundles, eucalyptus garlands, potted herbs, cotton stems, fresh wildflowers in pitchers',
  },
  
  artdeco: {
    description: 'Art Deco Glamour - 1920s opulent elegance',
    prompt: 'Transform into a glamorous Art Deco interior with geometric luxury and golden age sophistication',
    furniture: 'curved velvet sofa, lacquered cocktail cabinet, geometric mirrored furniture, channel-tufted chairs, glass and chrome coffee table, sunburst console, upholstered headboard with geometric pattern',
    decor: 'sunburst mirrors, geometric wall art, crystal decanters, gold geometric sculptures, chevron patterns, fan motifs, vintage glamour photography, peacock feathers',
    colors: 'emerald green, sapphire blue, gold, black lacquer, cream, blush pink, chrome silver',
    lighting: 'tiered crystal chandeliers, wall sconces with geometric shades, gold floor lamps, backlit glass panels',
    flooring: 'black and white marble checkerboard, geometric patterned rugs, dark polished wood',
    textiles: 'velvet in jewel tones, silk with geometric prints, faux fur throws, metallic accents',
    plants: 'dramatic palms, orchids in gold planters, birds of paradise in art deco vases',
  },
} as const;

/**
 * Prompt négatif pour éviter les artefacts courants
 * @param transformMode - Mode de transformation pour ajouter des négatifs spécifiques
 */
export function getNegativePrompt(transformMode: TransformMode = 'full_redesign'): string {
  const baseNegative = 'blurry, low quality, distorted, deformed, ugly, bad proportions, watermark, text, logo, cartoon, anime, illustration, painting, drawing, unrealistic, oversaturated, extending beyond frame, cropped differently, different camera angle, different perspective';
  
  const modeSpecificNegative = TRANSFORM_MODE_INSTRUCTIONS[transformMode]?.negative || '';
  
  return `${baseNegative}, ${modeSpecificNegative}`;
}

/**
 * Prompt négatif de base (pour compatibilité)
 */
export const NEGATIVE_PROMPT = 'blurry, low quality, distorted, deformed, ugly, bad proportions, watermark, text, logo, cartoon, anime, illustration, painting, drawing, unrealistic, oversaturated, keeping existing furniture, same furniture different color, minor changes only, subtle modifications';

// ============================================
// STYLES DE DÉCORATION DISPONIBLES
// ============================================

export const DECORATION_STYLES = {
  boheme: 'boheme',
  minimaliste: 'minimaliste',
  industriel: 'industriel',
  moderne: 'moderne',
  classique: 'classique',
  japandi: 'japandi',
  midcentury: 'midcentury',
  coastal: 'coastal',
  farmhouse: 'farmhouse',
  artdeco: 'artdeco',
} as const;

export type DecorationStyle = keyof typeof DECORATION_STYLES;

// ============================================
// TYPES DE PIÈCES
// ============================================

export const ROOM_TYPES = {
  salon: 'living room',
  chambre: 'bedroom',
  cuisine: 'kitchen',
  'salle-de-bain': 'bathroom',
  bureau: 'home office',
  'salle-a-manger': 'dining room',
  entree: 'entryway',
  terrasse: 'terrace',
} as const;

export type RoomType = keyof typeof ROOM_TYPES;

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Soumettre une génération à Fal.ai avec ControlNet
 * L'image source est utilisée comme conditioning image pour préserver
 * la structure des murs et fenêtres à 100%
 */
export async function submitGeneration(
  options: FalGenerationOptions
): Promise<FalGenerationResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN non configurée');
  }

  // Traduire le type de pièce si c'est une clé connue
  const roomTypeEnglish = ROOM_TYPES[options.roomType as RoomType] || options.roomType;
  
  // Enrichir le style si c'est une clé connue
  const styleDescription = DECORATION_STYLES[options.style as DecorationStyle] || options.style;
  
  // Mode de transformation (défaut: full_redesign)
  const transformMode = options.transformMode || 'full_redesign';
  
  // Construire le prompt professionnel avec le mode de transformation
  const prompt = buildInteriorDesignPrompt(roomTypeEnglish, styleDescription, transformMode);
  
  console.log('[Replicate] Submitting generation with transform mode:', transformMode);
  console.log('[Replicate] Prompt:', prompt);
  console.log('[Replicate] Conditioning image:', options.imageUrl.substring(0, 50) + '...');
  console.log('[Replicate] Control mode:', options.controlMode || 'canny');

  try {
    // Utiliser Flux Canny Pro pour le ControlNet
    // La guidance contrôle l'adhérence au prompt
    // Le ControlNet Canny préserve les contours/structure
    const prediction = await replicate.predictions.create({
      model: 'black-forest-labs/flux-canny-pro',
      input: {
        // Prompt principal - MEGA PROMPT pour transformation complète
        prompt: prompt,
        
        // IMAGE SOURCE = CONTROL IMAGE (préserve structure/murs/fenêtres)
        control_image: options.imageUrl,
        
        // Paramètres optimisés pour RESPECT DU CADRE + TRANSFORMATION
        steps: 50, // Maximum pour meilleure qualité
        guidance: 20, // Réduit de 30→20 pour mieux respecter l'image source
        
        // Paramètres supplémentaires si supportés par le modèle
        // control_strength: 0.9, // Force du ControlNet (plus = plus fidèle à la structure)
      },
    });

    console.log('[Replicate] Prediction created:', prediction.id);
    
    return {
      requestId: prediction.id,
      status: prediction.status.toUpperCase(),
    };
  } catch (error) {
    console.error('[Replicate] API error:', error);
    throw new Error(`Replicate API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Vérifier le statut d'une génération
 */
export async function checkGenerationStatus(
  requestId: string
): Promise<FalStatusResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN non configurée');
  }

  try {
    const prediction = await replicate.predictions.get(requestId);
    
    console.log('[Replicate] Status:', prediction.status);
    
    // Mapper les statuts Replicate vers notre format
    const statusMap: Record<string, FalStatusResponse['status']> = {
      'starting': 'IN_QUEUE',
      'processing': 'IN_PROGRESS',
      'succeeded': 'COMPLETED',
      'failed': 'FAILED',
      'canceled': 'FAILED',
    };

    return {
      status: statusMap[prediction.status] || 'IN_PROGRESS',
      progress: prediction.status === 'processing' ? 50 : undefined,
      images: prediction.status === 'succeeded' && prediction.output
        ? [{ url: Array.isArray(prediction.output) ? prediction.output[0] : prediction.output }]
        : undefined,
      error: typeof prediction.error === 'string' ? prediction.error : undefined,
    };
  } catch (error) {
    console.error('[Replicate] Status check error:', error);
    throw new Error(`Replicate status check error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Récupérer le résultat d'une génération terminée
 */
export async function getGenerationResult(requestId: string): Promise<FalResultResponse> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN non configurée');
  }

  try {
    const prediction = await replicate.predictions.get(requestId);
    
    if (prediction.status !== 'succeeded') {
      throw new Error(`Generation not completed. Status: ${prediction.status}`);
    }

    const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    
    console.log('[Replicate] Generation complete. Image URL:', imageUrl);
    
    return {
      images: [{ 
        url: imageUrl,
        width: 1024,
        height: 768,
      }],
      timings: prediction.metrics?.predict_time ? { inference: prediction.metrics.predict_time } : undefined,
      seed: undefined,
      prompt: undefined,
    };
  } catch (error) {
    console.error('[Replicate] Result fetch error:', error);
    throw new Error(`Replicate result fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

/**
 * Fonction utilitaire pour générer une image de décoration d'intérieur
 * Combine toutes les étapes en une seule fonction
 * Utilise Replicate.ai avec Flux.1 Canny Pro (ControlNet)
 */
export async function generateInteriorDesign(options: {
  imageUrl: string;
  roomType: string;
  style: string;
  controlMode?: 'canny' | 'depth';
}): Promise<FalGenerationResponse> {
  return submitGeneration({
    imageUrl: options.imageUrl,
    roomType: options.roomType,
    style: options.style,
    controlMode: options.controlMode || 'canny',
    imageStrength: 0.85, // 85% fidèle à la structure originale
    numInferenceSteps: 28,
    guidanceScale: 7.5,
  });
}
