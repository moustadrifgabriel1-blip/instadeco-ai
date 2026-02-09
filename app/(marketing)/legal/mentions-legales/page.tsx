import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mentions Légales | InstaDeco AI',
  description: 'Informations légales sur InstaDeco AI - Éditeur, hébergeur et conditions d\'utilisation du service.',
  robots: 'index, follow',
};

export default function MentionsLegalesPage() {
  const lastUpdated = '22 janvier 2026';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Mentions Légales</h1>
        
        <p className="text-sm text-gray-500 mb-8">
          Dernière mise à jour : {lastUpdated}
        </p>

        {/* Éditeur du site */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Éditeur du site</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>Raison sociale :</strong> Moustadrif E-Comm</p>
            <p><strong>Forme juridique :</strong> Entreprise individuelle</p>
            <p><strong>Titulaire :</strong> Gabriel Moustadrif</p>
            <p><strong>Adresse du siège :</strong> Route du Bon 3, 1167 Lussy-sur-Morges, Vaud, Suisse</p>
            <p><strong>Numéro IDE :</strong> CHE-145.897.362</p>
            <p><strong>Email :</strong> <a href="mailto:contact@instadeco.app" className="text-blue-600 hover:underline">contact@instadeco.app</a></p>
            <p><strong>Site web :</strong> <a href="https://instadeco.app" className="text-blue-600 hover:underline">https://instadeco.app</a></p>
          </div>
        </section>

        {/* Directeur de publication */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Directeur de la publication</h2>
          <p className="text-gray-700">
            <strong>Gabriel Moustadrif</strong><br />
            Contact : <a href="mailto:contact@instadeco.app" className="text-blue-600 hover:underline">contact@instadeco.app</a>
          </p>
        </section>

        {/* Hébergement */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Hébergement</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <p><strong>Application web :</strong></p>
              <p>Vercel Inc.</p>
              <p>340 S Lemon Ave #4133</p>
              <p>Walnut, CA 91789, États-Unis</p>
              <p>Site : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://vercel.com</a></p>
            </div>
            <div>
              <p><strong>Base de données et stockage :</strong></p>
              <p>Supabase Inc.</p>
              <p>970 Toa Payoh North #07-04</p>
              <p>Singapour 318992</p>
              <p>Site : <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://supabase.com</a></p>
            </div>
          </div>
        </section>

        {/* Nature du service */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Nature du service</h2>
          <p className="text-gray-700 mb-4">
            <strong>InstaDeco AI</strong> est un service en ligne (SaaS) de décoration d&apos;intérieur assistée par intelligence artificielle. 
            Le service permet aux utilisateurs de :
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
            <li>Télécharger des photos de leurs pièces</li>
            <li>Sélectionner un style de décoration</li>
            <li>Générer des propositions de redécoration par IA</li>
            <li>Télécharger les images générées en haute définition (HD)</li>
          </ul>
        </section>

        {/* Propriété intellectuelle */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Propriété intellectuelle</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              L&apos;ensemble du contenu du site InstaDeco AI (textes, graphismes, logos, icônes, images, 
              code source, logiciels) est la propriété exclusive de Moustadrif E-Comm ou de ses partenaires 
              et est protégé par les lois suisses et internationales relatives à la propriété intellectuelle.
            </p>
            <p>
              <strong>Images générées par l&apos;utilisateur :</strong> L&apos;utilisateur conserve la propriété 
              de ses images d&apos;origine. Les images générées par le service d&apos;IA sont mises à disposition 
              de l&apos;utilisateur sous licence d&apos;utilisation personnelle et commerciale conformément aux 
              Conditions Générales de Vente.
            </p>
            <p>
              Toute reproduction, distribution, modification ou utilisation du contenu du site sans 
              autorisation écrite préalable est interdite et constitue une contrefaçon sanctionnée par 
              les articles 67 et suivants de la Loi fédérale sur le droit d&apos;auteur (LDA).
            </p>
          </div>
        </section>

        {/* Limitation de responsabilité */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Limitation de responsabilité</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              <strong>6.1 Disponibilité du service :</strong> Moustadrif E-Comm s&apos;efforce d&apos;assurer 
              l&apos;accès au site 24h/24, 7j/7, mais ne peut garantir une disponibilité absolue. 
              Le service peut être interrompu pour maintenance, mises à jour ou cas de force majeure.
            </p>
            <p>
              <strong>6.2 Contenu généré par IA :</strong> Les images générées par l&apos;intelligence 
              artificielle sont fournies à titre indicatif et créatif. Moustadrif E-Comm ne garantit 
              pas que les propositions de décoration soient réalisables, conformes aux normes de 
              construction, ou adaptées à tous les espaces.
            </p>
            <p>
              <strong>6.3 Utilisation des résultats :</strong> L&apos;utilisateur est seul responsable 
              de l&apos;utilisation qu&apos;il fait des images générées et des décisions de décoration 
              prises sur cette base.
            </p>
            <p>
              <strong>6.4 Dommages indirects :</strong> En aucun cas, Moustadrif E-Comm ne pourra 
              être tenu responsable des dommages indirects, accessoires, spéciaux ou consécutifs 
              résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser le service.
            </p>
          </div>
        </section>

        {/* Droit applicable */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Droit applicable et juridiction</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Les présentes mentions légales sont régies par le droit suisse.
            </p>
            <p>
              En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes, 
              les parties s&apos;efforceront de trouver une solution amiable. À défaut, les tribunaux 
              compétents du Canton de Vaud (Suisse) seront seuls compétents.
            </p>
            <p>
              Pour les consommateurs résidant dans l&apos;Union européenne, les dispositions impératives 
              de protection des consommateurs de leur pays de résidence s&apos;appliquent.
            </p>
          </div>
        </section>

        {/* Liens vers autres pages légales */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Documents complémentaires</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                → Politique de confidentialité (Protection des données)
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
            Pour toute question concernant ces mentions légales, vous pouvez nous contacter à :<br />
            <a href="mailto:contact@instadeco.app" className="text-blue-600 hover:underline font-medium">
              contact@instadeco.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
