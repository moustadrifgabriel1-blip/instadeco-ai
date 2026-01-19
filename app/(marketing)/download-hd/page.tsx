'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Download, Check, Loader2 } from 'lucide-react';

function DownloadHDContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const generationId = searchParams.get('generation_id');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndGetImage = async () => {
      if (!sessionId || !generationId) {
        setStatus('error');
        setError('Paramètres manquants');
        return;
      }

      try {
        // Vérifier le paiement et récupérer l'image
        const response = await fetch('/api/verify-hd-purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, generationId }),
        });

        const data = await response.json();

        if (response.ok && data.imageUrl) {
          setImageUrl(data.imageUrl);
          setStatus('success');
        } else {
          setStatus('error');
          setError(data.error || 'Erreur de vérification');
        }
      } catch {
        setStatus('error');
        setError('Erreur de connexion');
      }
    };

    verifyAndGetImage();
  }, [sessionId, generationId]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      // Télécharger l'image sans filigrane
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'instadeco-hd.jpg';
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      // Fallback: ouvrir dans un nouvel onglet
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center p-6">
      <div className="max-w-[600px] w-full">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto text-[#0071e3] animate-spin" />
            <h1 className="mt-6 text-[32px] font-semibold text-[#1d1d1f]">
              Vérification du paiement...
            </h1>
            <p className="mt-2 text-[17px] text-[#86868b]">
              Merci de patienter quelques instants.
            </p>
          </div>
        )}

        {status === 'success' && imageUrl && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </div>
            <h1 className="mt-6 text-[32px] font-semibold text-[#1d1d1f]">
              Paiement réussi !
            </h1>
            <p className="mt-2 text-[17px] text-[#86868b]">
              Votre image HD sans filigrane est prête.
            </p>

            {/* Aperçu de l'image */}
            <div className="mt-8 rounded-[20px] overflow-hidden bg-[#f5f5f7]">
              <Image
                src={imageUrl}
                alt="Votre design HD"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>

            {/* Bouton de téléchargement */}
            <button
              onClick={handleDownload}
              className="mt-8 inline-flex items-center gap-3 px-8 py-4 rounded-full text-[17px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ED] transition-colors"
            >
              <Download className="w-5 h-5" strokeWidth={2} />
              Télécharger en HD
            </button>

            <p className="mt-4 text-[12px] text-[#86868b]">
              Résolution maximale • Sans filigrane • Usage illimité
            </p>

            {/* Retour */}
            <a
              href="/generate"
              className="mt-8 inline-block text-[14px] text-[#0071e3] hover:underline"
            >
              ← Créer un nouveau design
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">✕</span>
            </div>
            <h1 className="mt-6 text-[32px] font-semibold text-[#1d1d1f]">
              Une erreur est survenue
            </h1>
            <p className="mt-2 text-[17px] text-[#86868b]">
              {error || 'Impossible de vérifier votre achat.'}
            </p>
            <a
              href="/generate"
              className="mt-8 inline-block px-8 py-4 rounded-full text-[17px] font-medium text-white bg-[#1d1d1f] hover:bg-black transition-colors"
            >
              Retour à la génération
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DownloadHDPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#0071e3] animate-spin" />
      </div>
    }>
      <DownloadHDContent />
    </Suspense>
  );
}
