import { Result, success, failure } from '@/src/shared/types/Result';
import { IPaymentService } from '@/src/domain/ports/services/IPaymentService';
import { DomainError } from '@/src/domain/errors/DomainError';
import { ValidationError } from '@/src/domain/errors/ValidationError';
import { PaymentError } from '@/src/domain/errors/PaymentError';

export interface CheckoutSessionStatus {
  /** Le paiement est-il encaissé ? */
  paid: boolean;
  /** Crédits achetés, d'après les métadonnées posées à la création de la session. */
  credits: number | null;
  packId: string | null;
  /** Email masqué (« ga***@gmail.com ») : assez pour rassurer, pas assez pour fuiter. */
  emailMasked: string | null;
  /** Montant réellement facturé, en euros. */
  amount: number | null;
}

/** Masque un email pour l'affichage public : conserve deux lettres et le domaine. */
export function maskEmail(email: string): string | null {
  const at = email.indexOf('@');
  if (at <= 0) return null;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}${domain}`;
}

/**
 * Use Case : statut public d'une session de paiement.
 *
 * Sert à la page de succès d'un acheteur SANS compte. Il revient de Stripe
 * sans session Supabase, donc aucune route authentifiée ne peut lui répondre :
 * avant ce use-case, la page tournait 60 s sur une route en 401, puis affichait
 * une impasse dont les boutons menaient à un écran de connexion.
 *
 * L'identifiant de session Stripe (cs_…) est long, aléatoire et connu du seul
 * acheteur : il fait office de jeton. On ne renvoie que l'indispensable, email
 * masqué compris.
 */
export class GetCheckoutSessionStatusUseCase {
  constructor(private readonly paymentService: IPaymentService) {}

  async execute(sessionId: string): Promise<Result<CheckoutSessionStatus, DomainError>> {
    const id = (sessionId || '').trim();
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(id)) {
      return failure(new ValidationError('Identifiant de session invalide'));
    }

    const res = await this.paymentService.retrieveSession(id);
    if (!res.success) {
      return failure(new PaymentError('Session de paiement introuvable'));
    }

    const s = res.data;
    const credits = Number(s.metadata.credits);

    return success({
      paid: s.paymentStatus === 'paid',
      credits: Number.isFinite(credits) && credits > 0 ? credits : null,
      packId: s.metadata.packId || null,
      emailMasked: s.customerEmail ? maskEmail(s.customerEmail) : null,
      amount: typeof s.amountTotal === 'number' ? s.amountTotal / 100 : null,
    });
  }
}
