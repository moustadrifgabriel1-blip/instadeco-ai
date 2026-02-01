'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Loader2, XCircle, ArrowLeft } from 'lucide-react';

function HDSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const sessionId = searchParams.get('session_id');
  const generationId = searchParams.get('generation_id');

  const verifyAndUnlock = useCallback(async () => {
    if (!sessionId || !generationId) {
      setStatus('error');
      setErrorMessage('Paramètres manquants');
      return;
    }

    try {
      // Utiliser l'API V2 de confirmation HD
      const response = await fetch('/api/v2/hd-unlock/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          generationId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setImageUrl(data.imageUrl);
        // Le downloadUrl passe par l'API sécurisée
        setDownloadUrl(`/api/v2/download?id=${generationId}`);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Erreur lors du déverrouillage');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setStatus('error');
      setErrorMessage('Erreur de connexion');
    }
  }, [sessionId, generationId]);

  useEffect(() => {
    verifyAndUnlock();
  }, [verifyAndUnlock]);

  const handleDownload = async () => {
    // Télécharger via l'API sécurisée (qui gère le watermark selon hd_unlocked)
    try {
      const url = downloadUrl || `/api/v2/download?id=${generationId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erreur de téléchargement');
      }
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `instadeco-hd-${generationId?.slice(0, 8)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4">
                <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Vérification en cours...</CardTitle>
              <CardDescription>
                Nous vérifions votre paiement et préparons votre image HD
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 bg-green-100 rounded-full p-4 w-fit">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                Paiement réussi ! 🎉
              </CardTitle>
              <CardDescription>
                Votre image HD sans filigrane est prête à être téléchargée
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 bg-red-100 rounded-full p-4 w-fit">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-700">
                Erreur
              </CardTitle>
              <CardDescription className="text-red-600">
                {errorMessage}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <>
              {/* Aperçu de l'image */}
              {imageUrl && (
                <div className="rounded-lg overflow-hidden border-2 border-green-200 shadow-md relative aspect-video">
                  <Image 
                    src={imageUrl} 
                    alt="Votre création HD" 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              )}

              {/* Bouton de téléchargement */}
              <Button 
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Télécharger en HD
              </Button>

              <p className="text-sm text-gray-500 text-center">
                💡 Vous pouvez retrouver cette image dans votre dashboard à tout moment
              </p>
            </>
          )}

          {/* Bouton retour */}
          <Link href="/dashboard" className="block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </Link>

          {status === 'error' && (
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="default"
              className="w-full"
            >
              Réessayer depuis le dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading fallback pour Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Loader2 className="h-16 w-16 text-purple-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Chargement...</CardTitle>
          <CardDescription>
            Préparation de votre téléchargement HD
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function HDSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HDSuccessContent />
    </Suspense>
  );
}
