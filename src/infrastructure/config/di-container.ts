/**
 * Dependency Injection Container
 * 
 * Ce fichier centralise l'instanciation de tous les adapters et use cases.
 * Il permet de facilement swapper les implémentations (ex: pour les tests).
 */

// Repositories
import { SupabaseGenerationRepository } from '../repositories/supabase/SupabaseGenerationRepository';
import { SupabaseUserRepository } from '../repositories/supabase/SupabaseUserRepository';
import { SupabaseCreditRepository } from '../repositories/supabase/SupabaseCreditRepository';
import { SupabaseStyleRepository } from '../repositories/supabase/SupabaseStyleRepository';

// Services
import { FalImageGeneratorService } from '../services/fal/FalImageGeneratorService';
import { StripePaymentService } from '../services/stripe/StripePaymentService';
import { SupabaseStorageService } from '../services/supabase/SupabaseStorageService';
import { ConsoleLoggerService } from '../services/logger/ConsoleLoggerService';

// Use Cases
import { GenerateDesignUseCase } from '@/src/application/use-cases/generation/GenerateDesignUseCase';
import { GetGenerationStatusUseCase } from '@/src/application/use-cases/generation/GetGenerationStatusUseCase';
import { ListUserGenerationsUseCase } from '@/src/application/use-cases/generation/ListUserGenerationsUseCase';
import { PurchaseCreditsUseCase } from '@/src/application/use-cases/credits/PurchaseCreditsUseCase';
import { AddCreditsUseCase } from '@/src/application/use-cases/credits/AddCreditsUseCase';
import { GetUserCreditsUseCase } from '@/src/application/use-cases/credits/GetUserCreditsUseCase';
import { GetCreditHistoryUseCase } from '@/src/application/use-cases/credits/GetCreditHistoryUseCase';
import { UnlockHDUseCase } from '@/src/application/use-cases/hd-unlock/UnlockHDUseCase';
import { ConfirmHDUnlockUseCase } from '@/src/application/use-cases/hd-unlock/ConfirmHDUnlockUseCase';
import { ProcessStripeWebhookUseCase } from '@/src/application/use-cases/webhooks/ProcessStripeWebhookUseCase';

// Types
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IStyleRepository } from '@/src/domain/ports/repositories/IStyleRepository';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';
import { IStorageService } from '@/src/domain/ports/services/IStorageService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

/**
 * Container singleton pour les dépendances
 */
class DIContainer {
  // Instances singleton des repositories
  private _generationRepo: IGenerationRepository | null = null;
  private _userRepo: IUserRepository | null = null;
  private _creditRepo: ICreditRepository | null = null;
  private _styleRepo: IStyleRepository | null = null;

  // Instances singleton des services
  private _imageGenerator: IImageGeneratorService | null = null;
  private _paymentService: IPaymentService | null = null;
  private _storageService: IStorageService | null = null;
  private _logger: ILoggerService | null = null;

  // ============ REPOSITORIES ============

  get generationRepository(): IGenerationRepository {
    if (!this._generationRepo) {
      this._generationRepo = new SupabaseGenerationRepository();
    }
    return this._generationRepo;
  }

  get userRepository(): IUserRepository {
    if (!this._userRepo) {
      this._userRepo = new SupabaseUserRepository();
    }
    return this._userRepo;
  }

  get creditRepository(): ICreditRepository {
    if (!this._creditRepo) {
      this._creditRepo = new SupabaseCreditRepository();
    }
    return this._creditRepo;
  }

  get styleRepository(): IStyleRepository {
    if (!this._styleRepo) {
      this._styleRepo = new SupabaseStyleRepository();
    }
    return this._styleRepo;
  }

  // ============ SERVICES ============

  get imageGeneratorService(): IImageGeneratorService {
    if (!this._imageGenerator) {
      this._imageGenerator = new FalImageGeneratorService();
    }
    return this._imageGenerator;
  }

  get paymentService(): IPaymentService {
    if (!this._paymentService) {
      this._paymentService = new StripePaymentService();
    }
    return this._paymentService;
  }

  get storageService(): IStorageService {
    if (!this._storageService) {
      this._storageService = new SupabaseStorageService();
    }
    return this._storageService;
  }

  get logger(): ILoggerService {
    if (!this._logger) {
      this._logger = new ConsoleLoggerService();
    }
    return this._logger;
  }

  // ============ USE CASES ============

  get generateDesignUseCase(): GenerateDesignUseCase {
    return new GenerateDesignUseCase(
      this.generationRepository,
      this.creditRepository,
      this.imageGeneratorService,
      this.storageService,
      this.logger,
    );
  }

  get getGenerationStatusUseCase(): GetGenerationStatusUseCase {
    return new GetGenerationStatusUseCase(
      this.generationRepository,      this.imageGeneratorService, // Nouveau paramètre
      this.storageService, // Nouveau paramètre      this.logger,
    );
  }

  get listUserGenerationsUseCase(): ListUserGenerationsUseCase {
    return new ListUserGenerationsUseCase(
      this.generationRepository,
      this.logger,
    );
  }

  get purchaseCreditsUseCase(): PurchaseCreditsUseCase {
    return new PurchaseCreditsUseCase(
      this.creditRepository,
      this.paymentService,
      this.logger,
    );
  }

  get addCreditsUseCase(): AddCreditsUseCase {
    return new AddCreditsUseCase(
      this.creditRepository,
      this.logger,
    );
  }

  get getUserCreditsUseCase(): GetUserCreditsUseCase {
    return new GetUserCreditsUseCase(
      this.creditRepository,
      this.logger,
    );
  }

  get getCreditHistoryUseCase(): GetCreditHistoryUseCase {
    return new GetCreditHistoryUseCase(
      this.creditRepository,
      this.logger,
    );
  }

  get unlockHDUseCase(): UnlockHDUseCase {
    return new UnlockHDUseCase(
      this.generationRepository,
      this.paymentService,
      this.logger,
    );
  }

  get confirmHDUnlockUseCase(): ConfirmHDUnlockUseCase {
    return new ConfirmHDUnlockUseCase(
      this.generationRepository,
      this.paymentService,
      this.logger,
    );
  }

  get processStripeWebhookUseCase(): ProcessStripeWebhookUseCase {
    return new ProcessStripeWebhookUseCase(
      this.creditRepository,
      this.generationRepository,
      this.paymentService,
      this.logger,
    );
  }

  // ============ TESTING ============

  /**
   * Reset toutes les instances (pour les tests)
   */
  reset(): void {
    this._generationRepo = null;
    this._userRepo = null;
    this._creditRepo = null;
    this._styleRepo = null;
    this._imageGenerator = null;
    this._paymentService = null;
    this._storageService = null;
    this._logger = null;
  }

  /**
   * Permet d'injecter des mocks (pour les tests)
   */
  setGenerationRepository(repo: IGenerationRepository): void {
    this._generationRepo = repo;
  }

  setUserRepository(repo: IUserRepository): void {
    this._userRepo = repo;
  }

  setCreditRepository(repo: ICreditRepository): void {
    this._creditRepo = repo;
  }

  setStyleRepository(repo: IStyleRepository): void {
    this._styleRepo = repo;
  }

  setImageGeneratorService(service: IImageGeneratorService): void {
    this._imageGenerator = service;
  }

  setPaymentService(service: IPaymentService): void {
    this._paymentService = service;
  }

  setStorageService(service: IStorageService): void {
    this._storageService = service;
  }

  setLogger(logger: ILoggerService): void {
    this._logger = logger;
  }
}

/**
 * Instance singleton du container
 */
export const container = new DIContainer();

/**
 * Raccourcis pour les use cases (usage dans les API routes)
 */
export const useCases = {
  get generateDesign() { return container.generateDesignUseCase; },
  get getGenerationStatus() { return container.getGenerationStatusUseCase; },
  get listUserGenerations() { return container.listUserGenerationsUseCase; },
  get purchaseCredits() { return container.purchaseCreditsUseCase; },
  get addCredits() { return container.addCreditsUseCase; },
  get getUserCredits() { return container.getUserCreditsUseCase; },
  get getCreditHistory() { return container.getCreditHistoryUseCase; },
  get unlockHD() { return container.unlockHDUseCase; },
  get confirmHDUnlock() { return container.confirmHDUnlockUseCase; },
  get processStripeWebhook() { return container.processStripeWebhookUseCase; },
};
