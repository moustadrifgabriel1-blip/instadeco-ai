import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | InstaDeco AI',
  description: 'Protection de vos données personnelles sur InstaDeco AI - Conforme à la nLPD suisse et au RGPD européen.',
  robots: 'index, follow',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = '22 janvier 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Politique de Confidentialité</h1>
        
        <p className="text-lg text-gray-600 mb-2">
          Protection de vos données personnelles
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {lastUpdated}
        </p>

        {/* Introduction */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
          <p className="text-gray-700 mb-4">
            Moustadrif E-Comm (ci-après &quot;nous&quot;, &quot;notre&quot; ou &quot;InstaDeco AI&quot;) s&apos;engage à 
            protéger la vie privée et les données personnelles de ses utilisateurs.
          </p>
          <p className="text-gray-700 mb-4">
            La présente politique de confidentialité décrit comment nous collectons, utilisons, 
            stockons et protégeons vos données personnelles conformément à :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>La <strong>nouvelle Loi fédérale sur la protection des données (nLPD)</strong> - Suisse</li>
            <li>Le <strong>Règlement Général sur la Protection des Données (RGPD)</strong> - Union européenne</li>
          </ul>
        </section>

        {/* Responsable du traitement */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Responsable du traitement</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Moustadrif E-Comm</strong></p>
            <p>Route du Bon 3, 1167 Lussy-sur-Morges, Suisse</p>
            <p>IDE : CHE-145.897.362</p>
            <p>Email : <a href="mailto:moustadrifecomm@gmail.com" className="text-blue-600 hover:underline">moustadrifecomm@gmail.com</a></p>
          </div>
        </section>

        {/* Données collectées */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Données personnelles collectées</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Données d&apos;inscription</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Adresse email</li>
            <li>Mot de passe (chiffré)</li>
            <li>Date de création du compte</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Données de paiement</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Informations de paiement (traitées exclusivement par Stripe)</li>
            <li>Historique des transactions</li>
            <li>Solde de crédits</li>
          </ul>
          <p className="text-gray-600 text-sm mt-2 italic">
            Note : Nous ne stockons jamais vos données bancaires. Elles sont gérées directement par Stripe.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.3 Données d&apos;utilisation du service</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Images téléchargées pour la génération</li>
            <li>Images générées par l&apos;IA</li>
            <li>Préférences de style sélectionnées</li>
            <li>Historique des générations</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.4 Données techniques</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Adresse IP (anonymisée)</li>
            <li>Type de navigateur et appareil</li>
            <li>Données de session</li>
          </ul>
        </section>

        {/* Finalités */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Finalités du traitement</h2>
          <p className="text-gray-700 mb-4">Nous utilisons vos données pour :</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Finalité</th>
                  <th className="px-4 py-2 text-left font-semibold">Base légale (RGPD)</th>
                  <th className="px-4 py-2 text-left font-semibold">Base légale (nLPD)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2">Fournir le service de génération IA</td>
                  <td className="px-4 py-2">Exécution du contrat (Art. 6.1.b)</td>
                  <td className="px-4 py-2">Traitement nécessaire au contrat</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Gérer votre compte utilisateur</td>
                  <td className="px-4 py-2">Exécution du contrat (Art. 6.1.b)</td>
                  <td className="px-4 py-2">Traitement nécessaire au contrat</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Traiter les paiements</td>
                  <td className="px-4 py-2">Exécution du contrat (Art. 6.1.b)</td>
                  <td className="px-4 py-2">Traitement nécessaire au contrat</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Assurer la sécurité du service</td>
                  <td className="px-4 py-2">Intérêt légitime (Art. 6.1.f)</td>
                  <td className="px-4 py-2">Intérêt prépondérant</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Respecter les obligations légales</td>
                  <td className="px-4 py-2">Obligation légale (Art. 6.1.c)</td>
                  <td className="px-4 py-2">Obligation légale</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Sous-traitants */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Sous-traitants et transferts de données</h2>
          <p className="text-gray-700 mb-4">
            Nous faisons appel aux sous-traitants suivants pour vous fournir notre service :
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Sous-traitant</th>
                  <th className="px-4 py-2 text-left font-semibold">Fonction</th>
                  <th className="px-4 py-2 text-left font-semibold">Pays</th>
                  <th className="px-4 py-2 text-left font-semibold">Garanties</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium">Fal.ai</td>
                  <td className="px-4 py-2">Génération d&apos;images par IA</td>
                  <td className="px-4 py-2">États-Unis</td>
                  <td className="px-4 py-2">Clauses contractuelles types (CCT)</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium">Supabase</td>
                  <td className="px-4 py-2">Base de données et stockage</td>
                  <td className="px-4 py-2">États-Unis / UE</td>
                  <td className="px-4 py-2">CCT + serveurs UE disponibles</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium">Stripe</td>
                  <td className="px-4 py-2">Traitement des paiements</td>
                  <td className="px-4 py-2">États-Unis / Irlande</td>
                  <td className="px-4 py-2">CCT + Certification PCI DSS</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-medium">Vercel</td>
                  <td className="px-4 py-2">Hébergement de l&apos;application</td>
                  <td className="px-4 py-2">États-Unis</td>
                  <td className="px-4 py-2">Clauses contractuelles types (CCT)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong>Transferts vers les États-Unis :</strong> Conformément aux exigences du RGPD et de la nLPD, 
              ces transferts sont encadrés par des Clauses Contractuelles Types (CCT) approuvées par la Commission 
              européenne et reconnues par le Préposé fédéral suisse à la protection des données.
            </p>
          </div>
        </section>

        {/* Durée de conservation */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Durée de conservation</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Type de données</th>
                  <th className="px-4 py-2 text-left font-semibold">Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2">Données de compte</td>
                  <td className="px-4 py-2">Durée du compte + 3 ans après suppression</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Images téléchargées</td>
                  <td className="px-4 py-2">90 jours après génération</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Images générées</td>
                  <td className="px-4 py-2">Durée du compte (sauf suppression manuelle)</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Données de paiement</td>
                  <td className="px-4 py-2">10 ans (obligation légale comptable)</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Logs techniques</td>
                  <td className="px-4 py-2">30 jours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Vos droits */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Vos droits</h2>
          <p className="text-gray-700 mb-4">
            Conformément au RGPD et à la nLPD, vous disposez des droits suivants :
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <div>
                <strong className="text-gray-800">Droit d&apos;accès</strong>
                <p className="text-gray-600 text-sm">Obtenir une copie de vos données personnelles</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <div>
                <strong className="text-gray-800">Droit de rectification</strong>
                <p className="text-gray-600 text-sm">Corriger vos données inexactes ou incomplètes</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <div>
                <strong className="text-gray-800">Droit à l&apos;effacement (&quot;droit à l&apos;oubli&quot;)</strong>
                <p className="text-gray-600 text-sm">Demander la suppression de vos données</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <div>
                <strong className="text-gray-800">Droit à la portabilité</strong>
                <p className="text-gray-600 text-sm">Recevoir vos données dans un format structuré et réutilisable</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <div>
                <strong className="text-gray-800">Droit d&apos;opposition</strong>
                <p className="text-gray-600 text-sm">Vous opposer au traitement dans certains cas</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <div>
                <strong className="text-gray-800">Droit à la limitation</strong>
                <p className="text-gray-600 text-sm">Limiter le traitement de vos données</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700">
              <strong>Pour exercer vos droits :</strong> Envoyez un email à{' '}
              <a href="mailto:moustadrifecomm@gmail.com" className="text-blue-600 hover:underline">
                moustadrifecomm@gmail.com
              </a>{' '}
              avec une copie de votre pièce d&apos;identité. Nous répondrons dans un délai de 30 jours.
            </p>
          </div>
        </section>

        {/* Sécurité */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Sécurité des données</h2>
          <p className="text-gray-700 mb-4">
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Chiffrement des données en transit (HTTPS/TLS)</li>
            <li>Chiffrement des mots de passe (hash sécurisé)</li>
            <li>Authentification sécurisée</li>
            <li>Accès restreint aux données (principe du moindre privilège)</li>
            <li>Surveillance et journalisation des accès</li>
            <li>Hébergement chez des fournisseurs certifiés</li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies et technologies similaires</h2>
          <p className="text-gray-700 mb-4">
            Nous utilisons uniquement des cookies essentiels au fonctionnement du service :
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Cookie</th>
                  <th className="px-4 py-2 text-left font-semibold">Finalité</th>
                  <th className="px-4 py-2 text-left font-semibold">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">sb-*-auth-token</td>
                  <td className="px-4 py-2">Session d&apos;authentification Supabase</td>
                  <td className="px-4 py-2">Session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-600 text-sm mt-4">
            <strong>Note :</strong> Nous n&apos;utilisons actuellement pas de cookies publicitaires ou de tracking analytique.
          </p>
        </section>

        {/* Mineurs */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Protection des mineurs</h2>
          <p className="text-gray-700">
            Notre service est réservé aux personnes âgées de <strong>18 ans et plus</strong>. 
            Nous ne collectons pas sciemment de données personnelles de mineurs. 
            Si vous êtes parent ou tuteur et pensez que votre enfant nous a fourni des données personnelles, 
            veuillez nous contacter pour demander leur suppression.
          </p>
        </section>

        {/* Réclamations */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Réclamations</h2>
          <p className="text-gray-700 mb-4">
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>
              <strong>En Suisse :</strong> Déposer une plainte auprès du{' '}
              <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Préposé fédéral à la protection des données et à la transparence (PFPDT)
              </a>
            </li>
            <li>
              <strong>Dans l&apos;UE :</strong> Déposer une plainte auprès de l&apos;autorité de protection des données 
              de votre pays de résidence
            </li>
          </ul>
        </section>

        {/* Modifications */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modifications de cette politique</h2>
          <p className="text-gray-700">
            Nous pouvons mettre à jour cette politique de confidentialité. En cas de modifications substantielles, 
            nous vous en informerons par email ou via une notification sur le site. La date de dernière mise à jour 
            est indiquée en haut de cette page.
          </p>
        </section>

        {/* Liens */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Documents complémentaires</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/legal/mentions-legales" className="text-blue-600 hover:underline">
                → Mentions Légales
              </Link>
            </li>
            <li>
              <Link href="/legal/cgv" className="text-blue-600 hover:underline">
                → Conditions Générales de Vente (CGV)
              </Link>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-700">
            Pour toute question concernant la protection de vos données :<br />
            <a href="mailto:moustadrifecomm@gmail.com" className="text-blue-600 hover:underline font-medium">
              moustadrifecomm@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
