import { Link } from '@/i18n/navigation';

/**
 * Résumé tarifaire rendu côté SERVEUR.
 *
 * Pourquoi : la page de tarifs est un composant client, et son HTML ne
 * contenait que 165 mots lisibles, uniquement la navigation et le pied de
 * page. Les prix, les packs et la FAQ n'existaient que dans le payload React.
 * Pour un crawler sans JavaScript, pour l'extraction de passages de Google et
 * pour un moteur de réponse, la page money du produit était donc vide.
 *
 * Ce bloc énonce les mêmes prix que ceux affichés par l'interface, à partir
 * des mêmes données de traduction : aucune divergence possible entre ce que
 * lit une IA et ce que voit un client.
 */

export interface PackResume {
  name: string;
  price: number;
  credits: number;
  description: string;
}

export interface QuestionResume {
  question: string;
  answer: string;
}

interface PricingResumeProps {
  packs: PackResume[];
  faq: QuestionResume[];
  locale: string;
}

function formatPrix(prix: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(prix);
}

export function PricingResume({ packs, faq, locale }: PricingResumeProps) {
  return (
    <section
      className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6"
      aria-label="Détail des tarifs"
    >
      <h2 className="prestige-display text-[24px] font-semibold tracking-[-0.02em] text-foreground sm:text-[28px]">
        Le prix, en clair
      </h2>

      <p className="prestige-body mt-4 text-[15px] leading-relaxed text-muted-foreground">
        InstaDeco se paie en crédits, sans abonnement ni engagement. Un crédit
        vaut un rendu, et les crédits achetés n&apos;expirent pas. Le premier
        essai est gratuit, sans inscription et sans carte bancaire, et
        l&apos;achat lui-même ne demande pas de créer un compte : le lien de
        connexion arrive par email après le paiement.
      </p>

      <ul className="mt-6 space-y-3">
        {packs.map((pack) => (
          <li key={pack.name} className="prestige-body text-[15px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {pack.credits} crédits pour {formatPrix(pack.price, locale)}
            </span>
            {`, soit ${formatPrix(pack.price / pack.credits, locale)} par rendu. ${pack.description}`}
          </li>
        ))}
      </ul>

      <p className="prestige-body mt-6 text-[15px] leading-relaxed text-muted-foreground">
        Les professionnels de l&apos;immobilier qui traitent des biens à la
        chaîne disposent d&apos;{' '}
        <Link href="/pro" className="text-[var(--gold)] underline-offset-4 hover:underline">
          abonnements séparés
        </Link>
        , à partir de 19 € par mois. Pour un usage ponctuel, les crédits
        reviennent moins cher.
      </p>

      <div className="mt-10 space-y-8">
        {faq.map((item) => (
          <div key={item.question}>
            <h3 className="prestige-display text-[17px] font-semibold text-foreground">
              {item.question}
            </h3>
            <p className="prestige-body mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-[14px] text-muted-foreground">
        Vous hésitez encore ?{' '}
        <Link href="/essai" className="text-[var(--gold)] underline-offset-4 hover:underline">
          Testez sur votre propre pièce
        </Link>{' '}
        avant de payer quoi que ce soit.
      </p>
    </section>
  );
}
