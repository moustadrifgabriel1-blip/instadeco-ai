import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { getLocalizedCanonicalUrl } from '@/lib/seo/config';
import { LegalFrenchBodyNotice } from '@/components/legal/LegalFrenchBodyNotice';
import { Check, AlertTriangle, ArrowRight } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'LegalMeta' });
  return {
    title: t('privacyTitle'),
    description: t('privacyDescription'),
    robots: 'index, follow',
    alternates: {
      canonical: getLocalizedCanonicalUrl(locale, '/legal/privacy'),
      languages: {
        'fr-FR': getLocalizedCanonicalUrl('fr', '/legal/privacy'),
        en: getLocalizedCanonicalUrl('en', '/legal/privacy'),
        de: getLocalizedCanonicalUrl('de', '/legal/privacy'),
        'x-default': getLocalizedCanonicalUrl('fr', '/legal/privacy'),
      },
    },
  };
}

export default function PrivacyPolicyPage() {
  const lastUpdated = '22 juin 2026';

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <LegalFrenchBodyNotice />
        <p className="prestige-eyebrow mb-3">Confidentialité</p>
        <h1 className="prestige-display text-4xl font-bold text-foreground mb-4">
          Politique de <span className="text-[var(--gold)]">Confidentialité</span>
        </h1>

        <p className="prestige-body text-lg text-muted-foreground mb-2">
          Protection de vos données personnelles
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Dernière mise à jour : {lastUpdated}
        </p>

        {/* Introduction */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Introduction</h2>
          <p className="text-muted-foreground mb-4">
            Moustadrif E-Comm (ci-après &quot;nous&quot;, &quot;notre&quot; ou &quot;InstaDeco AI&quot;) s&apos;engage à
            protéger la vie privée et les données personnelles de ses utilisateurs.
          </p>
          <p className="text-muted-foreground mb-4">
            La présente politique de confidentialité décrit comment nous collectons, utilisons,
            stockons et protégeons vos données personnelles conformément à :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>La <strong className="text-foreground">nouvelle Loi fédérale sur la protection des données (nLPD)</strong>, Suisse</li>
            <li>Le <strong className="text-foreground">Règlement Général sur la Protection des Données (RGPD)</strong>, Union européenne</li>
          </ul>
        </section>

        {/* Responsable du traitement */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">1. Responsable du traitement</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong className="text-foreground">Moustadrif E-Comm</strong></p>
            <p>Route du Bon 3, 1167 Lussy-sur-Morges, Suisse</p>
            <p>IDE : CHE-145.897.362</p>
            <p>Email : <a href="mailto:contact@instadeco.app" className="text-[var(--gold)] hover:underline">contact@instadeco.app</a></p>
          </div>
        </section>

        {/* Données collectées */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">2. Données personnelles collectées</h2>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">2.1 Données d&apos;inscription</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>Adresse email</li>
            <li>Mot de passe (chiffré)</li>
            <li>Date de création du compte</li>
          </ul>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">2.2 Données de paiement</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>Informations de paiement (traitées exclusivement par Stripe)</li>
            <li>Historique des transactions</li>
            <li>Solde de crédits</li>
          </ul>
          <p className="text-muted-foreground text-sm mt-2 italic">
            Note : Nous ne stockons jamais vos données bancaires. Elles sont gérées directement par Stripe.
          </p>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">2.3 Données d&apos;utilisation du service</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>Images téléchargées pour la génération</li>
            <li>Images générées par l&apos;IA</li>
            <li>Préférences de style sélectionnées</li>
            <li>Historique des générations</li>
          </ul>

          <h3 className="prestige-display text-lg font-medium text-foreground mt-4 mb-2">2.4 Données techniques</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
            <li>Adresse IP (anonymisée)</li>
            <li>Type de navigateur et appareil</li>
            <li>Données de session</li>
          </ul>
        </section>

        {/* Finalités */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">3. Finalités du traitement</h2>
          <p className="text-muted-foreground mb-4">Nous utilisons vos données pour :</p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-muted-foreground">
              <thead className="bg-[rgba(200,162,77,0.12)]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Finalité</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Base légale (RGPD)</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Base légale (nLPD)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Fournir le service de génération IA</td>
                  <td className="px-4 py-2">Exécution du contrat (Art. 6.1.b)</td>
                  <td className="px-4 py-2">Traitement nécessaire au contrat</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Gérer votre compte utilisateur</td>
                  <td className="px-4 py-2">Exécution du contrat (Art. 6.1.b)</td>
                  <td className="px-4 py-2">Traitement nécessaire au contrat</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Traiter les paiements</td>
                  <td className="px-4 py-2">Exécution du contrat (Art. 6.1.b)</td>
                  <td className="px-4 py-2">Traitement nécessaire au contrat</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Assurer la sécurité du service</td>
                  <td className="px-4 py-2">Intérêt légitime (Art. 6.1.f)</td>
                  <td className="px-4 py-2">Intérêt prépondérant</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Respecter les obligations légales</td>
                  <td className="px-4 py-2">Obligation légale (Art. 6.1.c)</td>
                  <td className="px-4 py-2">Obligation légale</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Sous-traitants */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">4. Sous-traitants et transferts de données</h2>
          <p className="text-muted-foreground mb-4">
            Nous faisons appel aux sous-traitants suivants pour vous fournir notre service :
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-muted-foreground">
              <thead className="bg-[rgba(200,162,77,0.12)]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Sous-traitant</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Fonction</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Pays</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Garanties</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Google (Gemini API)</td>
                  <td className="px-4 py-2">Génération d&apos;images par IA (traitement de la photo transmise)</td>
                  <td className="px-4 py-2">États-Unis</td>
                  <td className="px-4 py-2">Clauses contractuelles types (CCT)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Fal.ai</td>
                  <td className="px-4 py-2">Génération d&apos;images par IA (moteur alternatif / de secours)</td>
                  <td className="px-4 py-2">États-Unis</td>
                  <td className="px-4 py-2">Clauses contractuelles types (CCT)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Supabase</td>
                  <td className="px-4 py-2">Base de données et stockage</td>
                  <td className="px-4 py-2">États-Unis / UE</td>
                  <td className="px-4 py-2">CCT + serveurs UE disponibles</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Stripe</td>
                  <td className="px-4 py-2">Traitement des paiements</td>
                  <td className="px-4 py-2">États-Unis / Irlande</td>
                  <td className="px-4 py-2">CCT + Certification PCI DSS</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Vercel</td>
                  <td className="px-4 py-2">Hébergement de l&apos;application</td>
                  <td className="px-4 py-2">États-Unis</td>
                  <td className="px-4 py-2">Clauses contractuelles types (CCT)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-medium text-foreground">Resend</td>
                  <td className="px-4 py-2">Envoi des emails transactionnels et marketing</td>
                  <td className="px-4 py-2">États-Unis</td>
                  <td className="px-4 py-2">Clauses contractuelles types (CCT)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-lg">
            <p className="text-muted-foreground text-sm">
              <strong className="text-[var(--gold)]">Transferts vers les États-Unis :</strong> Conformément aux exigences du RGPD et de la nLPD,
              ces transferts sont encadrés par des Clauses Contractuelles Types (CCT) approuvées par la Commission
              européenne et reconnues par le Préposé fédéral suisse à la protection des données.
            </p>
          </div>
        </section>

        {/* Durée de conservation */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">5. Durée de conservation</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-muted-foreground">
              <thead className="bg-[rgba(200,162,77,0.12)]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Type de données</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Données de compte</td>
                  <td className="px-4 py-2">Durée du compte + 3 ans après suppression</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Images téléchargées</td>
                  <td className="px-4 py-2">90 jours après génération</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Images générées</td>
                  <td className="px-4 py-2">Durée du compte (sauf suppression manuelle)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Données de paiement</td>
                  <td className="px-4 py-2">10 ans (obligation légale comptable)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-4 py-2">Logs techniques</td>
                  <td className="px-4 py-2">30 jours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Vos droits */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">6. Vos droits</h2>
          <p className="text-muted-foreground mb-4">
            Conformément au RGPD et à la nLPD, vous disposez des droits suivants :
          </p>

          <div className="space-y-3">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[var(--gold)] mr-2 shrink-0" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Droit d&apos;accès</strong>
                <p className="text-muted-foreground text-sm">Obtenir une copie de vos données personnelles</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[var(--gold)] mr-2 shrink-0" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Droit de rectification</strong>
                <p className="text-muted-foreground text-sm">Corriger vos données inexactes ou incomplètes</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[var(--gold)] mr-2 shrink-0" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;)</strong>
                <p className="text-muted-foreground text-sm">Demander la suppression de vos données</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[var(--gold)] mr-2 shrink-0" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Droit à la portabilité</strong>
                <p className="text-muted-foreground text-sm">Recevoir vos données dans un format structuré et réutilisable</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[var(--gold)] mr-2 shrink-0" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Droit d&apos;opposition</strong>
                <p className="text-muted-foreground text-sm">Vous opposer au traitement dans certains cas</p>
              </div>
            </div>
            <div className="flex items-start">
              <Check className="w-5 h-5 text-[var(--gold)] mr-2 shrink-0" aria-hidden="true" />
              <div>
                <strong className="text-foreground">Droit à la limitation</strong>
                <p className="text-muted-foreground text-sm">Limiter le traitement de vos données</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-lg">
            <p className="text-muted-foreground">
              <strong className="text-[var(--gold)]">Pour exercer vos droits :</strong> Envoyez un email à{' '}
              <a href="mailto:contact@instadeco.app" className="text-[var(--gold)] hover:underline">
                contact@instadeco.app
              </a>{' '}
              avec une copie de votre pièce d&apos;identité. Nous répondrons dans un délai de 30 jours.
            </p>
          </div>
        </section>

        {/* Sécurité */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">7. Sécurité des données</h2>
          <p className="text-muted-foreground mb-4">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>Chiffrement des données en transit (HTTPS/TLS)</li>
            <li>Chiffrement des mots de passe (hash sécurisé)</li>
            <li>Authentification sécurisée</li>
            <li>Accès restreint aux données (principe du moindre privilège)</li>
            <li>Surveillance et journalisation des accès</li>
            <li>Hébergement chez des fournisseurs certifiés</li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">8. Cookies et technologies similaires</h2>
          <p className="text-muted-foreground mb-4">
            Nous utilisons uniquement des cookies essentiels au fonctionnement du service :
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-muted-foreground">
              <thead className="bg-[rgba(200,162,77,0.12)]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Cookie</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Finalité</th>
                  <th className="px-4 py-2 text-left font-semibold text-foreground">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 font-mono text-xs text-foreground">sb-*-auth-token</td>
                  <td className="px-4 py-2">Session d&apos;authentification Supabase</td>
                  <td className="px-4 py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-muted-foreground text-sm mt-4">
            <strong className="text-foreground">Mesure d&apos;audience (soumise à votre consentement) :</strong> avec votre accord
            explicite, donné via le bandeau cookies, nous utilisons Google Analytics 4 et Meta Pixel pour mesurer
            l&apos;audience du site et l&apos;efficacité de nos campagnes. Ces outils déposent des cookies et peuvent
            transférer des données (adresse IP, identifiant d&apos;appareil) vers Google et Meta, y compris hors de
            l&apos;Union européenne, encadrés par les clauses contractuelles types. Aucun de ces outils n&apos;est activé
            tant que vous n&apos;avez pas accepté ; vous pouvez refuser, et votre choix est respecté. Les cookies
            essentiels ci-dessus, eux, ne nécessitent pas de consentement.
          </p>
        </section>

        {/* Mineurs */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">9. Protection des mineurs</h2>
          <div className="bg-destructive/10 border border-destructive/40 p-4 rounded-lg">
            <p className="text-foreground">
              <strong className="text-destructive inline-flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0" />SERVICE RÉSERVÉ AUX PERSONNES MAJEURES (18 ANS ET PLUS)</strong>
            </p>
            <p className="text-muted-foreground mt-2">
              Notre service est strictement réservé aux personnes âgées de <strong className="text-foreground">18 ans et plus</strong>.
              Nous ne collectons pas sciemment de données personnelles de mineurs.
              Si vous êtes parent ou tuteur et pensez que votre enfant nous a fourni des données personnelles,
              veuillez nous contacter immédiatement pour demander leur suppression.
            </p>
          </div>
        </section>

        {/* Réclamations */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">10. Réclamations</h2>
          <p className="text-muted-foreground mb-4">
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez :
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
            <li>
              <strong className="text-foreground">En Suisse :</strong> Déposer une plainte auprès du{' '}
              <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline">
                Préposé fédéral à la protection des données et à la transparence (PFPDT)
              </a>
            </li>
            <li>
              <strong className="text-foreground">Dans l&apos;UE :</strong> Déposer une plainte auprès de l&apos;autorité de protection des données
              de votre pays de résidence
            </li>
          </ul>
        </section>

        {/* Modifications */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">11. Modifications de cette politique</h2>
          <p className="text-muted-foreground">
            Nous pouvons mettre à jour cette politique de confidentialité. En cas de modifications substantielles,
            nous vous en informerons par email ou via une notification sur le site. La date de dernière mise à jour
            est indiquée en haut de cette page.
          </p>
        </section>

        {/* Liens */}
        <section className="bg-card rounded-lg border border-border p-6 mb-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">12. Documents complémentaires</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/legal/mentions-legales" className="text-[var(--gold)] hover:underline">
                → Mentions Légales
              </Link>
            </li>
            <li>
              <Link href="/legal/cgv" className="text-[var(--gold)] hover:underline">
                → Conditions Générales de Vente (CGV)
              </Link>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] rounded-lg p-6">
          <h2 className="prestige-display text-2xl font-semibold text-foreground mb-4">Contact</h2>
          <p className="text-muted-foreground">
            Pour toute question concernant la protection de vos données :<br />
            <a href="mailto:contact@instadeco.app" className="text-[var(--gold)] hover:underline font-medium">
              contact@instadeco.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
