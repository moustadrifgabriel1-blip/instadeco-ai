'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SmartGenerationCard } from '@/components/features/smart-generation-card';
import { ShareButtons } from '@/components/features/share-buttons';
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
        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Mes créations</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#636366]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-[#f5f5f7] border-none rounded-lg px-3 py-2 text-sm text-[#1d1d1f]"
          >
            <option value="all">Toutes</option>
            <option value="completed">Terminées</option>
            <option value="processing">En cours</option>
            <option value="failed">Échouées</option>
          </select>
        </div>
      </div>

      {filteredGenerations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 text-[#d2d2d7] mx-auto mb-4" />
            <p className="text-[#636366]">Aucune création pour le moment</p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 mt-4 px-6 py-2 bg-[#1d1d1f] text-white rounded-full hover:bg-black transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Créer ma première image
            </Link>
          </CardContent>
        </Card>
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
                        title={`Ma transformation déco en style ${gen.styleSlug.replace(/-/g, ' ')} 🏠✨`}
                        description={`${gen.roomType.replace(/-/g, ' ')} transformé en style ${gen.styleSlug.replace(/-/g, ' ')} avec l'IA`}
                        imageUrl={gen.outputImageUrl}
                        referralCode={referralCode || undefined}
                        variant="compact"
                      />
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
