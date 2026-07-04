'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Sofa, Bed, ChefHat, Bath, Briefcase, UtensilsCrossed, ArrowRight, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LeadMagnet } from '@/components/features/lead-magnet';

const ROOMS: Array<{ id: string; name: string; Icon: LucideIcon; defaultArea: number }> = [
  { id: 'salon', name: 'Salon', Icon: Sofa, defaultArea: 25 },
  { id: 'chambre', name: 'Chambre', Icon: Bed, defaultArea: 14 },
  { id: 'cuisine', name: 'Cuisine', Icon: ChefHat, defaultArea: 12 },
  { id: 'salle-a-manger', name: 'Salle à manger', Icon: UtensilsCrossed, defaultArea: 16 },
  { id: 'bureau', name: 'Bureau', Icon: Briefcase, defaultArea: 10 },
  { id: 'salle-de-bain', name: 'Salle de bain', Icon: Bath, defaultArea: 6 },
];

// Fourchettes indicatives €/m² par niveau d'ambition (déco, hors gros œuvre).
const LEVELS: Array<{ id: string; name: string; desc: string; low: number; high: number }> = [
  { id: 'refresh', name: 'Rafraîchissement', desc: 'Peinture, textiles, quelques accessoires', low: 40, high: 90 },
  { id: 'restyle', name: 'Relooking complet', desc: 'Nouveau mobilier, luminaires et déco', low: 150, high: 350 },
  { id: 'reno', name: 'Rénovation déco', desc: 'Sols, meubles sur mesure, éclairage repensé', low: 400, high: 800 },
];

function euro(n: number): string {
  return Math.round(n / 10) * 10 + '';
}
function euroFmt(n: number): string {
  return (Math.round(n / 10) * 10).toLocaleString('fr-FR') + ' €';
}

/**
 * Estimateur de budget déco honnête : fourchettes indicatives €/m² (déco, hors
 * gros œuvre), l'utilisateur choisit pièce + surface + niveau. Résultat présenté
 * comme une fourchette « à titre indicatif », jamais un prix ferme.
 */
export function BudgetEstimatorInteractive() {
  const [roomId, setRoomId] = useState('salon');
  const [levelId, setLevelId] = useState('restyle');
  const room = ROOMS.find((r) => r.id === roomId)!;
  const [area, setArea] = useState(room.defaultArea);

  const level = LEVELS.find((l) => l.id === levelId)!;
  const { low, high } = useMemo(
    () => ({ low: area * level.low, high: area * level.high }),
    [area, level]
  );

  const selectRoom = (id: string) => {
    setRoomId(id);
    setArea(ROOMS.find((r) => r.id === id)!.defaultArea);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-[24px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-6 sm:p-8">
        {/* Pièce */}
        <p className="prestige-eyebrow !text-[11px] text-[var(--gold)]">1. Votre pièce</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ROOMS.map((r) => {
            const active = r.id === roomId;
            return (
              <button
                key={r.id}
                onClick={() => selectRoom(r.id)}
                className={`flex items-center gap-2.5 rounded-[14px] border px-3.5 py-3 text-left transition-all ${
                  active
                    ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.1)]'
                    : 'border-[var(--gold-line)] hover:border-[var(--gold)]'
                }`}
              >
                <r.Icon className={`h-4 w-4 ${active ? 'text-[var(--gold)]' : 'text-[var(--mist)]'}`} aria-hidden="true" />
                <span className="text-[14px] text-[var(--ivory)]">{r.name}</span>
              </button>
            );
          })}
        </div>

        {/* Surface */}
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <label htmlFor="area" className="prestige-eyebrow !text-[11px] text-[var(--gold)]">2. Surface</label>
            <span className="prestige-display text-[20px] font-semibold text-[var(--gold)]">{area} m²</span>
          </div>
          <input
            id="area"
            type="range"
            min={5}
            max={60}
            value={area}
            onChange={(e) => setArea(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--gold)]"
          />
        </div>

        {/* Niveau */}
        <p className="prestige-eyebrow mt-7 !text-[11px] text-[var(--gold)]">3. Niveau d&apos;ambition</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {LEVELS.map((l) => {
            const active = l.id === levelId;
            return (
              <button
                key={l.id}
                onClick={() => setLevelId(l.id)}
                className={`flex items-center justify-between rounded-[14px] border px-4 py-3 text-left transition-all ${
                  active
                    ? 'border-[var(--gold)] bg-[rgba(200,162,77,0.1)]'
                    : 'border-[var(--gold-line)] hover:border-[var(--gold)]'
                }`}
              >
                <span>
                  <span className="text-[15px] font-medium text-[var(--ivory)]">{l.name}</span>
                  <span className="block text-[12.5px] text-[var(--mist)]">{l.desc}</span>
                </span>
                <span className="text-[12px] text-[var(--mist)]">{euro(l.low)}–{euro(l.high)} €/m²</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Résultat */}
      <div className="mt-5 rounded-[24px] border border-[var(--gold)] bg-[rgba(200,162,77,0.08)] p-6 text-center sm:p-8">
        <p className="prestige-eyebrow !text-[11px] text-[var(--gold)]">Budget déco indicatif</p>
        <p className="prestige-display mt-2 text-[34px] font-semibold text-[var(--ivory)] sm:text-[42px]">
          {euroFmt(low)} <span className="text-[var(--mist)]">à</span> {euroFmt(high)}
        </p>
        <p className="mt-2 text-[13px] text-[var(--mist)]">
          {room.name} de {area} m², {level.name.toLowerCase()}. Fourchette déco indicative, hors gros œuvre.
        </p>
      </div>

      {/* Bascule vers l'essai : voir avant de dépenser */}
      <div className="mt-5 rounded-[20px] border border-[var(--gold-line)] bg-[var(--ink)] p-5 sm:p-6">
        <p className="text-[15px] leading-relaxed text-[var(--ivory)]">
          Avant de dépenser, <span className="text-[var(--gold)]">voyez le résultat</span>. Uploadez une photo de
          votre {room.name.toLowerCase()} et l&apos;IA la met en scène dans le style de votre choix, en une
          trentaine de secondes.
        </p>
        <Link
          href="/essai"
          className="group mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-7 py-3.5 text-[15px] font-semibold text-[#0c0a09] transition-colors hover:bg-[#d4b15f]"
        >
          <Sparkles className="h-4 w-4" />
          Visualiser ma pièce gratuitement
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Capture email + offre */}
      <div className="mt-8">
        <LeadMagnet
          source="budget_estimator"
          title="Recevez votre estimation et des idées pour votre pièce"
          subtitle="On vous envoie votre fourchette de budget, des inspirations dans plusieurs styles et votre offre de bienvenue."
          metadata={{ piece: room.id, niveau: level.id }}
        />
      </div>
    </div>
  );
}
