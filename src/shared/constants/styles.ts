/**
 * Types de pièces disponibles
 */
export const ROOM_TYPES = [
  { id: 'salon', slug: 'salon', name: 'Salon', icon: '🛋️' },
  { id: 'chambre', slug: 'chambre', name: 'Chambre', icon: '🛏️' },
  { id: 'chambre-enfant', slug: 'chambre-enfant', name: 'Chambre d\'enfant', icon: '🧸' },
  { id: 'cuisine', slug: 'cuisine', name: 'Cuisine', icon: '🍳' },
  { id: 'salle-de-bain', slug: 'salle-de-bain', name: 'Salle de bain', icon: '🚿' },
  { id: 'bureau', slug: 'bureau', name: 'Bureau', icon: '💼' },
  { id: 'salle-a-manger', slug: 'salle-a-manger', name: 'Salle à manger', icon: '🍽️' },
  { id: 'entree', slug: 'entree', name: 'Entrée', icon: '🚪' },
  { id: 'terrasse', slug: 'terrasse', name: 'Terrasse', icon: '🌿' },
] as const;

export type RoomTypeSlug = typeof ROOM_TYPES[number]['slug'];

// Type pour un style de décoration individuel
export type DecorStyle = {
  id: string;
  slug: string;
  name: string;
  desc: string;
};

// Type pour une catégorie avec ses styles
export type DecorStyleCategory = {
  category: string;
  styles: DecorStyle[];
};

/**
 * Styles de décoration organisés par catégories
 * Populaires en France, Belgique et Suisse
 */
export const STYLE_CATEGORIES_WITH_STYLES: DecorStyleCategory[] = [
  {
    category: 'Tendances',
    styles: [
      { id: 'original', slug: 'original', name: 'Garder mon style', desc: 'Améliorer sans changer' },
      { id: 'moderne', slug: 'moderne', name: 'Moderne', desc: 'Lignes épurées, élégance contemporaine' },
      { id: 'minimaliste', slug: 'minimaliste', name: 'Minimaliste', desc: 'Essentiel et apaisant' },
      { id: 'japandi', slug: 'japandi', name: 'Japandi', desc: 'Zen japonais & hygge nordique' },
    ]
  },
  {
    category: 'Classiques',
    styles: [
      { id: 'haussmannien', slug: 'haussmannien', name: 'Haussmannien', desc: 'Parisien chic avec moulures' },
      { id: 'classique', slug: 'classique', name: 'Classique', desc: 'Élégance traditionnelle française' },
      { id: 'artdeco', slug: 'artdeco', name: 'Art Déco', desc: 'Glamour géométrique années 20' },
      { id: 'midcentury', slug: 'midcentury', name: 'Mid-Century', desc: 'Rétro iconique 50-60' },
    ]
  },
  {
    category: 'Chaleureux',
    styles: [
      { id: 'scandinave', slug: 'scandinave', name: 'Scandinave', desc: 'Cocooning nordique lumineux' },
      { id: 'boheme', slug: 'boheme', name: 'Bohème', desc: 'Chaleur éclectique colorée' },
      { id: 'provencal', slug: 'provencal', name: 'Provençal', desc: 'Charme du Sud de la France' },
      { id: 'chalet', slug: 'chalet', name: 'Chalet Alpin', desc: 'Montagne cosy suisse/savoyard' },
    ]
  },
  {
    category: 'Urbains',
    styles: [
      { id: 'industriel', slug: 'industriel', name: 'Industriel', desc: 'Loft urbain brut et moderne' },
      { id: 'contemporain', slug: 'contemporain', name: 'Contemporain', desc: 'Design actuel audacieux' },
      { id: 'loft', slug: 'loft', name: 'Loft New-Yorkais', desc: 'Grand espace urbain chic' },
    ]
  },
  {
    category: 'Nature & Détente',
    styles: [
      { id: 'coastal', slug: 'coastal', name: 'Bord de mer', desc: 'Vacances, bleu et blanc' },
      { id: 'farmhouse', slug: 'farmhouse', name: 'Campagne chic', desc: 'Rustique élégant' },
      { id: 'nature', slug: 'nature', name: 'Nature', desc: 'Organique, bois et plantes' },
      { id: 'zen', slug: 'zen', name: 'Zen', desc: 'Sérénité et méditation' },
    ]
  },
  {
    category: 'Luxe & Audace',
    styles: [
      { id: 'luxe', slug: 'luxe', name: 'Luxe', desc: 'Prestige et matériaux nobles' },
      { id: 'baroque', slug: 'baroque', name: 'Baroque', desc: 'Opulent et théâtral' },
      { id: 'eclectique', slug: 'eclectique', name: 'Éclectique', desc: 'Mix audacieux de styles' },
    ]
  },
  {
    category: 'Spécialisés',
    styles: [
      { id: 'ludique', slug: 'ludique', name: 'Enfant / Ludique', desc: 'Joyeux et stimulant' },
      { id: 'ado', slug: 'ado', name: 'Ado / Jeune', desc: 'Moderne et personnalisé' },
    ]
  },
];

// Liste plate pour compatibilité
export const STYLES: DecorStyle[] = STYLE_CATEGORIES_WITH_STYLES.flatMap(cat => cat.styles);

export type StyleSlug = string;

/**
 * Catégories de styles (pour le regroupement UI)
 */
export const STYLE_CATEGORIES = STYLE_CATEGORIES_WITH_STYLES.map(cat => ({
  slug: cat.category.toLowerCase().replace(/[^a-z]/g, ''),
  name: cat.category,
}));

export type StyleCategorySlug = string;

