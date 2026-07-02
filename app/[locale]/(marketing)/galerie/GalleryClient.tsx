'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, Filter, Sparkles, Eye } from 'lucide-react';
import Link from 'next/link';
import { OptimizedRemoteImage } from '@/components/ui/optimized-image';
import { Button } from '@/components/ui/button';
import { ShareButtons } from '@/components/features/share-buttons';

export interface GalleryItem {
  id: string;
  style_slug: string;
  room_type_slug: string;
  output_image_url: string;
  created_at: string;
}

const STYLE_LABELS: Record<string, string> = {
  moderne: 'Moderne',
  minimaliste: 'Minimaliste',
  boheme: 'Bohème',
  industriel: 'Industriel',
  classique: 'Classique',
  japandi: 'Japandi',
  midcentury: 'Mid-Century',
  coastal: 'Coastal',
  farmhouse: 'Farmhouse',
  artdeco: 'Art Déco',
  scandinave: 'Scandinave',
};

const ROOM_LABELS: Record<string, string> = {
  salon: 'Salon',
  chambre: 'Chambre',
  cuisine: 'Cuisine',
  'salle-de-bain': 'Salle de bain',
  bureau: 'Bureau',
  'salle-a-manger': 'Salle à manger',
};

interface GalleryClientProps {
  /** Générations publiques pré-rendues côté serveur (SSR/ISR) */
  initialItems: GalleryItem[];
  /** Compteur total pré-rendu côté serveur */
  initialTotal: number;
}

export function GalleryClient({ initialItems, initialTotal }: GalleryClientProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [styleFilter, setStyleFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');
  // Évite un re-fetch au montage : les données initiales viennent déjà du serveur.
  const hydrated = useRef(false);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (styleFilter) params.set('style', styleFilter);
    if (roomFilter) params.set('room', roomFilter);
    params.set('limit', '24');

    try {
      const res = await fetch(`/api/v2/gallery?${params}`);
      const data = await res.json();
      setItems(data.generations || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [styleFilter, roomFilter]);

  useEffect(() => {
    // Au premier rendu, on garde le HTML SSR (pas de fetch client redondant).
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    fetchGallery();
  }, [fetchGallery]);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="prestige-eyebrow inline-flex items-center gap-2 bg-[rgba(200,162,77,0.12)] text-[var(--gold)] px-4 py-2 rounded-full text-sm font-medium mb-6 border border-[var(--gold-line)]">
          <Eye className="w-4 h-4" />
          Galerie communautaire
        </div>

        <h1 className="prestige-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-tight mb-4">
          <span className="text-[var(--gold)]">
            {total.toLocaleString('fr-CH')}
          </span>{' '}
          pièces transformées par IA
        </h1>
        <div className="prestige-rule w-24 mx-auto mb-6" aria-hidden="true" />
        <p className="prestige-body text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Découvrez les créations de notre communauté. Chaque transformation a été réalisée par IA en <span className="text-[var(--gold)]">moins de 30 secondes</span>.
        </p>

        {/* Filters */}
        <div className="prestige-reveal flex flex-wrap justify-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-border text-base sm:text-sm bg-card text-foreground focus:outline-none focus:border-[var(--gold)]"
            >
              <option value="">Tous les styles</option>
              {Object.entries(STYLE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border text-sm bg-card text-foreground focus:outline-none focus:border-[var(--gold)]"
          >
            <option value="">Toutes les pièces</option>
            {Object.entries(ROOM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/2] rounded-2xl bg-[var(--stone-900)] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="prestige-reveal text-center py-16">
            <Sparkles className="w-12 h-12 text-[var(--gold)] mx-auto mb-4" />
            <h3 className="prestige-display text-lg font-semibold text-foreground mb-2">
              Aucune transformation trouvée
            </h3>
            <p className="prestige-body text-muted-foreground mb-6">
              Soyez le premier à créer une transformation dans ce style !
            </p>
            <Button asChild className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] transition duration-300">
              <Link href="/generate">
                Créer ma première transformation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="prestige-reveal group relative aspect-[3/2] rounded-2xl overflow-hidden cursor-pointer border border-[var(--gold-line)] shadow-sm hover:shadow-lg transition-all duration-500 ease hover:scale-[1.02]"
                style={{ ['--reveal-d' as string]: `${(index % 4) * 120}ms` }}
              >
                {/* Generated image */}
                <OptimizedRemoteImage
                  src={item.output_image_url}
                  alt={`${ROOM_LABELS[item.room_type_slug] || item.room_type_slug} style ${STYLE_LABELS[item.style_slug] || item.style_slug}, Décoration IA`}
                  fill
                  sizePreset="gallery"
                  // Les 4 premières cartes sont au-dessus de la ligne de flottaison : préchargées (LCP).
                  priority={index < 4}
                  className="object-cover transition-transform duration-500 ease group-hover:scale-105"
                />

                {/* Scrim de lisibilité sous les labels */}
                <div className="prestige-edito-veil absolute inset-0" aria-hidden="true" />

                {/* Badge IA */}
                <div className="absolute top-3 left-3">
                  <span className="prestige-eyebrow inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[var(--gold)]/90 text-[#0c0a09] backdrop-blur-sm">
                    IA
                    <Sparkles className="w-3 h-3" />
                  </span>
                </div>

                {/* Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="prestige-display text-white font-semibold text-base capitalize">
                    {ROOM_LABELS[item.room_type_slug] || item.room_type_slug}
                  </p>
                  <p className="prestige-body text-white/80 text-xs">
                    Style {STYLE_LABELS[item.style_slug] || item.style_slug}
                  </p>
                </div>

                {/* Actions au hover */}
                <div className="absolute top-3 right-3 flex gap-1.5 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity duration-300">
                  <ShareButtons
                    url="https://instadeco.app/galerie"
                    title={`Transformation ${ROOM_LABELS[item.room_type_slug] || item.room_type_slug} style ${STYLE_LABELS[item.style_slug] || item.style_slug}`}
                    imageUrl={item.output_image_url}
                    variant="floating"
                  />
                  <Link
                    href={`/essai`}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-[var(--gold)]/90 backdrop-blur-md shadow-lg hover:bg-[var(--gold)] transition-all duration-200 border border-[var(--gold-line)]"
                    title="Essayer ce style"
                  >
                    <Sparkles className="w-4 h-4 text-[#0c0a09]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="prestige-reveal text-center mt-12">
          <div className="bg-card rounded-2xl p-8 border border-[var(--gold-line)]">
            <p className="prestige-eyebrow mb-3">Votre intérieur, sublimé</p>
            <h3 className="prestige-display text-xl font-semibold text-foreground mb-2">
              Envie de voir votre pièce transformée ?
            </h3>
            <div className="prestige-rule w-20 mx-auto mb-4" aria-hidden="true" />
            <p className="prestige-body text-muted-foreground mb-4">
              Un décorateur coûte 150 €/h. InstaDeco : <span className="font-bold text-[var(--gold)]">0,99 € en 30 secondes</span>.
            </p>
            <Button asChild size="lg" className="rounded-full bg-[var(--gold)] text-[#0c0a09] border border-[var(--gold)] hover:bg-transparent hover:text-[var(--gold)] transition duration-300 hover:shadow-lg hover:shadow-[var(--gold)]/20">
              <Link href="/generate">
                Transformer ma pièce gratuitement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <p className="prestige-body text-xs text-muted-foreground mt-3">3 crédits offerts à l&apos;inscription</p>
          </div>
        </div>
      </div>
    </div>
  );
}
