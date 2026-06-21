/**
 * Dependency Injection Container
 * 
 * Ce fichier centralise l'instanciation de tous les adapters et use cases.
 * Il permet de facilement swapper les implémentations (ex: pour les tests).
 */

// Repositories
import { SupabaseGenerationRepository } from '../repositories/supabase/SupabaseGenerationRepository';
import { SupabaseUserRepository } from '../repositories/supabase/SupabaseUserRepository';
import { SupabaseOrganizationRepository } from '../repositories/supabase/SupabaseOrganizationRepository';
import { IOrganizationRepository } from '@/src/domain/ports/repositories/IOrganizationRepository';
import { SupabaseCreditRepository } from '../repositories/supabase/SupabaseCreditRepository';
import { SupabaseStyleRepository } from '../repositories/supabase/SupabaseStyleRepository';
import { SupabaseProcessedEventRepository } from '../repositories/supabase/SupabaseProcessedEventRepository';
import { SupabaseGenerationRatingRepository } from '../repositories/supabase/SupabaseGenerationRatingRepository';

// Services
import { createImageGeneratorService } from '../services/image-generator-factory';
import { StripePaymentService } from '../services/stripe/StripePaymentService';
import { SupabaseAuthService } from '../services/auth/SupabaseAuthService';
import { SupabaseStorageService } from '../services/supabase/SupabaseStorageService';
import { ConsoleLoggerService } from '../services/logger/ConsoleLoggerService';

// Use Cases
import { GenerateDesignUseCase } from '@/src/application/use-cases/generation/GenerateDesignUseCase';
import { GetGenerationStatusUseCase } from '@/src/application/use-cases/generation/GetGenerationStatusUseCase';
import { ReconcileStuckGenerationsUseCase } from '@/src/application/use-cases/generation/ReconcileStuckGenerationsUseCase';
import { ListPublicGalleryUseCase } from '@/src/application/use-cases/generation/ListPublicGalleryUseCase';
import { ListUserGenerationsUseCase } from '@/src/application/use-cases/generation/ListUserGenerationsUseCase';
import { SupabaseBlogArticleRepository } from '../repositories/supabase/SupabaseBlogArticleRepository';
import { IBlogArticleRepository } from '@/src/domain/ports/repositories/IBlogArticleRepository';
import { ListBlogArticlesUseCase } from '@/src/application/use-cases/blog/ListBlogArticlesUseCase';
import { GetBlogArticleBySlugUseCase } from '@/src/application/use-cases/blog/GetBlogArticleBySlugUseCase';
import { SupabaseLeadRepository } from '../repositories/supabase/SupabaseLeadRepository';
import { ILeadRepository } from '@/src/domain/ports/repositories/ILeadRepository';
import { CaptureLeadUseCase } from '@/src/application/use-cases/leads/CaptureLeadUseCase';
import { UnsubscribeUseCase } from '@/src/application/use-cases/leads/UnsubscribeUseCase';
import { SupabaseReferralRepository } from '../repositories/supabase/SupabaseReferralRepository';
import { IReferralRepository } from '@/src/domain/ports/repositories/IReferralRepository';
import { GetReferralInfoUseCase } from '@/src/application/use-cases/referral/GetReferralInfoUseCase';
import { ApplyReferralCodeUseCase } from '@/src/application/use-cases/referral/ApplyReferralCodeUseCase';
import { GetGenerationDownloadUseCase } from '@/src/application/use-cases/generation/GetGenerationDownloadUseCase';
import { SupabaseUserDataExportRepository } from '../repositories/supabase/SupabaseUserDataExportRepository';
import { IUserDataExportRepository } from '@/src/domain/ports/repositories/IUserDataExportRepository';
import { ExportUserDataUseCase } from '@/src/application/use-cases/user/ExportUserDataUseCase';
import { SupabaseUserDeletionRepository } from '../repositories/supabase/SupabaseUserDeletionRepository';
import { IUserDeletionRepository } from '@/src/domain/ports/repositories/IUserDeletionRepository';
import { DeleteAccountUseCase } from '@/src/application/use-cases/user/DeleteAccountUseCase';
import { CreateSubscriptionUseCase } from '@/src/application/use-cases/payments/CreateSubscriptionUseCase';
import { CreateBillingPortalSessionUseCase } from '@/src/application/use-cases/payments/CreateBillingPortalSessionUseCase';
import { PurchaseCreditsUseCase } from '@/src/application/use-cases/credits/PurchaseCreditsUseCase';
import { CreateGuestCheckoutUseCase } from '@/src/application/use-cases/payments/CreateGuestCheckoutUseCase';
import { AddCreditsUseCase } from '@/src/application/use-cases/credits/AddCreditsUseCase';
import { GetUserCreditsUseCase } from '@/src/application/use-cases/credits/GetUserCreditsUseCase';
import { GetCreditHistoryUseCase } from '@/src/application/use-cases/credits/GetCreditHistoryUseCase';
import { ProcessStripeWebhookUseCase } from '@/src/application/use-cases/webhooks/ProcessStripeWebhookUseCase';
import { GetOrganizationUseCase, InviteMemberUseCase, RemoveMemberUseCase } from '@/src/application/use-cases/organization/ManageOrganizationUseCases';
import { TrialGenerateUseCase } from '@/src/application/use-cases/trial/TrialGenerateUseCase';
import { RateGenerationUseCase } from '@/src/application/use-cases/ratings/RateGenerationUseCase';

// Types
import { IGenerationRepository } from '@/src/domain/ports/repositories/IGenerationRepository';
import { IUserRepository } from '@/src/domain/ports/repositories/IUserRepository';
import { ICreditRepository } from '@/src/domain/ports/repositories/ICreditRepository';
import { IStyleRepository } from '@/src/domain/ports/repositories/IStyleRepository';
import { IProcessedEventRepository } from '@/src/domain/ports/repositories/IProcessedEventRepository';
import { IGenerationRatingRepository } from '@/src/domain/ports/repositories/IGenerationRatingRepository';
import { IImageGeneratorService } from '@/src/domain/ports/services/IImageGeneratorService';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';
import { IAuthService } from '@/src/domain/ports/services/IAuthService';
import { IStorageService } from '@/src/domain/ports/services/IStorageService';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

/**
 * Container singleton pour les dépendances
 */
class DIContainer {
  // Instances singleton des repositories
  private _generationRepo: IGenerationRepository | null = null;
  private _userRepo: IUserRepository | null = null;
  private _orgRepo: IOrganizationRepository | null = null;
  private _creditRepo: ICreditRepository | null = null;
  private _styleRepo: IStyleRepository | null = null;
  private _processedEventRepo: IProcessedEventRepository | null = null;
  private _generationRatingRepo: IGenerationRatingRepository | null = null;
  private _blogArticleRepo: IBlogArticleRepository | null = null;
  private _leadRepo: ILeadRepository | null = null;
  private _referralRepo: IReferralRepository | null = null;
  private _userDataExportRepo: IUserDataExportRepository | null = null;
  private _userDeletionRepo: IUserDeletionRepository | null = null;

  // Instances singleton des services
  private _imageGenerator: IImageGeneratorService | null = null;
  private _paymentService: IPaymentService | null = null;
  private _authService: IAuthService | null = null;
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

  get organizationRepository(): IOrganizationRepository {
    if (!this._orgRepo) {
      this._orgRepo = new SupabaseOrganizationRepository();
    }
    return this._orgRepo;
  }

  get creditRepository(): ICreditRepository {
    if (!this._creditRepo) {
      this._creditRepo = new SupabaseCreditRepository();
    }
    return this._creditRepo;
  }

  get blogArticleRepository(): IBlogArticleRepository {
    if (!this._blogArticleRepo) {
      this._blogArticleRepo = new SupabaseBlogArticleRepository();
    }
    return this._blogArticleRepo;
  }

  get leadRepository(): ILeadRepository {
    if (!this._leadRepo) {
      this._leadRepo = new SupabaseLeadRepository();
    }
    return this._leadRepo;
  }

  get styleRepository(): IStyleRepository {
    if (!this._styleRepo) {
      this._styleRepo = new SupabaseStyleRepository();
    }
    return this._styleRepo;
  }

  get processedEventRepository(): IProcessedEventRepository {
    if (!this._processedEventRepo) {
      this._processedEventRepo = new SupabaseProcessedEventRepository();
    }
    return this._processedEventRepo;
  }

  get generationRatingRepository(): IGenerationRatingRepository {
    if (!this._generationRatingRepo) {
      this._generationRatingRepo = new SupabaseGenerationRatingRepository();
    }
    return this._generationRatingRepo;
  }

  // ============ SERVICES ============

  get imageGeneratorService(): IImageGeneratorService {
    if (!this._imageGenerator) {
      // Provider sélectionné via IMAGE_PROVIDER ('gemini' | 'fal', défaut 'fal').
      this._imageGenerator = createImageGeneratorService();
    }
    return this._imageGenerator;
  }

  get paymentService(): IPaymentService {
    if (!this._paymentService) {
      this._paymentService = new StripePaymentService();
    }
    return this._paymentService;
  }

  get authService(): IAuthService {
    if (!this._authService) {
      this._authService = new SupabaseAuthService();
    }
    return this._authService;
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
      this.userRepository,
      this.organizationRepository,
    );
  }

  get getGenerationStatusUseCase(): GetGenerationStatusUseCase {
    return new GetGenerationStatusUseCase(
      this.generationRepository,
      this.creditRepository,
      this.imageGeneratorService,
      this.storageService,
      this.logger,
    );
  }

  get listUserGenerationsUseCase(): ListUserGenerationsUseCase {
    return new ListUserGenerationsUseCase(
      this.generationRepository,
      this.logger,
    );
  }

  get reconcileStuckGenerationsUseCase(): ReconcileStuckGenerationsUseCase {
    return new ReconcileStuckGenerationsUseCase(
      this.generationRepository,
      this.creditRepository,
      this.logger,
    );
  }

  get listPublicGalleryUseCase(): ListPublicGalleryUseCase {
    return new ListPublicGalleryUseCase(this.generationRepository);
  }

  get listBlogArticlesUseCase(): ListBlogArticlesUseCase {
    return new ListBlogArticlesUseCase(this.blogArticleRepository);
  }

  get getBlogArticleBySlugUseCase(): GetBlogArticleBySlugUseCase {
    return new GetBlogArticleBySlugUseCase(this.blogArticleRepository);
  }

  get captureLeadUseCase(): CaptureLeadUseCase {
    return new CaptureLeadUseCase(this.leadRepository, this.logger);
  }

  get unsubscribeUseCase(): UnsubscribeUseCase {
    return new UnsubscribeUseCase(this.userRepository, this.leadRepository, this.logger);
  }

  get referralRepository(): IReferralRepository {
    if (!this._referralRepo) {
      this._referralRepo = new SupabaseReferralRepository();
    }
    return this._referralRepo;
  }

  get getReferralInfoUseCase(): GetReferralInfoUseCase {
    return new GetReferralInfoUseCase(this.referralRepository, this.logger);
  }

  get applyReferralCodeUseCase(): ApplyReferralCodeUseCase {
    return new ApplyReferralCodeUseCase(this.referralRepository, this.logger);
  }

  get getGenerationDownloadUseCase(): GetGenerationDownloadUseCase {
    return new GetGenerationDownloadUseCase(this.generationRepository, this.logger);
  }

  get userDataExportRepository(): IUserDataExportRepository {
    if (!this._userDataExportRepo) {
      this._userDataExportRepo = new SupabaseUserDataExportRepository();
    }
    return this._userDataExportRepo;
  }

  get exportUserDataUseCase(): ExportUserDataUseCase {
    return new ExportUserDataUseCase(this.userDataExportRepository, this.logger);
  }

  get userDeletionRepository(): IUserDeletionRepository {
    if (!this._userDeletionRepo) {
      this._userDeletionRepo = new SupabaseUserDeletionRepository();
    }
    return this._userDeletionRepo;
  }

  get deleteAccountUseCase(): DeleteAccountUseCase {
    return new DeleteAccountUseCase(this.userDeletionRepository, this.logger);
  }

  get createSubscriptionUseCase(): CreateSubscriptionUseCase {
    return new CreateSubscriptionUseCase(this.paymentService, this.logger);
  }

  get createBillingPortalSessionUseCase(): CreateBillingPortalSessionUseCase {
    return new CreateBillingPortalSessionUseCase(this.userRepository, this.paymentService);
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

  get processStripeWebhookUseCase(): ProcessStripeWebhookUseCase {
    return new ProcessStripeWebhookUseCase(
      this.creditRepository,
      this.generationRepository,
      this.paymentService,
      this.logger,
      this.processedEventRepository,
      this.authService,
      this.userRepository,
      this.organizationRepository,
    );
  }

  get createGuestCheckoutUseCase(): CreateGuestCheckoutUseCase {
    return new CreateGuestCheckoutUseCase(
      this.paymentService,
      this.logger,
    );
  }

  get trialGenerateUseCase(): TrialGenerateUseCase {
    return new TrialGenerateUseCase(this.imageGeneratorService);
  }

  get rateGenerationUseCase(): RateGenerationUseCase {
    return new RateGenerationUseCase(
      this.generationRatingRepository,
      this.generationRepository,
      this.logger,
    );
  }

  get getOrganizationUseCase(): GetOrganizationUseCase {
    return new GetOrganizationUseCase(this.organizationRepository);
  }

  get inviteMemberUseCase(): InviteMemberUseCase {
    return new InviteMemberUseCase(this.organizationRepository, this.userRepository);
  }

  get removeMemberUseCase(): RemoveMemberUseCase {
    return new RemoveMemberUseCase(this.organizationRepository);
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
    this._processedEventRepo = null;
    this._generationRatingRepo = null;
    this._imageGenerator = null;
    this._paymentService = null;
    this._authService = null;
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

  setProcessedEventRepository(repo: IProcessedEventRepository): void {
    this._processedEventRepo = repo;
  }

  setGenerationRatingRepository(repo: IGenerationRatingRepository): void {
    this._generationRatingRepo = repo;
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
  get reconcileStuckGenerations() { return container.reconcileStuckGenerationsUseCase; },
  get listPublicGallery() { return container.listPublicGalleryUseCase; },
  get listBlogArticles() { return container.listBlogArticlesUseCase; },
  get getBlogArticleBySlug() { return container.getBlogArticleBySlugUseCase; },
  get captureLead() { return container.captureLeadUseCase; },
  get unsubscribe() { return container.unsubscribeUseCase; },
  get getReferralInfo() { return container.getReferralInfoUseCase; },
  get applyReferralCode() { return container.applyReferralCodeUseCase; },
  get getGenerationDownload() { return container.getGenerationDownloadUseCase; },
  get exportUserData() { return container.exportUserDataUseCase; },
  get deleteAccount() { return container.deleteAccountUseCase; },
  get createSubscription() { return container.createSubscriptionUseCase; },
  get createBillingPortal() { return container.createBillingPortalSessionUseCase; },
  get purchaseCredits() { return container.purchaseCreditsUseCase; },
  get createGuestCheckout() { return container.createGuestCheckoutUseCase; },
  get addCredits() { return container.addCreditsUseCase; },
  get getUserCredits() { return container.getUserCreditsUseCase; },
  get getCreditHistory() { return container.getCreditHistoryUseCase; },
  get processStripeWebhook() { return container.processStripeWebhookUseCase; },
  get trialGenerate() { return container.trialGenerateUseCase; },
  get rateGeneration() { return container.rateGenerationUseCase; },
  get getOrganization() { return container.getOrganizationUseCase; },
  get inviteMember() { return container.inviteMemberUseCase; },
  get removeMember() { return container.removeMemberUseCase; },
};
