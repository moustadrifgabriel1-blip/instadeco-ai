'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Filter, Sparkles, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface GalleryItem {
  id: string;
  style_slug: string;
  room_type_slug: string;
  input_image_url: string;
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

export default function GaleriePage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [styleFilter, setStyleFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
    fetchGallery();
  }, [fetchGallery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F5] via-[#FFFBF9] to-white">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FFF0EB] text-[#D4603C] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Eye className="w-4 h-4" />
          Galerie communautaire
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#2D2D2D] leading-tight mb-4">
          <span className="bg-gradient-to-r from-[#E07B54] to-[#D4603C] bg-clip-text text-transparent">
            {total.toLocaleString('fr-CH')}
          </span>{' '}
          pièces transformées par IA
        </h1>
        <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto mb-8">
          Survolez pour voir l&apos;avant/après. Chaque transformation a été réalisée en moins de 30 secondes.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#636366]" />
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#F0E8E4] text-sm bg-white focus:outline-none focus:border-[#E07B54]"
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
            className="px-3 py-2 rounded-xl border border-[#F0E8E4] text-sm bg-white focus:outline-none focus:border-[#E07B54]"
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
              <div key={i} className="aspect-[3/2] rounded-2xl bg-[#f5f5f7] animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-12 h-12 text-[#E07B54] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#2D2D2D] mb-2">
              Aucune transformation trouvée
            </h3>
            <p className="text-[#6B6B6B] mb-6">
              Soyez le premier à créer une transformation dans ce style !
            </p>
            <Button asChild>
              <Link href="/generate">
                Créer ma première transformation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-[3/2] rounded-2xl overflow-hidden cursor-pointer border border-[#F0E8E4] shadow-sm hover:shadow-lg transition-all"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Before image */}
                <Image
                  src={item.input_image_url}
                  alt={`${ROOM_LABELS[item.room_type_slug] || item.room_type_slug} avant`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover transition-opacity duration-500 ${
                    hoveredId === item.id ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                {/* After image */}
                <Image
                  src={item.output_image_url}
                  alt={`${ROOM_LABELS[item.room_type_slug] || item.room_type_slug} style ${STYLE_LABELS[item.style_slug] || item.style_slug}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`object-cover transition-opacity duration-500 ${
                    hoveredId === item.id ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Label */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    hoveredId === item.id
                      ? 'bg-[#E07B54] text-white'
                      : 'bg-white/90 text-[#2D2D2D]'
                  }`}>
                    {hoveredId === item.id ? 'Après ✨' : 'Avant'}
                  </span>
                </div>

                {/* Info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-medium text-sm">
                    {ROOM_LABELS[item.room_type_slug] || item.room_type_slug}
                  </p>
                  <p className="text-white/80 text-xs">
                    Style {STYLE_LABELS[item.style_slug] || item.style_slug}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-[#FFF8F5] to-[#FFF0EB] rounded-2xl p-8 border border-[#F5D5C8]">
            <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">
              Envie de voir votre pièce transformée ?
            </h3>
            <p className="text-[#6B6B6B] mb-4">
              Un décorateur coûte 150 €/h. InstaDeco : <span className="font-bold text-[#E07B54]">0,99 € en 30 secondes</span>.
            </p>
            <Button asChild size="lg" className="rounded-full bg-gradient-to-r from-[#E07B54] to-[#D4603C] hover:shadow-lg hover:shadow-[#E07B54]/30">
              <Link href="/generate">
                Transformer ma pièce gratuitement
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-[#636366] mt-3">3 crédits offerts à l&apos;inscription</p>
          </div>
        </div>
      </div>
    </div>
  );
}
