import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { LegalFrenchBodyNotice } from '@/components/legal/LegalFrenchBodyNotice';
import { AlertTriangle, Check, ArrowRight } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'LegalMeta' });
  return {
    title: t('cgvTitle'),
    description: t('cgvDescription'),
    robots: 'index, follow',
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, '/legal/cgv'),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', '/legal/cgv'),
        en: getLocalizedCanonicalUrl('en', '/legal/cgv'),
        de: getLocalizedCanonicalUrl('de', '/legal/cgv'),
        'x-default': getLocalizedCanonicalUrl('fr', '/legal/cgv'),
      },
    },
  };
}

export default function CGVPage() {
  const lastUpdated = '22 juin 2026';

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LegalFrenchBodyNotice />
        <p className="prestige-eyebrow mb-3">InstaDeco AI</p>
        <h1 className="prestige-display text-4xl font-bold text-foreground mb-4">
          Conditions Générales de <span className="text-[var(--gold)]">Vente</span>
        </h1>

        <p className="prestige-body text-lg text-muted-foreground mb-2">
          Applicables au service InstaDeco AI
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Dernière mise à jour : {lastUpdated}
        </p>
        <div className="prestige-rule mb-8" />

        {/* Préambule */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Préambule</h2>
          <p className="prestige-body text-muted-foreground mb-4">
            Les présentes Conditions Générales de Vente (ci-après &quot;CGV&quot;) régissent l&apos;utilisation du
            service <strong className="text-foreground">InstaDeco AI</strong>, accessible à l&apos;adresse{' '}
            <a href="https://instadeco.app" className="text-[var(--gold)] hover:underline">https://instadeco.app</a>,
            édité par :
          </p>
          <div className="bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] p-4 rounded-lg text-muted-foreground">
            <p><strong className="text-foreground">Moustadrif E-Comm</strong></p>
            <p>Route du Bon 3, 1167 Lussy-sur-Morges, Vaud, Suisse</p>
            <p>IDE : CHE-145.897.362</p>
            <p>Email : <a href="mailto:contact@instadeco.app" className="text-[var(--gold)] hover:underline">contact@instadeco.app</a></p>
          </div>
          <p className="prestige-body text-muted-foreground mt-4">
            En utilisant le service, en achetant des crédits ou en souscrivant un abonnement, l&apos;utilisateur
            déclare avoir pris connaissance des présentes CGV et les accepte sans réserve.
          </p>
        </section>

        {/* Article 1 - Définitions */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 1 - Définitions</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><strong className="text-foreground">&quot;Service&quot;</strong> : Le service de génération d&apos;images de décoration d&apos;intérieur par intelligence artificielle proposé par InstaDeco AI.</li>
            <li><strong className="text-foreground">&quot;Utilisateur&quot;</strong> : Toute personne physique majeure (18 ans et plus) utilisant le Service.</li>
            <li><strong className="text-foreground">&quot;Crédit&quot;</strong> : Unité de valeur permettant d&apos;utiliser les fonctionnalités du Service. 1 crédit = 1 génération d&apos;image.</li>
            <li><strong className="text-foreground">&quot;Génération&quot;</strong> : Création d&apos;une image de décoration par l&apos;IA à partir d&apos;une photo fournie par l&apos;Utilisateur.</li>
            <li><strong className="text-foreground">&quot;HD Unlock&quot;</strong> : Option de téléchargement en haute définition d&apos;une image générée.</li>
            <li><strong className="text-foreground">&quot;Abonnement&quot;</strong> : Formule professionnelle à paiement récurrent (mensuel ou annuel) donnant accès aux fonctionnalités du Service selon le palier souscrit (Solo, Pro, Agence).</li>
          </ul>
        </section>

        {/* Article 2 - Description du service */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 2 - Description du Service</h2>
          <p className="prestige-body text-muted-foreground mb-4">
            InstaDeco AI est un service en ligne (SaaS) permettant aux utilisateurs de :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Télécharger des photos de leurs pièces intérieures</li>
            <li>Sélectionner un style de décoration parmi les options proposées</li>
            <li>Générer des propositions de redécoration par intelligence artificielle</li>
            <li>Visualiser et télécharger les images générées</li>
            <li>Débloquer la version haute définition (HD) des images générées</li>
          </ul>
          <p className="prestige-body text-muted-foreground mt-4">
            Le Service est fourni en l&apos;état (&quot;as is&quot;). Les résultats générés par l&apos;IA sont à titre
            indicatif et créatif et ne constituent pas des conseils professionnels en décoration ou architecture.
          </p>
        </section>

        {/* Article 3 - Conditions d'accès */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 3 - Conditions d&apos;accès</h2>
          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">3.1 Inscription</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            L&apos;utilisation du Service nécessite la création d&apos;un compte utilisateur. L&apos;Utilisateur doit
            fournir une adresse email valide et créer un mot de passe sécurisé.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">3.2 Capacité juridique</h3>
          <div className="bg-destructive/10 border border-destructive/40 p-4 rounded-lg mb-4">
            <p className="text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" aria-hidden="true" />
              <strong className="text-destructive">SERVICE RÉSERVÉ AUX PERSONNES MAJEURES (18 ANS ET PLUS)</strong>
            </p>
            <p className="text-muted-foreground mt-2">
              L&apos;Utilisateur doit avoir la capacité juridique de contracter. En créant un compte et en utilisant
              le Service, l&apos;Utilisateur déclare et garantit être âgé d&apos;au moins 18 ans.
            </p>
          </div>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">3.3 Crédits offerts</h3>
          <p className="prestige-body text-muted-foreground">
            À la création du compte, <strong className="text-foreground">3 crédits gratuits</strong> sont offerts pour permettre à
            l&apos;Utilisateur de tester le Service.
          </p>
        </section>

        {/* Article 4 - Prix et paiement */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 4 - Prix et paiement</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4.1 Tarifs des crédits</h3>
          <p className="prestige-body text-muted-foreground mb-4">Les prix sont indiqués TTC (TVA non applicable - Art. 21 ch. 19 LTVA).</p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-muted-foreground mb-4">
              <thead className="bg-[rgba(200,162,77,0.12)]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Pack</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Crédits</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Prix EUR</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Prix CHF</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Prix/crédit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Pack Starter</td>
                  <td className="px-4 py-2">10 crédits</td>
                  <td className="px-4 py-2 font-medium text-foreground">9,90 €</td>
                  <td className="px-4 py-2 font-medium text-foreground">9,90 CHF</td>
                  <td className="px-4 py-2">0,99 € / 0,99 CHF</td>
                </tr>
                <tr className="border-b border-[var(--gold-line)] bg-[rgba(200,162,77,0.12)]">
                  <td className="px-4 py-2">Pack Pro <span className="text-xs bg-[var(--gold)] text-[#0c0a09] px-2 py-0.5 rounded">Populaire</span></td>
                  <td className="px-4 py-2">25 crédits</td>
                  <td className="px-4 py-2 font-medium text-foreground">19,90 €</td>
                  <td className="px-4 py-2 font-medium text-foreground">19,90 CHF</td>
                  <td className="px-4 py-2">0,80 € / 0,80 CHF</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Pack 50</td>
                  <td className="px-4 py-2">50 crédits</td>
                  <td className="px-4 py-2 font-medium text-foreground">34,90 €</td>
                  <td className="px-4 py-2 font-medium text-foreground">34,90 CHF</td>
                  <td className="px-4 py-2">0,70 € / 0,70 CHF</td>
                </tr>
                <tr className="border-b border-[var(--gold-line)] bg-[rgba(200,162,77,0.12)]">
                  <td className="px-4 py-2">Pack 100 <span className="text-xs bg-[var(--gold)] text-[#0c0a09] px-2 py-0.5 rounded">Meilleure offre</span></td>
                  <td className="px-4 py-2">100 crédits</td>
                  <td className="px-4 py-2 font-medium text-foreground">59,90 €</td>
                  <td className="px-4 py-2 font-medium text-foreground">59,90 CHF</td>
                  <td className="px-4 py-2">0,60 € / 0,60 CHF</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4.2 Téléchargement HD</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Le téléchargement en haute définition d&apos;une image générée est facturé <strong className="text-foreground">4,99 € / 4,99 CHF</strong>
            par image (paiement unique par image).
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4.3 Moyens de paiement</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Les paiements sont traités de manière sécurisée par <strong className="text-foreground">Stripe</strong>.
            Les moyens de paiement acceptés sont :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>Cartes bancaires (Visa, Mastercard, American Express)</li>
            <li>Apple Pay et Google Pay</li>
            <li>Autres moyens selon disponibilité Stripe</li>
          </ul>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4.4 Facturation</h3>
          <p className="prestige-body text-muted-foreground">
            Un reçu électronique est envoyé automatiquement par email après chaque achat.
          </p>
        </section>

        {/* Article 4 bis - Abonnements Pro */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 4 bis - Abonnements Pro</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4 bis.1 Formules d&apos;abonnement</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            En complément des crédits, InstaDeco propose des formules d&apos;abonnement à destination des
            professionnels (agents immobiliers, home stagers, promoteurs, décorateurs). Les prix sont indiqués
            TTC (TVA non applicable, Art. 21 ch. 19 LTVA) et sont également disponibles en CHF selon la région.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-muted-foreground mb-4">
              <thead className="bg-[rgba(200,162,77,0.12)]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Formule</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Prix mensuel</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Prix annuel (-30%)</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Inclus</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Solo</td>
                  <td className="px-4 py-2 font-medium text-foreground">19 €/mois</td>
                  <td className="px-4 py-2 font-medium text-foreground">160 €/an</td>
                  <td className="px-4 py-2">40 générations/mois, 1 utilisateur, qualité HD, licence commerciale</td>
                </tr>
                <tr className="border-b border-[var(--gold-line)] bg-[rgba(200,162,77,0.12)]">
                  <td className="px-4 py-2">Pro</td>
                  <td className="px-4 py-2 font-medium text-foreground">49 €/mois</td>
                  <td className="px-4 py-2 font-medium text-foreground">408 €/an</td>
                  <td className="px-4 py-2">Générations illimitées (usage équitable, voir 4 bis.4), 1 utilisateur, qualité HD, support prioritaire</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Agence</td>
                  <td className="px-4 py-2 font-medium text-foreground">99 €/mois</td>
                  <td className="px-4 py-2 font-medium text-foreground">828 €/an</td>
                  <td className="px-4 py-2">Générations illimitées (usage équitable), jusqu&apos;à 3 sièges, facturation centralisée, support dédié</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4 bis.2 Facturation et reconduction</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            L&apos;abonnement est facturé d&apos;avance, pour la période choisie (mensuelle ou annuelle), via Stripe.
            Il se reconduit tacitement à chaque échéance pour une période identique, au tarif en vigueur, jusqu&apos;à
            résiliation par l&apos;Utilisateur. L&apos;option annuelle est réglée en une fois pour douze mois, au tarif
            réduit indiqué ci-dessus.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4 bis.3 Résiliation</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            L&apos;Utilisateur peut résilier son abonnement à tout moment, sans frais ni justification, depuis son
            espace client (portail de gestion Stripe). La résiliation prend effet à la fin de la période déjà payée :
            l&apos;accès aux fonctionnalités de l&apos;abonnement est conservé jusqu&apos;à cette échéance, puis
            l&apos;abonnement n&apos;est pas reconduit. Aucun remboursement au prorata n&apos;est dû pour la période en cours.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4 bis.4 Usage équitable (formules illimitées)</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Les formules Pro et Agence permettent de générer sans quota mensuel fixe, dans le cadre d&apos;un usage
            professionnel normal. Pour préserver la qualité du Service pour tous, une politique d&apos;usage équitable
            s&apos;applique : l&apos;usage doit rester celui d&apos;un professionnel pour ses propres biens et projets,
            à l&apos;exclusion de la revente de générations, de l&apos;usage automatisé (bots, scripts, accès
            programmatique non autorisé) et du partage des accès au-delà des sièges souscrits. En cas d&apos;usage
            manifestement disproportionné, l&apos;Éditeur contacte l&apos;Utilisateur et peut limiter temporairement le
            débit de génération ou proposer une formule adaptée.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4 bis.5 Sièges (formule Agence)</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            La formule Agence inclut jusqu&apos;à 3 sièges (utilisateurs). Le propriétaire du compte invite ou retire
            des membres dans la limite des sièges souscrits. Pour plus de 3 sièges, un tarif sur mesure est disponible
            sur demande à <a href="mailto:contact@instadeco.app" className="text-[var(--gold)] hover:underline">contact@instadeco.app</a>.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">4 bis.6 Droit de rétractation (abonnement)</h3>
          <p className="prestige-body text-muted-foreground">
            Pour les consommateurs de l&apos;UE, l&apos;abonnement est un contrat de fourniture de contenu numérique.
            En souscrivant et en demandant l&apos;accès immédiat au Service, l&apos;Utilisateur consent expressément à
            l&apos;exécution immédiate et renonce à son droit de rétractation de 14 jours pour la période en cours
            d&apos;exécution. Cette renonciation n&apos;affecte pas la faculté de résilier à tout moment pour les
            périodes futures (voir 4 bis.3). Pour les Utilisateurs professionnels (B2B), le droit de rétractation des
            consommateurs ne s&apos;applique pas.
          </p>
        </section>

        {/* Article 5 - Crédits */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 5 - Fonctionnement des crédits</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">5.1 Utilisation des crédits</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li><strong className="text-foreground">1 crédit = 1 génération d&apos;image</strong> de décoration d&apos;intérieur</li>
            <li>Les crédits sont débités au moment du lancement de la génération</li>
            <li>En cas d&apos;échec technique de la génération, les crédits sont automatiquement recrédités</li>
          </ul>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">5.2 Validité des crédits</h3>
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg">
            <p className="text-muted-foreground">
              <Check className="w-5 h-5 text-emerald-400 shrink-0 inline-block align-text-bottom mr-1" aria-hidden="true" />
              <strong className="text-emerald-400">Les crédits n&apos;expirent pas.</strong> Ils restent disponibles sur votre compte
              sans limite de durée tant que le compte reste actif.
            </p>
          </div>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">5.3 Non-transférabilité</h3>
          <p className="prestige-body text-muted-foreground">
            Les crédits sont personnels et non transférables. Ils ne peuvent pas être cédés,
            vendus ou échangés avec d&apos;autres utilisateurs.
          </p>
        </section>

        {/* Article 6 - Droit de rétractation */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 6 - Droit de rétractation</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">6.1 Principe</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Conformément à l&apos;article L.221-28 du Code de la consommation (applicable aux consommateurs de l&apos;UE),
            le droit de rétractation <strong className="text-foreground">ne s&apos;applique pas</strong> aux contrats de fourniture de contenu
            numérique non fourni sur un support matériel dont l&apos;exécution a commencé avec l&apos;accord préalable
            exprès du consommateur.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">6.2 Renonciation au droit de rétractation</h3>
          <div className="bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] p-4 rounded-lg">
            <p className="text-muted-foreground">
              <strong className="text-foreground">En procédant à l&apos;achat de crédits et en utilisant le Service</strong> (génération d&apos;images),
              l&apos;Utilisateur accepte expressément que l&apos;exécution du contrat commence immédiatement et
              <strong className="text-foreground"> renonce à son droit de rétractation de 14 jours</strong> concernant les crédits déjà utilisés.
            </p>
          </div>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">6.3 Crédits non utilisés</h3>
          <p className="prestige-body text-muted-foreground">
            Les crédits non utilisés ne sont pas remboursables après achat. Ils restent disponibles
            sur votre compte sans limitation de durée.
          </p>
        </section>

        {/* Article 7 - Propriété intellectuelle */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 7 - Propriété intellectuelle</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">7.1 Images originales</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            L&apos;Utilisateur conserve l&apos;intégralité de ses droits sur les images qu&apos;il télécharge.
            Il garantit disposer des droits nécessaires sur ces images et dégage l&apos;Éditeur de toute
            responsabilité en cas de violation de droits de tiers.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">7.2 Images générées</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Les images générées par l&apos;IA sont mises à disposition de l&apos;Utilisateur avec une licence
            d&apos;utilisation <strong className="text-foreground">personnelle et commerciale</strong>. L&apos;Utilisateur peut :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
            <li>Utiliser les images pour ses projets personnels</li>
            <li>Utiliser les images pour des projets commerciaux (décoration, présentation client, etc.)</li>
            <li>Partager et publier les images</li>
          </ul>
          <p className="prestige-body text-muted-foreground">
            <strong className="text-foreground">Limitations :</strong> L&apos;Utilisateur ne peut pas prétendre à la propriété exclusive
            des images générées par l&apos;IA ni les utiliser pour entraîner d&apos;autres modèles d&apos;IA.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">7.3 Éléments du Service</h3>
          <p className="prestige-body text-muted-foreground">
            Tous les éléments du site (logos, interface, code, textes) sont protégés par le droit
            d&apos;auteur et appartiennent à Moustadrif E-Comm.
          </p>
        </section>

        {/* Article 8 - Utilisation acceptable */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 8 - Utilisation acceptable</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">8.1 Usages autorisés</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Le Service est destiné à la génération d&apos;images de décoration d&apos;intérieur à partir de photos
            de pièces réelles ou virtuelles.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">8.2 Usages interdits</h3>
          <p className="prestige-body text-muted-foreground mb-2">L&apos;Utilisateur s&apos;engage à ne pas :</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
            <li>Télécharger des images à caractère illégal, pornographique, violent ou haineux</li>
            <li>Utiliser le Service à des fins frauduleuses</li>
            <li>Tenter de contourner les mesures de sécurité ou les limitations du Service</li>
            <li>Revendre ou redistribuer l&apos;accès au Service</li>
            <li>Utiliser des bots ou scripts automatisés</li>
            <li>Télécharger des images violant les droits de propriété intellectuelle de tiers</li>
          </ul>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">8.3 Modération</h3>
          <p className="prestige-body text-muted-foreground">
            Le Service intègre des filtres automatiques pour prévenir la génération de contenu inapproprié.
            En cas de violation, le compte peut être suspendu ou résilié sans remboursement des crédits restants.
          </p>
        </section>

        {/* Article 9 - Limitation de responsabilité */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 9 - Limitation de responsabilité</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">9.1 Nature du Service</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Le Service utilise l&apos;intelligence artificielle pour générer des propositions de décoration.
            Les résultats sont fournis à titre <strong className="text-foreground">indicatif et créatif uniquement</strong>.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">9.2 Exclusions de garantie</h3>
          <p className="prestige-body text-muted-foreground mb-2">L&apos;Éditeur ne garantit pas :</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
            <li>Que les propositions de décoration soient réalisables physiquement</li>
            <li>La conformité des propositions aux normes de construction ou d&apos;urbanisme</li>
            <li>L&apos;adéquation des propositions aux goûts ou besoins spécifiques de l&apos;Utilisateur</li>
            <li>La disponibilité des meubles ou objets représentés dans les images générées</li>
            <li>L&apos;absence totale d&apos;interruption du Service</li>
          </ul>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">9.3 Plafond de responsabilité</h3>
          <p className="prestige-body text-muted-foreground">
            La responsabilité de l&apos;Éditeur est limitée au montant des sommes effectivement payées par
            l&apos;Utilisateur au cours des 12 derniers mois précédant le fait générateur de responsabilité.
          </p>
        </section>

        {/* Article 10 - Protection des données */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 10 - Protection des données personnelles</h2>
          <p className="prestige-body text-muted-foreground mb-4">
            Le traitement des données personnelles est régi par notre{' '}
            <Link href="/legal/privacy" className="text-[var(--gold)] hover:underline">
              Politique de Confidentialité
            </Link>,
            conforme à la nLPD suisse et au RGPD européen.
          </p>
          <p className="prestige-body text-muted-foreground">
            L&apos;acceptation des présentes CGV vaut acceptation de la Politique de Confidentialité.
          </p>
        </section>

        {/* Article 11 - Modification */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 11 - Modification des CGV</h2>
          <p className="prestige-body text-muted-foreground mb-4">
            L&apos;Éditeur se réserve le droit de modifier les présentes CGV à tout moment.
            Les modifications entrent en vigueur dès leur publication sur le site.
          </p>
          <p className="prestige-body text-muted-foreground">
            En cas de modification substantielle des conditions tarifaires ou des droits de l&apos;Utilisateur,
            un email d&apos;information sera envoyé. L&apos;utilisation continue du Service après notification
            vaut acceptation des nouvelles CGV.
          </p>
        </section>

        {/* Article 12 - Résiliation */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 12 - Résiliation</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">12.1 Par l&apos;Utilisateur</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            L&apos;Utilisateur peut résilier son compte à tout moment en contactant le support ou via les
            paramètres de son compte. La résiliation entraîne la perte des crédits non utilisés. La résiliation
            d&apos;un abonnement obéit aux modalités de l&apos;Article 4 bis (prise d&apos;effet à la fin de la
            période déjà payée).
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">12.2 Par l&apos;Éditeur</h3>
          <p className="prestige-body text-muted-foreground">
            L&apos;Éditeur peut résilier un compte en cas de violation des CGV, sans préavis et sans
            remboursement des crédits restants.
          </p>
        </section>

        {/* Article 13 - Droit applicable */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Article 13 - Droit applicable et litiges</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">13.1 Droit applicable</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Les présentes CGV sont régies par le <strong className="text-foreground">droit suisse</strong>.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">13.2 Médiation (consommateurs UE)</h3>
          <p className="prestige-body text-muted-foreground mb-4">
            Conformément à l&apos;article 14 du Règlement (UE) n°524/2013, les consommateurs de l&apos;UE peuvent
            recourir à la plateforme européenne de règlement en ligne des litiges :{' '}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--gold)] hover:underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">13.3 Juridiction compétente</h3>
          <p className="prestige-body text-muted-foreground">
            À défaut de règlement amiable, les litiges seront soumis aux tribunaux compétents du
            <strong className="text-foreground"> Canton de Vaud (Suisse)</strong>. Pour les consommateurs de l&apos;UE, les juridictions
            de leur pays de résidence restent compétentes.
          </p>
        </section>

        {/* Annexe - Formulaire de rétractation */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Annexe - Formulaire de rétractation (consommateurs UE)</h2>
          <div className="bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] p-4 rounded-lg text-muted-foreground">
            <p className="mb-4 text-sm italic">
              (Ce formulaire est fourni à titre informatif. Le droit de rétractation ne s&apos;applique pas
              aux crédits déjà utilisés - voir Article 6)
            </p>
            <p className="mb-2">À l&apos;attention de :</p>
            <p className="mb-4">
              Moustadrif E-Comm<br />
              Route du Bon 3, 1167 Lussy-sur-Morges, Suisse<br />
              Email : contact@instadeco.app
            </p>
            <p className="mb-2">
              Je/Nous (*) notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat
              portant sur la vente du bien (*) / la prestation de service (*) ci-dessous :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
              <li>Commandé le (*) / reçu le (*) :</li>
              <li>Nom du consommateur :</li>
              <li>Adresse du consommateur :</li>
              <li>Date :</li>
              <li>Signature (uniquement si formulaire papier) :</li>
            </ul>
            <p className="text-sm">(*) Rayez les mentions inutiles.</p>
          </div>
        </section>

        {/* Liens */}
        <section className="bg-card border border-border rounded-lg shadow-sm p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Documents complémentaires</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/legal/mentions-legales" className="text-[var(--gold)] hover:underline inline-flex items-center gap-2">
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                Mentions Légales
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="text-[var(--gold)] hover:underline">
                → Politique de Confidentialité
              </Link>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-lg p-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Contact</h2>
          <p className="prestige-body text-muted-foreground">
            Pour toute question concernant les présentes CGV :<br />
            <a href="mailto:contact@instadeco.app" className="text-[var(--gold)] hover:underline font-medium">
              contact@instadeco.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
