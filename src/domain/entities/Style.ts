/**
 * Entité Style
 * Représente un style de décoration disponible
 */
export interface Style {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly promptTemplate: string;
  readonly thumbnailUrl: string;
  readonly category: StyleCategory;
  readonly isPremium: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;
}

export type StyleCategory = 
  | 'moderne'
  | 'classique'
  | 'contemporain'
  | 'minimaliste'
  | 'industriel'
  | 'scandinave'
  | 'boheme'
  | 'luxe';

export interface CreateStyleInput {
  slug: string;
  name: string;
  description: string;
  promptTemplate: string;
  thumbnailUrl: string;
  category: StyleCategory;
  isPremium?: boolean;
  sortOrder?: number;
}
