'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ImageIcon, Sparkles, Filter } from 'lucide-react';
import { GenerationCard } from '@/components/features/generation-card';
import { GenerationSkeleton } from '@/components/features/generation-skeleton';

interface Generation {
  id: string;
  styleSlug: string;
  roomTypeSlug: string;
  inputImageUrl: string;
  outputImageUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: any;
  errorMessage?: string;
}

type FilterStatus = 'all' | 'completed' | 'processing' | 'failed';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [filteredGenerations, setFilteredGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadGenerations();
      // Auto-refresh toutes les 10 secondes pour les générations en cours
      const interval = setInterval(() => {
        const hasProcessing = generations.some(
          g => g.status === 'pending' || g.status === 'processing'
        );
        if (hasProcessing) {
          loadGenerations();
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user, generations]);

  useEffect(() => {
    // Appliquer le filtre
    if (filterStatus === 'all') {
      setFilteredGenerations(generations);
    } else {
      setFilteredGenerations(
        generations.filter(g => g.status === filterStatus)
      );
    }
    setPage(1); // Reset pagination
  }, [filterStatus, generations]);

  const loadGenerations = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/generations?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setGenerations(data.generations || []);
      }
    } catch (error) {
      console.error('Erreur chargement générations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredGenerations.length / itemsPerPage);
  const paginatedGenerations = filteredGenerations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const getFilterButtonClass = (status: FilterStatus) => {
    return filterStatus === status
      ? 'bg-purple-600 text-white hover:bg-purple-700'
      : 'bg-white text-gray-700 hover:bg-gray-50';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4 px-4 sm:px-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mon Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {generations.length} génération{generations.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => router.push('/generate')}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 w-full md:w-auto touch-manipulation min-h-[48px]"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            <span className="hidden sm:inline">Nouvelle génération</span>
            <span className="sm:hidden">Nouvelle</span>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <GenerationSkeleton key={i} />
            ))}
          </div>
        ) : generations.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ImageIcon className="h-16 w-16 text-gray-400" />
              </div>
              <CardTitle>Aucune génération pour le moment</CardTitle>
              <CardDescription>
                Commencez par créer votre première décoration IA !
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                onClick={() => router.push('/generate')}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Commencer maintenant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filtres */}
            <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap px-4 sm:px-0">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterStatus('all')}
                className={`${getFilterButtonClass('all')} touch-manipulation min-h-[40px] text-xs sm:text-sm`}
              >
                Tout ({generations.length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterStatus('completed')}
                className={`${getFilterButtonClass('completed')} touch-manipulation min-h-[40px] text-xs sm:text-sm`}
              >
                <span className="hidden sm:inline">Terminés</span>
                <span className="sm:hidden">✓</span> ({generations.filter(g => g.status === 'completed').length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterStatus('processing')}
                className={`${getFilterButtonClass('processing')} touch-manipulation min-h-[40px] text-xs sm:text-sm`}
              >
                <span className="hidden sm:inline">En cours</span>
                <span className="sm:hidden">⏳</span> ({generations.filter(g => g.status === 'pending' || g.status === 'processing').length})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilterStatus('failed')}
                className={`${getFilterButtonClass('failed')} touch-manipulation min-h-[40px] text-xs sm:text-sm`}
              >
                <span className="hidden sm:inline">Échoués</span>
                <span className="sm:hidden">✗</span> ({generations.filter(g => g.status === 'failed').length})
              </Button>
            </div>

            {/* Grille de générations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
              {paginatedGenerations.map((gen) => (
                <GenerationCard
                  key={gen.id}
                  {...gen}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8 px-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="touch-manipulation min-h-[44px]"
                >
                  Précédent
                </Button>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="touch-manipulation min-h-[44px]"
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
