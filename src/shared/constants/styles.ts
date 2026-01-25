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

/**
 * Styles de décoration disponibles avec descriptions
 */
export const STYLES = [
  { id: 'moderne', slug: 'moderne', name: 'Moderne', desc: 'Élégance contemporaine sophistiquée' },
  { id: 'minimaliste', slug: 'minimaliste', name: 'Minimaliste', desc: 'Simplicité scandinave épurée' },
  { id: 'boheme', slug: 'boheme', name: 'Bohème', desc: 'Chaleur éclectique globe-trotter' },
  { id: 'industriel', slug: 'industriel', name: 'Industriel', desc: 'Loft urbain brut et raffiné' },
  { id: 'classique', slug: 'classique', name: 'Classique', desc: 'Élégance traditionnelle intemporelle' },
  { id: 'japandi', slug: 'japandi', name: 'Japandi', desc: 'Zen japonais & cocooning nordique' },
  { id: 'midcentury', slug: 'midcentury', name: 'Mid-Century', desc: 'Rétro iconique années 50-60' },
  { id: 'coastal', slug: 'coastal', name: 'Coastal', desc: 'Bord de mer relaxant et lumineux' },
  { id: 'farmhouse', slug: 'farmhouse', name: 'Farmhouse', desc: 'Charme rustique contemporain' },
  { id: 'artdeco', slug: 'artdeco', name: 'Art Déco', desc: 'Glamour opulent années 1920' },
] as const;

export type StyleSlug = typeof STYLES[number]['slug'];

/**
 * Catégories de styles (pour le regroupement UI)
 */
export const STYLE_CATEGORIES = [
  { slug: 'moderne', name: 'Moderne' },
  { slug: 'classique', name: 'Classique' },
  { slug: 'contemporain', name: 'Contemporain' },
  { slug: 'minimaliste', name: 'Minimaliste' },
  { slug: 'industriel', name: 'Industriel' },
  { slug: 'scandinave', name: 'Scandinave' },
  { slug: 'boheme', name: 'Bohème' },
  { slug: 'luxe', name: 'Luxe' },
] as const;

export type StyleCategorySlug = typeof STYLE_CATEGORIES[number]['slug'];

