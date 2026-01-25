export type CountryCode = 'FR' | 'BE' | 'CH';
export type ArchStyle = 'haussmann' | 'brick' | 'modern' | 'timber' | 'stone' | 'mediterranean';

export interface City {
  name: string;
  slug: string;
  region: string; // Region ou Canton (CH) ou Province (BE)
  zip: string;
  country: CountryCode;
  archStyle: ArchStyle; // Pour adapter le texte sur l'architecture locale
}

export const CITIES: City[] = [
  // --- FRANCE (Top 50+) ---
  { name: 'Paris', slug: 'paris', region: 'Île-de-France', zip: '75000', country: 'FR', archStyle: 'haussmann' },
  { name: 'Marseille', slug: 'marseille', region: 'PACA', zip: '13000', country: 'FR', archStyle: 'mediterranean' },
  { name: 'Lyon', slug: 'lyon', region: 'Auvergne-Rhône-Alpes', zip: '69000', country: 'FR', archStyle: 'stone' },
  { name: 'Toulouse', slug: 'toulouse', region: 'Occitanie', zip: '31000', country: 'FR', archStyle: 'brick' },
  { name: 'Nice', slug: 'nice', region: 'PACA', zip: '06000', country: 'FR', archStyle: 'mediterranean' },
  { name: 'Nantes', slug: 'nantes', region: 'Pays de la Loire', zip: '44000', country: 'FR', archStyle: 'stone' },
  { name: 'Montpellier', slug: 'montpellier', region: 'Occitanie', zip: '34000', country: 'FR', archStyle: 'mediterranean' },
  { name: 'Strasbourg', slug: 'strasbourg', region: 'Grand Est', zip: '67000', country: 'FR', archStyle: 'timber' },
  { name: 'Bordeaux', slug: 'bordeaux', region: 'Nouvelle-Aquitaine', zip: '33000', country: 'FR', archStyle: 'stone' },
  { name: 'Lille', slug: 'lille', region: 'Hauts-de-France', zip: '59000', country: 'FR', archStyle: 'brick' },
  { name: 'Rennes', slug: 'rennes', region: 'Bretagne', zip: '35000', country: 'FR', archStyle: 'timber' },
  { name: 'Reims', slug: 'reims', region: 'Grand Est', zip: '51000', country: 'FR', archStyle: 'stone' },
  { name: 'Saint-Étienne', slug: 'saint-etienne', region: 'Auvergne-Rhône-Alpes', zip: '42000', country: 'FR', archStyle: 'modern' },
  { name: 'Toulon', slug: 'toulon', region: 'PACA', zip: '83000', country: 'FR', archStyle: 'mediterranean' },
  { name: 'Le Havre', slug: 'le-havre', region: 'Normandie', zip: '76000', country: 'FR', archStyle: 'modern' },
  { name: 'Grenoble', slug: 'grenoble', region: 'Auvergne-Rhône-Alpes', zip: '38000', country: 'FR', archStyle: 'modern' },
  { name: 'Dijon', slug: 'dijon', region: 'Bourgogne-Franche-Comté', zip: '21000', country: 'FR', archStyle: 'stone' },
  { name: 'Angers', slug: 'angers', region: 'Pays de la Loire', zip: '49000', country: 'FR', archStyle: 'stone' },
  { name: 'Nîmes', slug: 'nimes', region: 'Occitanie', zip: '30000', country: 'FR', archStyle: 'mediterranean' },
  { name: 'Villeurbanne', slug: 'villeurbanne', region: 'Auvergne-Rhône-Alpes', zip: '69100', country: 'FR', archStyle: 'modern' },
  { name: 'Aix-en-Provence', slug: 'aix-en-provence', region: 'PACA', zip: '13100', country: 'FR', archStyle: 'mediterranean' },
  { name: 'Clermont-Ferrand', slug: 'clermont-ferrand', region: 'Auvergne-Rhône-Alpes', zip: '63000', country: 'FR', archStyle: 'stone' },
  { name: 'Le Mans', slug: 'le-mans', region: 'Pays de la Loire', zip: '72000', country: 'FR', archStyle: 'stone' },
  { name: 'Brest', slug: 'brest', region: 'Bretagne', zip: '29200', country: 'FR', archStyle: 'modern' },
  { name: 'Tours', slug: 'tours', region: 'Centre-Val de Loire', zip: '37000', country: 'FR', archStyle: 'stone' },
  { name: 'Amiens', slug: 'amiens', region: 'Hauts-de-France', zip: '80000', country: 'FR', archStyle: 'brick' },
  { name: 'Annecy', slug: 'annecy', region: 'Auvergne-Rhône-Alpes', zip: '74000', country: 'FR', archStyle: 'stone' },
  { name: 'Limoges', slug: 'limoges', region: 'Nouvelle-Aquitaine', zip: '87000', country: 'FR', archStyle: 'stone' },
  { name: 'Boulogne-Billancourt', slug: 'boulogne-billancourt', region: 'Île-de-France', zip: '92100', country: 'FR', archStyle: 'modern' },
  { name: 'Metz', slug: 'metz', region: 'Grand Est', zip: '57000', country: 'FR', archStyle: 'stone' },
  { name: 'Besançon', slug: 'besancon', region: 'Bourgogne-Franche-Comté', zip: '25000', country: 'FR', archStyle: 'stone' },
  { name: 'Perpignan', slug: 'perpignan', region: 'Occitanie', zip: '66000', country: 'FR', archStyle: 'mediterranean' },
  { name: 'Orléans', slug: 'orleans', region: 'Centre-Val de Loire', zip: '45000', country: 'FR', archStyle: 'stone' },
  { name: 'Rouen', slug: 'rouen', region: 'Normandie', zip: '76000', country: 'FR', archStyle: 'timber' },
  { name: 'Mulhouse', slug: 'mulhouse', region: 'Grand Est', zip: '68000', country: 'FR', archStyle: 'modern' },
  { name: 'Caen', slug: 'caen', region: 'Normandie', zip: '14000', country: 'FR', archStyle: 'stone' },
  { name: 'Nancy', slug: 'nancy', region: 'Grand Est', zip: '54000', country: 'FR', archStyle: 'stone' },
  
  // --- BELGIQUE (Francophone + Bruxelles) ---
  { name: 'Bruxelles', slug: 'bruxelles', region: 'Bruxelles-Capitale', zip: '1000', country: 'BE', archStyle: 'brick' },
  { name: 'Liège', slug: 'liege', region: 'Wallonie', zip: '4000', country: 'BE', archStyle: 'brick' },
  { name: 'Namur', slug: 'namur', region: 'Wallonie', zip: '5000', country: 'BE', archStyle: 'brick' },
  { name: 'Charleroi', slug: 'charleroi', region: 'Wallonie', zip: '6000', country: 'BE', archStyle: 'brick' },
  { name: 'Mons', slug: 'mons', region: 'Wallonie', zip: '7000', country: 'BE', archStyle: 'brick' },
  { name: 'Tournai', slug: 'tournai', region: 'Wallonie', zip: '7500', country: 'BE', archStyle: 'brick' },
  { name: 'Louvain-la-Neuve', slug: 'louvain-la-neuve', region: 'Wallonie', zip: '1348', country: 'BE', archStyle: 'modern' },
  { name: 'Waterloo', slug: 'waterloo', region: 'Wallonie', zip: '1410', country: 'BE', archStyle: 'brick' },
  { name: 'Ixelles', slug: 'ixelles', region: 'Bruxelles-Capitale', zip: '1050', country: 'BE', archStyle: 'haussmann' },
  { name: 'Uccle', slug: 'uccle', region: 'Bruxelles-Capitale', zip: '1180', country: 'BE', archStyle: 'modern' },

  // --- SUISSE (Romande / Francophone) ---
  { name: 'Genève', slug: 'geneve', region: 'Genève', zip: '1200', country: 'CH', archStyle: 'modern' },
  { name: 'Lausanne', slug: 'lausanne', region: 'Vaud', zip: '1000', country: 'CH', archStyle: 'stone' },
  { name: 'Fribourg', slug: 'fribourg', region: 'Fribourg', zip: '1700', country: 'CH', archStyle: 'stone' },
  { name: 'Neuchâtel', slug: 'neuchatel', region: 'Neuchâtel', zip: '2000', country: 'CH', archStyle: 'stone' },
  { name: 'Sion', slug: 'sion', region: 'Valais', zip: '1950', country: 'CH', archStyle: 'modern' },
  { name: 'Yverdon-les-Bains', slug: 'yverdon', region: 'Vaud', zip: '1400', country: 'CH', archStyle: 'stone' },
  { name: 'Montreux', slug: 'montreux', region: 'Vaud', zip: '1820', country: 'CH', archStyle: 'haussmann' },
  { name: 'Nyon', slug: 'nyon', region: 'Vaud', zip: '1260', country: 'CH', archStyle: 'stone' },
  { name: 'Bulle', slug: 'bulle', region: 'Fribourg', zip: '1630', country: 'CH', archStyle: 'modern' },
  { name: 'Martigny', slug: 'martigny', region: 'Valais', zip: '1920', country: 'CH', archStyle: 'modern' },
];
