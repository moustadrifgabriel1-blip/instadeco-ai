import { Link } from '@/i18n/navigation';

/**
 * Contenu éditorial de la page d'essai, rendu côté SERVEUR.
 *
 * Pourquoi : /essai est devenue la destination de toutes les surfaces
 * d'acquisition, mais la page ne contenait que 66 mots lisibles sans
 * JavaScript, l'outil étant entièrement client. Pour un crawler, pour
 * l'extraction de passages de Google et pour un moteur de réponse, la page
 * était donc vide.
 *
 * Chaque réponse tient en 40 à 60 mots et se suffit à elle-même : c'est le
 * format qu'un moteur de réponse peut citer sans le reste de la page.
 * Aucun chiffre invérifiable ici, uniquement ce que le produit fait vraiment.
 */

export interface QuestionReponse {
  question: string;
  answer: string;
}

/** Partagé avec le layout, qui en émet le JSON-LD FAQPage. */
export const ESSAI_FAQ: QuestionReponse[] = [
  {
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "Vous envoyez la photo de la pièce telle qu'elle est aujourd'hui, vous choisissez un style et un type de pièce, et le rendu s'affiche en une trentaine de secondes. Aucun compte n'est demandé pour ce premier essai, et aucune carte bancaire non plus. Le résultat s'affiche directement dans la page.",
  },
  {
    question: "Faut-il créer un compte pour essayer ?",
    answer:
      "Non. L'essai fonctionne sans inscription : vous arrivez, vous envoyez une photo, vous obtenez un rendu. Un compte ne devient utile que pour conserver vos rendus et en générer d'autres. L'achat de crédits se fait lui aussi sans compte, avec une simple adresse email à laquelle le lien de connexion est envoyé.",
  },
  {
    question: "La pièce garde-t-elle sa vraie structure ?",
    answer:
      "Oui, et c'est la différence avec une image générée de zéro. Les murs, les fenêtres, les portes et les volumes de votre photo sont conservés. Seuls le mobilier, les matières et la décoration changent. Vous voyez donc votre pièce redécorée, pas une pièce inventée qui lui ressemblerait vaguement.",
  },
  {
    question: "Que se passe-t-il après l'essai gratuit ?",
    answer:
      "Vous pouvez acheter des crédits si vous voulez continuer : dix rendus pour 9,90 €, soit 0,99 € par rendu, sans abonnement ni engagement. Les crédits n'expirent pas. Créer un compte gratuit donne également droit à trois crédits offerts pour transformer d'autres pièces.",
  },
  {
    question: "Peut-on décorer une pièce déjà meublée ?",
    answer:
      "Oui. Le service ne se limite pas aux pièces vides : il remplace le mobilier et la décoration en place tout en gardant l'architecture réelle. C'est utile pour visualiser un changement de style avant d'acheter des meubles, ou pour comparer plusieurs ambiances sur une pièce que vous habitez déjà.",
  },
];

export function EssaiContenu() {
  return (
    <section
      className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-6"
      aria-label="À propos de l'essai gratuit"
    >
      <h2 className="prestige-display text-[24px] font-semibold tracking-[-0.02em] text-foreground sm:text-[28px]">
        Voir sa pièce autrement, avant de bouger un meuble
      </h2>

      <p className="prestige-body mt-4 text-[15px] leading-relaxed text-muted-foreground">
        Choisir une couleur, un canapé ou une ambiance sur catalogue demande un
        effort d&apos;imagination que peu de gens ont envie de fournir. Voir la
        pièce déjà décorée, sur sa propre photo, rend la décision beaucoup plus
        simple. C&apos;est ce que fait cet essai : votre salon, votre chambre ou
        votre cuisine, rendus dans le style que vous voulez tester.
      </p>

      <p className="prestige-body mt-4 text-[15px] leading-relaxed text-muted-foreground">
        Les rendus visibles dans la{' '}
        <Link href="/galerie" className="text-[var(--gold)] underline-offset-4 hover:underline">
          galerie
        </Link>{' '}
        sont de vraies transformations produites avec le service, sur de vraies
        photos de pièces. Rien n&apos;y est retouché à la main.
      </p>

      <div className="mt-10 space-y-8">
        {ESSAI_FAQ.map((item) => (
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
        Envie de comparer les styles avant de vous lancer ?{' '}
        <Link href="/quiz" className="text-[var(--gold)] underline-offset-4 hover:underline">
          Le quiz de style
        </Link>{' '}
        aide à identifier celui qui vous correspond, et la{' '}
        <Link href="/pricing" className="text-[var(--gold)] underline-offset-4 hover:underline">
          page des tarifs
        </Link>{' '}
        détaille le prix des crédits.
      </p>
    </section>
  );
}
