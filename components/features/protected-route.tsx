'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Rediriger vers la page de connexion si non authentifié
      router.push('/login');
    }
  }, [user, loading, router]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d2d2d7] border-t-[#1d1d1f] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#86868b]">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Ne rien afficher si pas authentifié (redirection en cours)
  if (!user) {
    return null;
  }

  // Afficher le contenu si authentifié
  return <>{children}</>;
}
