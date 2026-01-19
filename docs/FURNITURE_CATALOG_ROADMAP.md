# 🛋️ Intégration Catalogues Meubles - Roadmap V2

## Vision

Permettre aux utilisateurs de voir leurs pièces décorées avec de **vrais meubles** qu'ils peuvent acheter chez :
- 🇸🇪 **IKEA** - Mobilier accessible et design scandinave
- 🇫🇷 **Maisons du Monde** - Styles variés, tendance
- 🇫🇷 **Conforama** - Budget-friendly
- 🇫🇷 **La Redoute Intérieurs / AM.PM** - Design français
- 🇪🇸 **Habitat** - Contemporain épuré
- 🇩🇪 **Westwing** - Design premium
- 🇫🇷 **But** - Famille et pratique
- 🇨🇭 **Maxi Bazar / Fly** - Budget et tendance

## Architecture Technique

### Phase 1: Base de Données Meubles

```typescript
// types/furniture.ts
interface FurniturePiece {
  id: string;
  name: string;
  brand: 'ikea' | 'maisons_du_monde' | 'conforama' | 'habitat' | 'westwing';
  category: 'sofa' | 'chair' | 'table' | 'storage' | 'lighting' | 'decor';
  style: DecorationStyle[];
  priceEur: number;
  imageUrl: string;
  productUrl: string;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  colors: string[];
  materials: string[];
  roomTypes: RoomType[];
  tags: string[];
  inStock: boolean;
  lastUpdated: Date;
}
```

### Phase 2: Scraper / API Catalogues

#### Sources de données

1. **IKEA** - API non officielle ou scraping
   - `https://www.ikea.com/fr/fr/`
   - Catalogue JSON disponible via leur API interne

2. **Maisons du Monde** - Scraping sitemap
   - `https://www.maisonsdumonde.com/FR/fr/`
   - Flux produits disponibles

3. **La Redoute** - API partenaire potentielle
   - Programme d'affiliation avec flux produits

4. **Westwing** - Programme affilié
   - Flux produits XML disponibles

### Phase 3: Intégration IA

```typescript
// lib/ai/furniture-matcher.ts

interface FurnitureRecommendation {
  piece: FurniturePiece;
  matchScore: number;
  reason: string;
  position: { x: number; y: number }; // Position suggérée dans l'image
}

async function matchFurnitureToRoom(
  roomAnalysis: RoomAnalysis,
  style: DecorationStyle,
  budget?: { min: number; max: number }
): Promise<FurnitureRecommendation[]> {
  // 1. Analyser les dimensions de la pièce
  // 2. Identifier les zones vides
  // 3. Matcher avec notre base de meubles
  // 4. Retourner les recommandations triées par pertinence
}
```

### Phase 4: Chat IA Interactif

```typescript
// Conversation types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  options?: ChatOption[];
  selectedOption?: string;
}

interface ChatOption {
  id: string;
  label: string;
  action: 'select_style' | 'select_budget' | 'keep_furniture' | 'change_layout';
}

// Exemple de conversation
const chatFlow = [
  {
    assistant: "Que souhaitez-vous transformer dans cette pièce ?",
    options: [
      { id: 'all', label: '🔄 Tout refaire (meubles + déco)' },
      { id: 'furniture', label: '🛋️ Changer les meubles uniquement' },
      { id: 'decor', label: '🖼️ Garder les meubles, changer la déco' },
      { id: 'layout', label: '📐 Réorganiser la disposition' },
    ]
  },
  {
    assistant: "Quel est votre budget approximatif ?",
    options: [
      { id: 'low', label: '💰 Petit budget (< 500€)' },
      { id: 'medium', label: '💰💰 Moyen (500-2000€)' },
      { id: 'high', label: '💰💰💰 Sans limite' },
    ]
  },
  {
    assistant: "Préférez-vous certaines enseignes ?",
    options: [
      { id: 'ikea', label: '🇸🇪 IKEA' },
      { id: 'mdm', label: '🏠 Maisons du Monde' },
      { id: 'mix', label: '🔀 Mix de plusieurs' },
    ]
  },
];
```

## Implémentation Progressive

### Sprint 1 (Cette semaine)
- [x] Améliorer les prompts avec contraintes de cadrage
- [x] Ajouter les modes de transformation (complet, déco, layout)
- [ ] Ajouter les références de style aux marques européennes

### Sprint 2 (Semaine prochaine)
- [ ] Créer la base de données Firestore `furniture`
- [ ] Importer 100 meubles IKEA populaires (manuel)
- [ ] Afficher "Inspiré par" avec liens vers les produits

### Sprint 3
- [ ] Créer le scraper pour IKEA (Node.js + Puppeteer)
- [ ] Automatiser la mise à jour quotidienne
- [ ] Ajouter Maisons du Monde

### Sprint 4
- [ ] Chat interactif basique (sans IA)
- [ ] Questionnaire de préférences
- [ ] Sauvegarde des préférences utilisateur

### Sprint 5
- [ ] Intégrer GPT-4 pour le chat conversationnel
- [ ] Recommandations de meubles post-génération
- [ ] "Acheter ce look" avec panier multi-enseignes

## Considérations Légales

### Affiliation
- S'inscrire aux programmes d'affiliation :
  - IKEA Family (pas d'affiliation directe, mais partenariats possibles)
  - Awin (Maisons du Monde, La Redoute)
  - Webgains (Habitat)
  
### Scraping
- Respecter robots.txt
- Rate limiting
- Pas de stockage d'images (hotlink ou CDN propre)
- Mention "Prix indicatif, vérifier sur le site"

## Modèle Économique

### Revenus potentiels
1. **Affiliation** : 3-8% sur les ventes générées
2. **Partenariats marques** : Placement prioritaire
3. **Premium "Shopping List"** : Export PDF avec liens d'achat

## Maquette UI

```
┌─────────────────────────────────────────────┐
│  Votre pièce transformée - Style Bohème     │
├─────────────────────────────────────────────┤
│  [Image générée avec pins sur les meubles]  │
│      📍1        📍2                         │
│           📍3                               │
│                        📍4                  │
├─────────────────────────────────────────────┤
│  Recréez ce look :                          │
│  ┌────┐ 1. Canapé SÖDERHAMN - IKEA   449€  │
│  │ 🛋️ │    [Voir le produit →]             │
│  └────┘                                     │
│  ┌────┐ 2. Table STOCKHOLM - IKEA    199€  │
│  │ 🪑 │    [Voir le produit →]             │
│  └────┘                                     │
│  ┌────┐ 3. Tapis ELBA - Maisons...   129€  │
│  │ 🧶 │    [Voir le produit →]             │
│  └────┘                                     │
│                                             │
│  Budget total estimé : 1 247€               │
│  [📥 Télécharger ma shopping list]          │
└─────────────────────────────────────────────┘
```

---

**Dernière mise à jour:** 19 janvier 2026
**Statut:** Roadmap V2 - En planification
