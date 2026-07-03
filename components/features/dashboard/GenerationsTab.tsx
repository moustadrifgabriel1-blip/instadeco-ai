'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SmartGenerationCard } from '@/components/features/smart-generation-card';
import { ShareButtons } from '@/components/features/share-buttons';
import { RatingStars } from '@/components/features/RatingStars';
import { Sparkles, ImageIcon, Filter, Download } from 'lucide-react';
import type { GenerationDTO } from '@/src/application/dtos/GenerationDTO';
import type { FilterStatus } from './types';

interface GenerationsTabProps {
  generations: GenerationDTO[];
  refetchGenerations: () => void;
  referralCode: string | null;
}

async function downloadGeneration(generationId: string) {
  try {
    const response = await fetch(`/api/v2/download?id=${generationId}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erreur de téléchargement');
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `instadeco-${generationId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    alert('Erreur lors du téléchargement. Veuillez réessayer.');
  }
}

export function GenerationsTab({ generations, refetchGenerations, referralCode }: GenerationsTabProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const filteredGenerations = generations.filter((gen) =>
    filterStatus === 'all' ? true : gen.status === filterStatus,
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="prestige-display text-2xl font-semibold text-foreground">Mes créations</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-muted border border-border rounded-lg px-3 py-2.5 text-base sm:text-sm text-foreground"
          >
            <option value="all">Toutes</option>
            <option value="completed">Terminées</option>
            <option value="processing">En cours</option>
            <option value="failed">Échouées</option>
          </select>
        </div>
      </div>

      {generations.length === 0 ? (
        /* Nouvel utilisateur : accueil guidé en DA prestige (or/nuit). */
        <div className="rounded-[24px] border border-[var(--gold-line)] bg-card p-8 sm:p-10 text-center shadow-[0_2px_24px_rgba(0,0,0,0.25)]">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[rgba(200,162,77,0.12)] border border-[var(--gold-line)] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[var(--gold)]" />
          </div>
          <h2 className="prestige-display text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] text-foreground">
            Bienvenue dans votre studio
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">
            Vos <span className="font-semibold text-[var(--gold)]">3 crédits offerts</span> vous attendent.
            Transformez votre première pièce en une trentaine de secondes.
          </p>

          <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            {[
              { n: '1', t: 'Importez une photo', d: 'Une pièce, même vide' },
              { n: '2', t: 'Choisissez un style', d: '12 directions au choix' },
              { n: '3', t: 'Recevez le rendu', d: 'Photoréaliste, prêt à partager' },
            ].map((s) => (
              <div key={s.n} className="rounded-[16px] border border-border bg-background p-4">
                <span className="prestige-eyebrow inline-flex items-center justify-center w-6 h-6 rounded-full border border-[var(--gold-line)] text-[var(--gold)] text-[12px] mb-2">
                  {s.n}
                </span>
                <p className="prestige-display text-[14px] font-semibold text-foreground">{s.t}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{s.d}</p>
              </div>
            ))}
          </div>

          <Link
            href="/generate"
            className="group mt-8 inline-flex items-center gap-2 bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] px-7 py-3.5 rounded-full text-[15px] font-semibold hover:bg-transparent hover:text-[var(--gold)] transition-all duration-200 shadow-lg active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Créer ma première transformation
          </Link>
        </div>
      ) : filteredGenerations.length === 0 ? (
        /* Des créations existent, mais le filtre courant ne renvoie rien. */
        <div className="rounded-[20px] border border-border bg-card py-12 text-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-[15px]">Aucune création dans ce filtre</p>
          <button
            onClick={() => setFilterStatus('all')}
            className="mt-3 text-[14px] text-[var(--gold)] hover:underline"
          >
            Voir toutes mes créations
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGenerations.map((gen) => (
            <div key={gen.id}>
              <SmartGenerationCard
                generation={gen}
                onStatusChange={(updated) => {
                  if (updated.status === 'completed' || updated.status === 'failed') {
                    refetchGenerations();
                  }
                }}
              >
                <div className="flex flex-col gap-2 mt-2 px-1">
                  {gen.status === 'completed' && gen.outputImageUrl && (
                    <>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => downloadGeneration(gen.id)}>
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                      <ShareButtons
                        url="https://instadeco.app/galerie"
                        title={`Ma transformation déco en style ${gen.styleSlug.replace(/-/g, ' ')}`}
                        description={`${gen.roomType.replace(/-/g, ' ')} transformé en style ${gen.styleSlug.replace(/-/g, ' ')} avec l'IA`}
                        imageUrl={gen.outputImageUrl}
                        referralCode={referralCode || undefined}
                        variant="compact"
                      />
                      {/* Notation a posteriori : alimente generation_ratings (preuve sociale). */}
                      <RatingStars generationId={gen.id} />
                    </>
                  )}
                </div>
              </SmartGenerationCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
