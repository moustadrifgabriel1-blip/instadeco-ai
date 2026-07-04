'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Building2, Clock, PiggyBank, TrendingUp, ArrowRight } from 'lucide-react';
import { LeadMagnet } from '@/components/features/lead-magnet';

const PRO_MONTHLY = 49; // InstaDeco Pro, illimité fair-use (cf. /pro)

function euro(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
}

/**
 * Calculateur ROI honnête : l'utilisateur saisit SES propres chiffres (nombre
 * d'annonces, coût d'un home staging physique). On ne compare que des coûts
 * réels (physique vs abonnement Pro illimité). Aucune promesse de « vend X %
 * plus vite » chiffrée non sourçable : on parle en bénéfice qualitatif.
 */
export function RoiCalculatorInteractive() {
  const [listings, setListings] = useState(4); // annonces mises en scène / mois
  const [stagingCost, setStagingCost] = useState(1500); // coût moyen home staging physique / bien

  const { physique, economieMois, economieAn } = useMemo(() => {
    const physique = listings * stagingCost;
    const economieMois = Math.max(0, physique - PRO_MONTHLY);
    return { physique, economieMois, economieAn: economieMois * 12 };
  }, [listings, stagingCost]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Entrées */}
      <div className="rounded-[24px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-6 sm:p-8">
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="listings" className="flex items-center gap-2 text-[15px] text-[var(--ivory)]">
                <Building2 className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
                Annonces mises en scène par mois
              </label>
              <span className="prestige-display text-[22px] font-semibold text-[var(--gold)]">{listings}</span>
            </div>
            <input
              id="listings"
              type="range"
              min={1}
              max={30}
              value={listings}
              onChange={(e) => setListings(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--gold)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="cost" className="flex items-center gap-2 text-[15px] text-[var(--ivory)]">
                <PiggyBank className="h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
                Coût d&apos;un home staging physique par bien
              </label>
              <span className="prestige-display text-[22px] font-semibold text-[var(--gold)]">{euro(stagingCost)}</span>
            </div>
            <input
              id="cost"
              type="range"
              min={500}
              max={5000}
              step={100}
              value={stagingCost}
              onChange={(e) => setStagingCost(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--gold)]"
            />
            <p className="mt-2 text-[12px] text-[var(--mist)]">
              En France, un home staging physique se situe souvent entre 500 € et 5 000 € par bien selon la surface.
            </p>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-[20px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-5 text-center">
          <p className="prestige-eyebrow !text-[10px] text-[var(--mist)]">Home staging physique</p>
          <p className="prestige-display mt-2 text-[26px] font-semibold text-[var(--ivory)]">{euro(physique)}</p>
          <p className="mt-1 text-[12px] text-[var(--mist)]">par mois</p>
        </div>
        <div className="rounded-[20px] border border-[var(--gold-line)] bg-[var(--stone-900)] p-5 text-center">
          <p className="prestige-eyebrow !text-[10px] text-[var(--mist)]">InstaDeco Pro</p>
          <p className="prestige-display mt-2 text-[26px] font-semibold text-[var(--ivory)]">{euro(PRO_MONTHLY)}</p>
          <p className="mt-1 text-[12px] text-[var(--mist)]">par mois, illimité</p>
        </div>
        <div className="rounded-[20px] border border-[var(--gold)] bg-[rgba(200,162,77,0.08)] p-5 text-center">
          <p className="prestige-eyebrow !text-[10px] text-[var(--gold)]">Votre économie</p>
          <p className="prestige-display mt-2 text-[26px] font-semibold text-[var(--gold)]">{euro(economieMois)}</p>
          <p className="mt-1 text-[12px] text-[var(--mist)]">par mois</p>
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-[var(--gold-line)] bg-[var(--ink)] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" aria-hidden="true" />
          <p className="text-[15px] leading-relaxed text-[var(--ivory)]">
            Sur douze mois, vous gardez <strong className="text-[var(--gold)]">{euro(economieAn)}</strong> tout en
            proposant une mise en scène sur chaque annonce.{' '}
            <span className="text-[var(--mist)]">
              Un bien meublé se projette mieux qu&apos;une pièce vide : plus de clics sur l&apos;annonce, plus de
              visites qualifiées. Rendu prêt en une trentaine de secondes, sans camion ni prestataire.
            </span>
          </p>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[12px] text-[var(--mist)]">
          <Clock className="h-3.5 w-3.5 text-[var(--gold)]" aria-hidden="true" />
          Comparaison de coûts sur vos propres chiffres. Le home staging virtuel ne remplace pas des travaux, il met
          en valeur le potentiel du bien en photo.
        </p>
      </div>

      {/* CTA money */}
      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/pro"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-8 py-4 text-[16px] font-semibold text-[#0c0a09] transition-colors hover:bg-[#d4b15f]"
        >
          Voir l&apos;offre Pro illimitée
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href="/essai"
          className="inline-flex items-center justify-center rounded-full border border-[var(--gold-line)] px-8 py-4 text-[16px] font-medium text-[var(--ivory)] transition-colors hover:bg-[rgba(250,248,244,0.06)]"
        >
          Tester gratuitement
        </Link>
      </div>

      {/* Capture email + offre */}
      <div className="mt-8">
        <LeadMagnet
          source="roi_calculator"
          title="Recevez votre estimation et un guide pour vendre plus vite"
          subtitle="On vous envoie le récapitulatif de votre calcul, des exemples avant/après et votre offre de bienvenue pour équiper votre agence."
          metadata={{ economie_mensuelle: String(economieMois) }}
        />
      </div>
    </div>
  );
}
