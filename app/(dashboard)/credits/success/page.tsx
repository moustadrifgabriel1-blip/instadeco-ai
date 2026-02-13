'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    // Vérifier le solde de crédits réel après le paiement
    const fetchCredits = async () => {
      try {
        // Délai pour laisser le temps au webhook Stripe de traiter
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch('/api/v2/credits');
        if (response.ok) {
          const data = await response.json();
          setCredits(data.data?.credits || null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des crédits:', error);
      } finally {
        setIsVerifying(false);
      }
    };

    fetchCredits();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-[#E07B54]" />
              <p className="text-lg font-medium text-gray-700">
                Vérification du paiement...
              </p>
              <p className="text-sm text-gray-500 text-center">
                Vos crédits seront ajoutés dans quelques secondes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Paiement réussi !</CardTitle>
          <CardDescription>
            Vos crédits ont été ajoutés à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 text-center">
              ✅ Transaction complétée avec succès
            </p>
            {credits !== null && (
              <p className="text-lg font-bold text-green-700 text-center mt-2">
                Vous avez maintenant {credits} crédit{credits > 1 ? 's' : ''}
              </p>
            )}
            {sessionId && (
              <p className="text-xs text-green-600 text-center mt-2">
                ID: {sessionId.slice(0, 20)}...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
              size="lg"
            >
              Commencer à générer
            </Button>
            <Button 
              onClick={() => router.push('/pricing')} 
              variant="outline"
              className="w-full"
            >
              Acheter plus de crédits
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#E07B54]" />
            <p className="text-lg font-medium text-gray-700">
              Chargement...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
