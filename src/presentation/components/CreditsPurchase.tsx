'use client';

import { useState } from 'react';
import { Check, Sparkles, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePurchaseCredits } from '@/src/presentation/hooks/usePurchaseCredits';
import { CreditsPurchaseProps, CreditPack, CreditPackId } from '@/src/presentation/types';
import { CREDIT_PRICES } from '@/src/shared/constants/pricing';
import { cn } from '@/lib/utils';

/**
 * Liste des packs de crédits
 */
const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_10',
    credits: CREDIT_PRICES.PACK_10.credits,
    price: CREDIT_PRICES.PACK_10.price,
    priceDisplay: CREDIT_PRICES.PACK_10.priceDisplay,
  },
  {
    id: 'pack_25',
    credits: CREDIT_PRICES.PACK_25.credits,
    price: CREDIT_PRICES.PACK_25.price,
    priceDisplay: CREDIT_PRICES.PACK_25.priceDisplay,
    popular: true,
  },
  {
    id: 'pack_50',
    credits: CREDIT_PRICES.PACK_50.credits,
    price: CREDIT_PRICES.PACK_50.price,
    priceDisplay: CREDIT_PRICES.PACK_50.priceDisplay,
  },
  {
    id: 'pack_100',
    credits: CREDIT_PRICES.PACK_100.credits,
    price: CREDIT_PRICES.PACK_100.price,
    priceDisplay: CREDIT_PRICES.PACK_100.priceDisplay,
    bestValue: true,
  },
];

/**
 * Composant de sélection et achat de crédits
 * 
 * @example
 * ```tsx
 * <CreditsPurchase 
 *   onPurchaseStart={(packId) => console.log('Achat démarré:', packId)}
 *   onPurchaseSuccess={() => refetch()}
 *   onPurchaseError={(error) => toast.error(error)}
 * />
 * ```
 */
export function CreditsPurchase({
  onPurchaseStart,
  onPurchaseSuccess,
  onPurchaseError,
  className,
}: CreditsPurchaseProps) {
  const { purchase, isLoading, error } = usePurchaseCredits();
  const [selectedPack, setSelectedPack] = useState<CreditPackId | null>(null);

  /**
   * Gère l'achat
   */
  const handlePurchase = async (packId: CreditPackId) => {
    setSelectedPack(packId);
    onPurchaseStart?.(packId);

    const checkoutUrl = await purchase({ packId });

    if (checkoutUrl) {
      // Redirection vers Stripe
      window.location.href = checkoutUrl;
      onPurchaseSuccess?.();
    } else if (error) {
      onPurchaseError?.(error);
    }
  };

  /**
   * Calcule le prix par crédit
   */
  const getPricePerCredit = (pack: CreditPack): string => {
    const pricePerCredit = pack.price / pack.credits / 100;
    return pricePerCredit.toFixed(2).replace('.', ',');
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Rechargez vos crédits
        </h2>
        <p className="text-gray-500 mt-2">
          Choisissez le pack qui vous convient
        </p>
      </div>

      {/* Grille des packs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CREDIT_PACKS.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            pricePerCredit={getPricePerCredit(pack)}
            isLoading={isLoading && selectedPack === pack.id}
            onSelect={() => handlePurchase(pack.id)}
          />
        ))}
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {/* Avantages */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span>Paiement sécurisé Stripe</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span>Crédits valides à vie</span>
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span>Satisfaction garantie</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Carte individuelle d'un pack
 */
function PackCard({
  pack,
  pricePerCredit,
  isLoading,
  onSelect,
}: {
  pack: CreditPack;
  pricePerCredit: string;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const isPopular = pack.popular;
  const isBestValue = pack.bestValue;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-lg cursor-pointer",
      isPopular && "border-2 border-purple-500 shadow-purple-100",
      isBestValue && "border-2 border-green-500 shadow-green-100",
    )}
    onClick={onSelect}
    >
      {/* Badge */}
      {isPopular && (
        <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
          Populaire
        </div>
      )}
      {isBestValue && (
        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <Star className="h-3 w-3" />
          Meilleur
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="flex flex-col items-center gap-2">
          <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {pack.credits}
          </span>
          <span className="text-sm font-normal text-gray-500">crédits</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        {/* Prix */}
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {pack.priceDisplay}
          </div>
          <div className="text-xs text-gray-500">
            {pricePerCredit}€ / crédit
          </div>
        </div>

        {/* Bouton */}
        <Button
          className={cn(
            "w-full",
            isPopular && "bg-purple-600 hover:bg-purple-700",
            isBestValue && "bg-green-600 hover:bg-green-700",
          )}
          disabled={isLoading}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Acheter
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
