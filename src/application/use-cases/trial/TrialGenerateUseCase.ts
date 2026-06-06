/**
 * Use Case : Génération d'essai gratuit (non authentifié).
 *
 * AVANT : app/api/trial/generate/route.ts appelait fal.storage + fal.run EN DUR,
 * court-circuitant la clean architecture, le DI container et le provider factory
 * (IMAGE_PROVIDER). Conséquence : l'essai ne profitait ni de Gemini, ni du garde
 * anti-SSRF, ni des presets centralisés.
 *
 * MAINTENANT : on passe par IImageGeneratorService (injecté via le factory), donc :
 *   - respect d'IMAGE_PROVIDER (fal | gemini),
 *   - garde anti-SSRF + presets Flux/Gemini centralisés,
 *   - comportement SYNCHRONE préservé (le service fait fal.run(), pas de queue).
 *
 * L'anti-abus (rate-limit IP + fingerprint + trial_usage) reste dans la route HTTP :
 * c'est une préoccupation transport/IP, pas une règle métier de génération.
 *
 * Le mode est forcé à `full_redesign`, comme l'essai historique (strength 0.72,
 * guidance/nag/nag_end full_redesign appliqués par le service).
 */
import { Result, success, failure } from '@/src/shared/types/Result';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { getImageDimensionsFromBase64 } from '@/src/shared/utils/image-size';
import {
  getRoomFurniture,
  getRoomLabel,
  getStyleDescription,
} from '@/src/shared/constants/interior-design';

export interface TrialGenerateInput {
  /** Image source en data URI base64 (validée en amont par la route). */
  imageBase64: string;
  /** Slug de style (ex: moderne, japandi). */
  style: string;
  /** Slug de pièce (ex: salon, cuisine). */
  roomType: string;
}

export interface TrialGenerateOutput {
  imageUrl: string;
}

/**
 * Prompt de base de l'essai (full_redesign), SANS suffixe qualité provider :
 * le suffixe (FLUX_QUALITY_SUFFIX / GEMINI_QUALITY_SUFFIX) est ajouté par le
 * service du provider sélectionné — l'ajouter ici le doublerait.
 */
export function buildTrialBasePrompt(style: string, roomType: string): string {
  const styleDesc = getStyleDescription(style);
  const roomDesc = getRoomLabel(roomType);
  const furniture = getRoomFurniture(roomType);

  return `Stunning ${style} ${roomDesc}, award-winning complete interior redesign. ${styleDesc}. Fully furnished with ${furniture}. Cohesive ${style} design language on every surface — walls, flooring, textiles, and light fixtures. Warm inviting atmosphere with layered ambient and accent lighting. Beautifully styled with curated objects, fresh greenery, and designer textiles. Published in Architectural Digest.`;
}

export class TrialGenerateUseCase {
  constructor(private readonly imageGenerator: IImageGeneratorService) {}

  async execute(input: TrialGenerateInput): Promise<Result<TrialGenerateOutput>> {
    const prompt = buildTrialBasePrompt(input.style, input.roomType);
    const dims = getImageDimensionsFromBase64(input.imageBase64);

    const result = await this.imageGenerator.generate({
      prompt,
      // data URI base64 : le service uploade via fal.storage (Flux) ou décode
      // directement (Gemini). Pas de risque SSRF ici, mais le chemin reste unifié.
      controlImageUrl: input.imageBase64,
      styleSlug: input.style,
      roomType: input.roomType,
      transformMode: 'full_redesign',
      width: dims?.width,
      height: dims?.height,
    });

    if (!result.success) {
      return failure(result.error as Error);
    }

    return success({ imageUrl: result.data.imageUrl });
  }
}
