import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente (CGV) | InstaDeco AI',
  description: 'Conditions générales de vente du service InstaDeco AI - Crédits, paiements, droit de rétractation et utilisation du service.',
  robots: 'index, follow',
};

export default function CGVPage() {
  const lastUpdated = '22 janvier 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Conditions Générales de Vente</h1>
        
        <p className="text-lg text-gray-600 mb-2">
          Applicables au service InstaDeco AI
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {lastUpdated}
        </p>

        {/* Préambule */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Préambule</h2>
          <p className="text-gray-700 mb-4">
            Les présentes Conditions Générales de Vente (ci-après &quot;CGV&quot;) régissent l&apos;utilisation du 
            service <strong>InstaDeco AI</strong>, accessible à l&apos;adresse{' '}
            <a href="https://instadeco.app" className="text-blue-600 hover:underline">https://instadeco.app</a>, 
            édité par :
          </p>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
            <p><strong>Moustadrif E-Comm</strong></p>
            <p>Route du Bon 3, 1167 Lussy-sur-Morges, Vaud, Suisse</p>
            <p>IDE : CHE-145.897.362</p>
            <p>Email : <a href="mailto:contact@instadeco.app" className="text-blue-600 hover:underline">contact@instadeco.app</a></p>
          </div>
          <p className="text-gray-700 mt-4">
            En utilisant le service et en achetant des crédits, l&apos;utilisateur déclare avoir pris connaissance 
            des présentes CGV et les accepte sans réserve.
          </p>
        </section>

        {/* Article 1 - Définitions */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 1 - Définitions</h2>
          <ul className="space-y-2 text-gray-700">
            <li><strong>&quot;Service&quot;</strong> : Le service de génération d&apos;images de décoration d&apos;intérieur par intelligence artificielle proposé par InstaDeco AI.</li>
            <li><strong>&quot;Utilisateur&quot;</strong> : Toute personne physique majeure (18 ans et plus) utilisant le Service.</li>
            <li><strong>&quot;Crédit&quot;</strong> : Unité de valeur permettant d&apos;utiliser les fonctionnalités du Service. 1 crédit = 1 génération d&apos;image.</li>
            <li><strong>&quot;Génération&quot;</strong> : Création d&apos;une image de décoration par l&apos;IA à partir d&apos;une photo fournie par l&apos;Utilisateur.</li>
            <li><strong>&quot;HD Unlock&quot;</strong> : Option de téléchargement en haute définition d&apos;une image générée.</li>
          </ul>
        </section>

        {/* Article 2 - Description du service */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 2 - Description du Service</h2>
          <p className="text-gray-700 mb-4">
            InstaDeco AI est un service en ligne (SaaS) permettant aux utilisateurs de :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Télécharger des photos de leurs pièces intérieures</li>
            <li>Sélectionner un style de décoration parmi les options proposées</li>
            <li>Générer des propositions de redécoration par intelligence artificielle</li>
            <li>Visualiser et télécharger les images générées</li>
            <li>Débloquer la version haute définition (HD) des images générées</li>
          </ul>
          <p className="text-gray-700 mt-4">
            Le Service est fourni en l&apos;état (&quot;as is&quot;). Les résultats générés par l&apos;IA sont à titre 
            indicatif et créatif et ne constituent pas des conseils professionnels en décoration ou architecture.
          </p>
        </section>

        {/* Article 3 - Conditions d'accès */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 3 - Conditions d&apos;accès</h2>
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.1 Inscription</h3>
          <p className="text-gray-700 mb-4">
            L&apos;utilisation du Service nécessite la création d&apos;un compte utilisateur. L&apos;Utilisateur doit 
            fournir une adresse email valide et créer un mot de passe sécurisé.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.2 Capacité juridique</h3>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
            <p className="text-gray-700">
              <strong className="text-red-700">⚠️ SERVICE RÉSERVÉ AUX PERSONNES MAJEURES (18 ANS ET PLUS)</strong>
            </p>
            <p className="text-gray-700 mt-2">
              L&apos;Utilisateur doit avoir la capacité juridique de contracter. En créant un compte et en utilisant 
              le Service, l&apos;Utilisateur déclare et garantit être âgé d&apos;au moins 18 ans.
            </p>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.3 Crédits offerts</h3>
          <p className="text-gray-700">
            À la création du compte, <strong>3 crédits gratuits</strong> sont offerts pour permettre à 
            l&apos;Utilisateur de tester le Service.
          </p>
        </section>

        {/* Article 4 - Prix et paiement */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 4 - Prix et paiement</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.1 Tarifs des crédits</h3>
          <p className="text-gray-700 mb-4">Les prix sont indiqués TTC (TVA non applicable - Art. 21 ch. 19 LTVA).</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700 mb-4">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Pack</th>
                  <th className="px-4 py-2 text-left font-semibold">Crédits</th>
                  <th className="px-4 py-2 text-left font-semibold">Prix EUR</th>
                  <th className="px-4 py-2 text-left font-semibold">Prix CHF</th>
                  <th className="px-4 py-2 text-left font-semibold">Prix/crédit</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2">Pack Starter</td>
                  <td className="px-4 py-2">10 crédits</td>
                  <td className="px-4 py-2 font-medium">9,90 €</td>
                  <td className="px-4 py-2 font-medium">9,90 CHF</td>
                  <td className="px-4 py-2">0,99 € / 0,99 CHF</td>
                </tr>
                <tr className="border-b bg-blue-50">
                  <td className="px-4 py-2">Pack Pro <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Populaire</span></td>
                  <td className="px-4 py-2">25 crédits</td>
                  <td className="px-4 py-2 font-medium">19,90 €</td>
                  <td className="px-4 py-2 font-medium">19,90 CHF</td>
                  <td className="px-4 py-2">0,80 € / 0,80 CHF</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2">Pack 50</td>
                  <td className="px-4 py-2">50 crédits</td>
                  <td className="px-4 py-2 font-medium">34,90 €</td>
                  <td className="px-4 py-2 font-medium">34,90 CHF</td>
                  <td className="px-4 py-2">0,70 € / 0,70 CHF</td>
                </tr>
                <tr className="border-b bg-green-50">
                  <td className="px-4 py-2">Pack 100 <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">Meilleure offre</span></td>
                  <td className="px-4 py-2">100 crédits</td>
                  <td className="px-4 py-2 font-medium">59,90 €</td>
                  <td className="px-4 py-2 font-medium">59,90 CHF</td>
                  <td className="px-4 py-2">0,60 € / 0,60 CHF</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.2 Téléchargement HD</h3>
          <p className="text-gray-700 mb-4">
            Le téléchargement en haute définition d&apos;une image générée est facturé <strong>4,99 € / 4,99 CHF</strong> 
            par image (paiement unique par image).
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.3 Moyens de paiement</h3>
          <p className="text-gray-700 mb-4">
            Les paiements sont traités de manière sécurisée par <strong>Stripe</strong>. 
            Les moyens de paiement acceptés sont :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
            <li>Cartes bancaires (Visa, Mastercard, American Express)</li>
            <li>Apple Pay et Google Pay</li>
            <li>Autres moyens selon disponibilité Stripe</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.4 Facturation</h3>
          <p className="text-gray-700">
            Un reçu électronique est envoyé automatiquement par email après chaque achat.
          </p>
        </section>

        {/* Article 5 - Crédits */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 5 - Fonctionnement des crédits</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.1 Utilisation des crédits</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li><strong>1 crédit = 1 génération d&apos;image</strong> de décoration d&apos;intérieur</li>
            <li>Les crédits sont débités au moment du lancement de la génération</li>
            <li>En cas d&apos;échec technique de la génération, les crédits sont automatiquement recrédités</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.2 Validité des crédits</h3>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-gray-700">
              <strong>✓ Les crédits n&apos;expirent pas.</strong> Ils restent disponibles sur votre compte 
              sans limite de durée tant que le compte reste actif.
            </p>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.3 Non-transférabilité</h3>
          <p className="text-gray-700">
            Les crédits sont personnels et non transférables. Ils ne peuvent pas être cédés, 
            vendus ou échangés avec d&apos;autres utilisateurs.
          </p>
        </section>

        {/* Article 6 - Droit de rétractation */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 6 - Droit de rétractation</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.1 Principe</h3>
          <p className="text-gray-700 mb-4">
            Conformément à l&apos;article L.221-28 du Code de la consommation (applicable aux consommateurs de l&apos;UE), 
            le droit de rétractation <strong>ne s&apos;applique pas</strong> aux contrats de fourniture de contenu 
            numérique non fourni sur un support matériel dont l&apos;exécution a commencé avec l&apos;accord préalable 
            exprès du consommateur.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.2 Renonciation au droit de rétractation</h3>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-gray-700">
              <strong>En procédant à l&apos;achat de crédits et en utilisant le Service</strong> (génération d&apos;images), 
              l&apos;Utilisateur accepte expressément que l&apos;exécution du contrat commence immédiatement et 
              <strong> renonce à son droit de rétractation de 14 jours</strong> concernant les crédits déjà utilisés.
            </p>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.3 Crédits non utilisés</h3>
          <p className="text-gray-700">
            Les crédits non utilisés ne sont pas remboursables après achat. Ils restent disponibles 
            sur votre compte sans limitation de durée.
          </p>
        </section>

        {/* Article 7 - Propriété intellectuelle */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 7 - Propriété intellectuelle</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.1 Images originales</h3>
          <p className="text-gray-700 mb-4">
            L&apos;Utilisateur conserve l&apos;intégralité de ses droits sur les images qu&apos;il télécharge. 
            Il garantit disposer des droits nécessaires sur ces images et dégage l&apos;Éditeur de toute 
            responsabilité en cas de violation de droits de tiers.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.2 Images générées</h3>
          <p className="text-gray-700 mb-4">
            Les images générées par l&apos;IA sont mises à disposition de l&apos;Utilisateur avec une licence 
            d&apos;utilisation <strong>personnelle et commerciale</strong>. L&apos;Utilisateur peut :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
            <li>Utiliser les images pour ses projets personnels</li>
            <li>Utiliser les images pour des projets commerciaux (décoration, présentation client, etc.)</li>
            <li>Partager et publier les images</li>
          </ul>
          <p className="text-gray-700">
            <strong>Limitations :</strong> L&apos;Utilisateur ne peut pas prétendre à la propriété exclusive 
            des images générées par l&apos;IA ni les utiliser pour entraîner d&apos;autres modèles d&apos;IA.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.3 Éléments du Service</h3>
          <p className="text-gray-700">
            Tous les éléments du site (logos, interface, code, textes) sont protégés par le droit 
            d&apos;auteur et appartiennent à Moustadrif E-Comm.
          </p>
        </section>

        {/* Article 8 - Utilisation acceptable */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 8 - Utilisation acceptable</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">8.1 Usages autorisés</h3>
          <p className="text-gray-700 mb-4">
            Le Service est destiné à la génération d&apos;images de décoration d&apos;intérieur à partir de photos 
            de pièces réelles ou virtuelles.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">8.2 Usages interdits</h3>
          <p className="text-gray-700 mb-2">L&apos;Utilisateur s&apos;engage à ne pas :</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
            <li>Télécharger des images à caractère illégal, pornographique, violent ou haineux</li>
            <li>Utiliser le Service à des fins frauduleuses</li>
            <li>Tenter de contourner les mesures de sécurité ou les limitations du Service</li>
            <li>Revendre ou redistribuer l&apos;accès au Service</li>
            <li>Utiliser des bots ou scripts automatisés</li>
            <li>Télécharger des images violant les droits de propriété intellectuelle de tiers</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">8.3 Modération</h3>
          <p className="text-gray-700">
            Le Service intègre des filtres automatiques pour prévenir la génération de contenu inapproprié. 
            En cas de violation, le compte peut être suspendu ou résilié sans remboursement des crédits restants.
          </p>
        </section>

        {/* Article 9 - Limitation de responsabilité */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 9 - Limitation de responsabilité</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.1 Nature du Service</h3>
          <p className="text-gray-700 mb-4">
            Le Service utilise l&apos;intelligence artificielle pour générer des propositions de décoration. 
            Les résultats sont fournis à titre <strong>indicatif et créatif uniquement</strong>.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.2 Exclusions de garantie</h3>
          <p className="text-gray-700 mb-2">L&apos;Éditeur ne garantit pas :</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 mb-4">
            <li>Que les propositions de décoration soient réalisables physiquement</li>
            <li>La conformité des propositions aux normes de construction ou d&apos;urbanisme</li>
            <li>L&apos;adéquation des propositions aux goûts ou besoins spécifiques de l&apos;Utilisateur</li>
            <li>La disponibilité des meubles ou objets représentés dans les images générées</li>
            <li>L&apos;absence totale d&apos;interruption du Service</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.3 Plafond de responsabilité</h3>
          <p className="text-gray-700">
            La responsabilité de l&apos;Éditeur est limitée au montant des sommes effectivement payées par 
            l&apos;Utilisateur au cours des 12 derniers mois précédant le fait générateur de responsabilité.
          </p>
        </section>

        {/* Article 10 - Protection des données */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 10 - Protection des données personnelles</h2>
          <p className="text-gray-700 mb-4">
            Le traitement des données personnelles est régi par notre{' '}
            <Link href="/legal/privacy" className="text-blue-600 hover:underline">
              Politique de Confidentialité
            </Link>, 
            conforme à la nLPD suisse et au RGPD européen.
          </p>
          <p className="text-gray-700">
            L&apos;acceptation des présentes CGV vaut acceptation de la Politique de Confidentialité.
          </p>
        </section>

        {/* Article 11 - Modification */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 11 - Modification des CGV</h2>
          <p className="text-gray-700 mb-4">
            L&apos;Éditeur se réserve le droit de modifier les présentes CGV à tout moment. 
            Les modifications entrent en vigueur dès leur publication sur le site.
          </p>
          <p className="text-gray-700">
            En cas de modification substantielle des conditions tarifaires ou des droits de l&apos;Utilisateur, 
            un email d&apos;information sera envoyé. L&apos;utilisation continue du Service après notification 
            vaut acceptation des nouvelles CGV.
          </p>
        </section>

        {/* Article 12 - Résiliation */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 12 - Résiliation</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">12.1 Par l&apos;Utilisateur</h3>
          <p className="text-gray-700 mb-4">
            L&apos;Utilisateur peut résilier son compte à tout moment en contactant le support ou via les 
            paramètres de son compte. La résiliation entraîne la perte des crédits non utilisés.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">12.2 Par l&apos;Éditeur</h3>
          <p className="text-gray-700">
            L&apos;Éditeur peut résilier un compte en cas de violation des CGV, sans préavis et sans 
            remboursement des crédits restants.
          </p>
        </section>

        {/* Article 13 - Droit applicable */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Article 13 - Droit applicable et litiges</h2>
          
          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">13.1 Droit applicable</h3>
          <p className="text-gray-700 mb-4">
            Les présentes CGV sont régies par le <strong>droit suisse</strong>.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">13.2 Médiation (consommateurs UE)</h3>
          <p className="text-gray-700 mb-4">
            Conformément à l&apos;article 14 du Règlement (UE) n°524/2013, les consommateurs de l&apos;UE peuvent 
            recourir à la plateforme européenne de règlement en ligne des litiges :{' '}
            <a 
              href="https://ec.europa.eu/consumers/odr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>

          <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">13.3 Juridiction compétente</h3>
          <p className="text-gray-700">
            À défaut de règlement amiable, les litiges seront soumis aux tribunaux compétents du 
            <strong> Canton de Vaud (Suisse)</strong>. Pour les consommateurs de l&apos;UE, les juridictions 
            de leur pays de résidence restent compétentes.
          </p>
        </section>

        {/* Annexe - Formulaire de rétractation */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Annexe - Formulaire de rétractation (consommateurs UE)</h2>
          <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
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
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Documents complémentaires</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/legal/mentions-legales" className="text-blue-600 hover:underline">
                → Mentions Légales
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                → Politique de Confidentialité
              </Link>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
          <p className="text-gray-700">
            Pour toute question concernant les présentes CGV :<br />
            <a href="mailto:contact@instadeco.app" className="text-blue-600 hover:underline font-medium">
              contact@instadeco.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
