import { Metadata } from 'next';
import Link from 'next/link';
import { CITIES, City } from '@/src/shared/constants/cities';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Architecte d\'Intérieur par Ville - IA & Décoration | InstaDeco',
  description: 'Trouvez des idées de décoration adaptées à l\'architecture de votre ville en France, Belgique et Suisse. Rénovez votre intérieur avec notre IA.',
  alternates: {
    canonical: 'https://instadeco.app/architecte-interieur',
  },
};

export default function CitiesIndexPage() {
  // Grouper les villes par pays
  const citiesByCountry = CITIES.reduce((acc, city) => {
    if (!acc[city.country]) {
      acc[city.country] = [];
    }
    acc[city.country].push(city);
    return acc;
  }, {} as Record<string, City[]>);

  const countryNames = {
    'FR': 'France 🇫🇷',
    'BE': 'Belgique 🇧🇪',
    'CH': 'Suisse 🇨🇭',
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          L&apos;Architecte d&apos;Intérieur IA <br className="hidden md:block" />
          <span className="text-primary">partout chez vous</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Découvrez comment notre technologie s&apos;adapte aux spécificités architecturales de votre région. 
          Du charme Haussmannien aux briques du Nord, réinventez votre intérieur.
        </p>
      </div>

      <div className="space-y-16">
        {Object.entries(citiesByCountry).map(([countryCode, cities]) => (
          <section key={countryCode} className="space-y-8">
            <div className="flex items-center gap-4 border-b pb-4">
              <h2 className="text-3xl font-bold">{countryNames[countryCode as keyof typeof countryNames]}</h2>
              <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                {cities.length} villes
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cities.sort((a, b) => a.name.localeCompare(b.name)).map((city) => (
                <Link 
                  key={city.slug} 
                  href={`/architecte-interieur/${city.slug}`}
                  className="group block"
                >
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors hover:shadow-sm bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-primary">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">{city.name}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {city.zip} • {city.region}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-20 pt-10 border-t text-center">
        <h3 className="text-2xl font-bold mb-6">Vous ne trouvez pas votre ville ?</h3>
        <p className="text-muted-foreground mb-8">
          Notre IA fonctionne partout, même si votre ville n&apos;est pas listée ici. 
          Essayez-la dès maintenant avec une photo de votre pièce.
        </p>
        <Link href="/generate">
          <Button size="lg" className="rounded-full px-8">
            Commencer la transformation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
