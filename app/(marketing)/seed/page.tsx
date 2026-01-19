'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'initialisation');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>🌱 Initialiser Firestore</CardTitle>
            <CardDescription>
              Créer les collections <code>styles</code> et <code>roomTypes</code> dans Firestore
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Attention :</strong> Cette action va insérer 8 styles et 6 types de pièces dans Firestore.
                <br />
                Si les données existent déjà, elles ne seront pas écrasées.
              </p>
            </div>

            <Button
              onClick={handleSeed}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? '⏳ Initialisation en cours...' : '▶️ Lancer l\'initialisation'}
            </Button>

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ {result.message}</h3>
                <pre className="text-xs text-green-800 bg-green-100 p-3 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">❌ Erreur</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">📋 Données qui seront insérées :</h3>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• 8 styles : Bohème, Minimaliste, Industriel, Moderne, Classique, Japonais, Méditerranéen, Art Déco</li>
                <li>• 6 types de pièces : Salon, Chambre, Cuisine, Salle de Bain, Bureau, Salle à Manger</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
