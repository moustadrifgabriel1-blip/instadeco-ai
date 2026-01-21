/**
 * Export de tous les composants de la couche Presentation
 */

// Composants
export { GenerationCardV2 } from './GenerationCardV2';
export { GenerationGallery } from './GenerationGallery';
export { CreditsDisplayV2, CreditsDisplayCompact } from './CreditsDisplayV2';
export { CreditsPurchase } from './CreditsPurchase';
export { GenerateForm } from './GenerateForm';

// Re-export des types pour faciliter l'import
export type {
  GenerationCardProps,
  GenerationGalleryProps,
  CreditsDisplayProps,
  CreditsPurchaseProps,
  GenerateFormProps,
  CreditPack,
  CreditPackId,
} from '@/src/presentation/types';
