import Replicate from 'replicate';
import { Result, success, failure } from '@/src/shared/types/Result';
import { 
  IImageGeneratorService, 
  ImageGenerationOptions, 
  ImageGenerationResult 
} from '@/src/domain/ports/services/IImageGeneratorService';

/**
 * Adapter: Replicate Image Generator Service
 * Implémente IImageGeneratorService avec Replicate API (Flux.1 + ControlNet)
 */
export class ReplicateImageGeneratorService implements IImageGeneratorService {
  private replicate: Replicate;

  constructor() {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    
    if (!apiToken) {
      throw new Error('REPLICATE_API_TOKEN is required');
    }

    this.replicate = new Replicate({
      auth: apiToken,
    });
  }

  async generate(options: ImageGenerationOptions): Promise<Result<ImageGenerationResult>> {
    try {
      const startTime = Date.now();

      // Utiliser Flux.1 avec ControlNet pour la transformation
      const output = await this.replicate.run(
        "xlabs-ai/flux-dev-controlnet:f2c31c31d81278a91b2447a304dae654c64a5d5a70340fba811bb1cbd41f2571",
        {
          input: {
            prompt: options.prompt,
            control_image: options.controlImageUrl,
            control_type: "depth", // depth pour préserver la structure
            num_inference_steps: options.numInferenceSteps ?? 28,
            guidance_scale: options.guidanceScale ?? 3.5,
            controlnet_conditioning_scale: 0.95,
            width: options.width ?? 1024,
            height: options.height ?? 1024,
            seed: options.seed,
            output_format: "jpg",
            output_quality: 90,
          },
        }
      );

      const inferenceTime = Date.now() - startTime;

      // Le output est un array d'URLs ou une URL unique
      let imageUrl: string;
      
      if (Array.isArray(output)) {
        imageUrl = output[0] as string;
      } else if (typeof output === 'string') {
        imageUrl = output;
      } else {
        return failure(new Error('Unexpected output format from Replicate'));
      }

      return success({
        imageUrl,
        inferenceTime,
        seed: options.seed,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Replicate generation failed: ${message}`));
    }
  }

  async checkStatus(predictionId: string): Promise<Result<{
    status: 'starting' | 'processing' | 'succeeded' | 'failed';
    output?: string;
    error?: string;
  }>> {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);

      let status: 'starting' | 'processing' | 'succeeded' | 'failed';
      
      switch (prediction.status) {
        case 'starting':
          status = 'starting';
          break;
        case 'processing':
          status = 'processing';
          break;
        case 'succeeded':
          status = 'succeeded';
          break;
        case 'failed':
        case 'canceled':
          status = 'failed';
          break;
        default:
          status = 'processing';
      }

      let output: string | undefined;
      if (prediction.output) {
        output = Array.isArray(prediction.output) 
          ? prediction.output[0] 
          : prediction.output;
      }

      return success({
        status,
        output,
        error: prediction.error as string | undefined,
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to check status: ${message}`));
    }
  }

  async cancel(predictionId: string): Promise<Result<void>> {
    try {
      await this.replicate.predictions.cancel(predictionId);
      return success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return failure(new Error(`Failed to cancel prediction: ${message}`));
    }
  }
}
