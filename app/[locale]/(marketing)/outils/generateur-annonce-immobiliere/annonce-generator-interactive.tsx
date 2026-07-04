'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Copy, Check, Sparkles, ArrowRight } from 'lucide-react';
import { LeadMagnet } from '@/components/features/lead-magnet';

const TYPES = ['Appartement', 'Maison', 'Studio', 'Loft', 'Duplex', 'Terrain'] as const;
const TONES: Array<{ id: string; label: string }> = [
  { id: 'chaleureux', label: 'Chaleureux' },
  { id: 'sobre', label: 'Sobre & pro' },
  { id: 'prestige', label: 'Haut de gamme' },
  { id: 'familial', label: 'Familial' },
];
const ATOUTS = [
  'Lumineux',
  'Balcon / terrasse',
  'Vue dégagée',
  'Rénové',
  'Calme',
  'Proche commodités',
  'Parking / garage',
  'Ascenseur',
  'Cave',
  'Jardin',
  'Cuisine équipée',
  'Dernier étage',
] as const;

type Tone = string;

// Démonstratif avec élision : « cet appartement » mais « ce studio ».
function ce(word: string): string {
  return /^[aeiouyàâéèêëîïôûù]/i.test(word) ? `cet ${word}` : `ce ${word}`;
}

function intro(type: string, tone: Tone, city: string): string {
  const lieu = city.trim() ? ` à ${city.trim()}` : '';
  const t = type.toLowerCase();
  switch (tone) {
    case 'prestige':
      return `Rare sur le marché${lieu}, ${ce(t)} d'exception séduit dès le premier regard.`;
    case 'familial':
      return `Idéal pour une famille, ${ce(t)}${lieu} coche toutes les cases du quotidien.`;
    case 'sobre':
      return `À vendre${lieu} : ${t === 'terrain' ? 'un terrain' : `un ${t}`} qui allie fonctionnalité et emplacement.`;
    default:
      return `Coup de cœur assuré pour ${ce(t)}${lieu}, à la fois accueillant et plein de caractère.`;
  }
}

function corps(surface: number, pieces: number, atouts: string[]): string {
  const parts: string[] = [];
  if (surface > 0) {
    parts.push(
      pieces > 0
        ? `D'une surface de ${surface} m², il se compose de ${pieces} pièce${pieces > 1 ? 's' : ''}`
        : `Il offre ${surface} m² à vivre`
    );
  } else if (pieces > 0) {
    parts.push(`Il se compose de ${pieces} pièce${pieces > 1 ? 's' : ''}`);
  }
  let phrase = parts.join('');
  if (atouts.length) {
    const liste = atouts.map((a) => a.toLowerCase());
    const last = liste.length > 1 ? liste.slice(0, -1).join(', ') + ' et ' + liste[liste.length - 1] : liste[0];
    phrase += phrase ? `. Parmi ses atouts : ${last}.` : `Parmi ses atouts : ${last}.`;
  } else if (phrase) {
    phrase += '.';
  }
  return phrase;
}

function cloture(tone: Tone): string {
  switch (tone) {
    case 'prestige':
      return 'Une adresse confidentielle qui ne restera pas longtemps disponible. Visite sur rendez-vous.';
    case 'familial':
      return 'Un bien où poser ses valises sereinement. Organisez vite votre visite.';
    case 'sobre':
      return 'Bien à visiter rapidement. Contactez-nous pour organiser une visite.';
    default:
      return 'Un lieu qui se vit plus qu\'il ne se décrit. À découvrir sans tarder.';
  }
}

export function AnnonceGeneratorInteractive() {
  const [type, setType] = useState<string>('Appartement');
  const [surface, setSurface] = useState(65);
  const [pieces, setPieces] = useState(3);
  const [city, setCity] = useState('');
  const [tone, setTone] = useState<Tone>('chaleureux');
  const [atouts, setAtouts] = useState<string[]>(['Lumineux', 'Rénové', 'Proche commodités']);
  const [copied, setCopied] = useState(false);

  const toggleAtout = (a: string) =>
    setAtouts((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : cur.length < 6 ? [...cur, a] : cur));

  const texte = useMemo(() => {
    const p1 = intro(type, tone, city) + ' ' + corps(surface, pieces, atouts);
    const p2 = cloture(tone);
    return `${p1}\n\n${p2}`.trim();
  }, [type, tone, city, surface, pieces, atouts]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(texte);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-[24px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-6 sm:p-8">
        {/* Type */}
        <p className="prestige-eyebrow !text-[11px] text-[var(--gold)]">Type de bien</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full border px-4 py-2 text-[14px] transition-all ${
                type === t ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.12)] text-[var(--ivory)]' : 'border-[var(--gold-line)] text-[var(--mist)] hover:border-[var(--gold)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Surface + pièces + ville */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="prestige-eyebrow !text-[11px] text-[var(--gold)]">Surface (m²)</span>
            <input
              type="number"
              min={0}
              value={surface}
              onChange={(e) => setSurface(Math.max(0, Number(e.target.value)))}
              className="mt-2 w-full rounded-[12px] border border-[var(--gold-line)] bg-[var(--ink)] px-4 py-2.5 text-base text-[var(--ivory)] focus:border-[var(--gold)] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="prestige-eyebrow !text-[11px] text-[var(--gold)]">Pièces</span>
            <input
              type="number"
              min={0}
              value={pieces}
              onChange={(e) => setPieces(Math.max(0, Number(e.target.value)))}
              className="mt-2 w-full rounded-[12px] border border-[var(--gold-line)] bg-[var(--ink)] px-4 py-2.5 text-base text-[var(--ivory)] focus:border-[var(--gold)] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="prestige-eyebrow !text-[11px] text-[var(--gold)]">Ville / quartier</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Optionnel"
              className="mt-2 w-full rounded-[12px] border border-[var(--gold-line)] bg-[var(--ink)] px-4 py-2.5 text-base text-[var(--ivory)] placeholder:text-[var(--mist)] focus:border-[var(--gold)] focus:outline-none"
            />
          </label>
        </div>

        {/* Ton */}
        <p className="prestige-eyebrow mt-6 !text-[11px] text-[var(--gold)]">Ton de l&apos;annonce</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTone(t.id)}
              className={`rounded-full border px-4 py-2 text-[14px] transition-all ${
                tone === t.id ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.12)] text-[var(--ivory)]' : 'border-[var(--gold-line)] text-[var(--mist)] hover:border-[var(--gold)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Atouts */}
        <p className="prestige-eyebrow mt-6 !text-[11px] text-[var(--gold)]">Atouts (jusqu&apos;à 6)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ATOUTS.map((a) => (
            <button
              key={a}
              onClick={() => toggleAtout(a)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-all ${
                atouts.includes(a) ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.12)] text-[var(--ivory)]' : 'border-[var(--gold-line)] text-[var(--mist)] hover:border-[var(--gold)]'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Sortie */}
      <div className="mt-5 rounded-[24px] border border-[var(--gold)] bg-[rgba(200,162,77,0.06)] p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <p className="prestige-eyebrow !text-[11px] text-[var(--gold)]">Votre annonce</p>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gold-line)] px-3.5 py-1.5 text-[13px] text-[var(--ivory)] transition-colors hover:bg-[rgba(250,248,244,0.06)]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ivory)]">{texte}</p>
        <p className="mt-4 text-[12px] text-[var(--mist)]">
          Un brouillon prêt à personnaliser. Ajustez les détails vrais du bien, et illustrez l&apos;annonce avec de
          belles photos : une pièce meublée se vend mieux qu&apos;une pièce vide.
        </p>
      </div>

      {/* CTA money */}
      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/pro"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-8 py-4 text-[16px] font-semibold text-[#0c0a09] transition-colors hover:bg-[#d4b15f]"
        >
          Meubler mes annonces par IA
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/essai"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--gold-line)] px-8 py-4 text-[16px] font-medium text-[var(--ivory)] transition-colors hover:bg-[rgba(250,248,244,0.06)]"
        >
          <Sparkles className="h-4 w-4" />
          Tester gratuitement
        </Link>
      </div>

      {/* Capture email + offre */}
      <div className="mt-8">
        <LeadMagnet
          source="annonce_generator"
          title="Recevez vos modèles d'annonces et des visuels qui vendent"
          subtitle="On vous envoie des modèles de descriptions par type de bien, des exemples avant/après et votre offre de bienvenue."
          metadata={{ type_bien: type, ton: tone }}
        />
      </div>
    </div>
  );
}
