import { Result, success, failure } from '@/src/shared/types/Result';
import { IUserDataExportRepository } from '@/src/domain/ports/repositories/IUserDataExportRepository';
import { ILoggerService } from '@/src/domain/ports/services/ILoggerService';

/**
 * Informations de compte issues de la SESSION authentifiée (jamais du body).
 * La route les fournit à partir de `requireAuth()` / `supabase.auth.getUser()`.
 */
export interface ExportUserDataInput {
  userId: string;
  email: string | undefined;
  fullName: string | null;
  displayName: string | null;
  provider: string;
  createdAt: string | undefined;
  lastSignIn: string | null | undefined;
}

/**
 * Document d'export RGPD complet (Art. 15 & 20).
 * La structure est volontairement identique à la route historique :
 * la route se contente de `JSON.stringify` cette valeur.
 */
export interface ExportUserDataOutput {
  exportData: Record<string, unknown>;
}

/**
 * Use Case : export RGPD de toutes les données d'un utilisateur.
 *
 * Agrège les données via le repository de lecture seule dédié, puis construit
 * le document d'export en préservant exactement le format historique
 * (mêmes clés, même masquage de `stripe_customer_id`, même projection des lignes).
 */
export class ExportUserDataUseCase {
  constructor(
    private readonly exportRepo: IUserDataExportRepository,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: ExportUserDataInput): Promise<Result<ExportUserDataOutput>> {
    const dataResult = await this.exportRepo.fetchAll(input.userId);
    if (!dataResult.success) {
      this.logger.error('User data export failed', dataResult.error as Error, {
        userId: input.userId,
      });
      return failure(dataResult.error);
    }

    const {
      profile,
      generations,
      creditTransactions,
      projects,
      referralsGiven,
      referralsReceived,
    } = dataResult.data;

    const exportData = {
      _metadata: {
        exportDate: new Date().toISOString(),
        format: 'JSON',
        service: 'InstaDeco AI',
        website: 'https://instadeco.app',
        description:
          'Export complet de vos données personnelles conformément au RGPD (Art. 15 & 20)',
      },
      account: {
        id: input.userId,
        email: input.email,
        fullName: input.fullName,
        displayName: input.displayName,
        provider: input.provider,
        createdAt: input.createdAt,
        lastSignIn: input.lastSignIn,
      },
      profile: profile
        ? {
            credits: (profile as Record<string, unknown>).credits,
            role: (profile as Record<string, unknown>).role,
            referralCode: (profile as Record<string, unknown>).referral_code,
            stripeCustomerId: (profile as Record<string, unknown>).stripe_customer_id
              ? '***masqué***'
              : null,
            createdAt: (profile as Record<string, unknown>).created_at,
            updatedAt: (profile as Record<string, unknown>).updated_at,
          }
        : null,
      generations: generations.map((g) => ({
        id: g.id,
        style: g.style,
        roomType: g.room_type,
        status: g.status,
        inputImageUrl: g.input_image_url,
        outputImageUrl: g.output_image_url,
        prompt: g.prompt,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      })),
      creditTransactions: creditTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.created_at,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        createdAt: p.created_at,
      })),
      referrals: {
        given: referralsGiven.map((r) => ({
          creditsAwarded: r.credits_awarded,
          createdAt: r.created_at,
        })),
        received: referralsReceived.map((r) => ({
          creditsAwarded: r.credits_awarded,
          createdAt: r.created_at,
        })),
      },
      _dataCategories: {
        accountData: 'Informations de connexion et profil',
        generationData: 'Images uploadées et générées',
        transactionData: 'Historique des achats de crédits',
        referralData: 'Parrainages effectués et reçus',
      },
    };

    return success({ exportData });
  }
}
