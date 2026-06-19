'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

/**
 * RatingStars — petit widget de notation (1 à 5 étoiles) + feedback optionnel,
 * à afficher sous une génération d'image pour mesurer la qualité perçue.
 *
 * NOTE i18n : les textes sont en dur (français) pour l'instant. À externaliser
 * dans messages/*.json (namespace dédié, ex. "rating") dans un second temps.
 *
 * Exemple d'intégration (à placer sous l'image générée, page generate) :
 *
 *   import { RatingStars } from '@/components/features/RatingStars';
 *
 *   {generation.status === 'completed' && (
 *     <RatingStars generationId={generation.id} />
 *   )}
 *
 * Le composant POST vers /api/v2/generations/[id]/rate (auth requise côté serveur).
 */

interface RatingStarsProps {
  generationId: string;
  /** Note déjà enregistrée (si l'utilisateur a déjà voté). */
  initialRating?: number;
  className?: string;
}

const MAX = 5;

export function RatingStars({ generationId, initialRating, className }: RatingStarsProps) {
  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const submit = useCallback(
    async (value: number) => {
      setRating(value);
      setStatus('saving');
      try {
        const res = await fetch(`/api/v2/generations/${generationId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rating: value,
            feedbackText: feedback.trim() || null,
          }),
        });
        if (!res.ok) throw new Error('Échec de la requête');
        setStatus('saved');
      } catch {
        setStatus('error');
      }
    },
    [generationId, feedback],
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-sm font-medium text-gray-700">
        Êtes-vous satisfait du résultat ?
      </p>

      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Note de la génération"
      >
        {Array.from({ length: MAX }, (_, i) => i + 1).map((value) => {
          const active = (hover || rating) >= value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
              disabled={status === 'saving'}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              onClick={() => submit(value)}
              className={cn(
                'text-2xl leading-none transition-transform hover:scale-110 disabled:opacity-50',
                active ? 'text-yellow-400' : 'text-gray-300',
              )}
            >
              ★
            </button>
          );
        })}
      </div>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        maxLength={2000}
        rows={2}
        placeholder="Un commentaire ? (optionnel)"
        className="w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-base sm:text-sm focus:border-gray-400 focus:outline-none"
      />

      {status === 'saving' && (
        <p className="text-xs text-gray-500">Enregistrement…</p>
      )}
      {status === 'saved' && (
        <p className="text-xs text-green-600">Merci pour votre retour !</p>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-600">
          Une erreur est survenue. Réessayez.
        </p>
      )}
    </div>
  );
}
