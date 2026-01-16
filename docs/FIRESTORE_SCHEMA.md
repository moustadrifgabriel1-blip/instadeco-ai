# 🔥 Schéma Firestore - InstantDecor AI

## Architecture des Collections

```
firestore/
├── users/{userId}
├── creditTransactions/{transactionId}
├── generations/{generationId}
├── styles/{styleId}
└── roomTypes/{roomTypeId}
```

---

## 📦 Collection: `users`

**Path:** `/users/{userId}`  
**Document ID:** UID de Firebase Authentication

```typescript
interface User {
  id: string;                    // UID Firebase Auth
  email: string;
  fullName?: string;
  avatarUrl?: string;
  credits: number;               // Default: 3 (crédits gratuits)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Exemple de document:**
```json
{
  "id": "abc123def456",
  "email": "user@example.com",
  "fullName": "Marie Dupont",
  "avatarUrl": null,
  "credits": 15,
  "createdAt": "2026-01-16T10:00:00Z",
  "updatedAt": "2026-01-16T10:00:00Z"
}
```

---

## 💳 Collection: `creditTransactions`

**Path:** `/creditTransactions/{transactionId}`  
**Document ID:** Auto-généré

```typescript
interface CreditTransaction {
  id: string;
  userId: string;                // Référence au user
  amount: number;                // Positif = ajout, Négatif = débit
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
  createdAt: Timestamp;
}
```

**Index requis:**
- `userId` (ASC)
- Composite: `userId` (ASC) + `createdAt` (DESC)

**Exemple de document:**
```json
{
  "id": "txn_xyz789",
  "userId": "abc123def456",
  "amount": 30,
  "type": "purchase",
  "stripePaymentIntentId": "pi_abc123",
  "metadata": {
    "pack": "pro"
  },
  "createdAt": "2026-01-16T10:05:00Z"
}
```

---

## 🎨 Collection: `generations`

**Path:** `/generations/{generationId}`  
**Document ID:** Auto-généré

```typescript
interface Generation {
  id: string;
  userId: string;                // Référence au user
  
  // Paramètres de génération
  styleSlug: string;             // Ex: 'boheme', 'minimaliste'
  roomTypeSlug: string;          // Ex: 'salon', 'chambre'
  prompt: string;
  negativePrompt?: string;
  controlnetType: 'canny' | 'depth';
  
  // URLs des images
  inputImageUrl: string;         // Image uploadée (Firebase Storage)
  outputImageUrl?: string;       // Résultat généré (NULL si en cours)
  
  // État de la génération
  status: 'pending' | 'processing' | 'completed' | 'failed';
  falRequestId?: string;         // ID de la requête Fal.ai
  errorMessage?: string;
  
  // Métadonnées
  generationTimeMs?: number;     // Durée de génération
  metadata?: Record<string, any>;
  
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

**Index requis:**
- `userId` (ASC) + `createdAt` (DESC)
- `status` (ASC)
- Composite: `userId` (ASC) + `status` (ASC) + `createdAt` (DESC)

**Exemple de document:**
```json
{
  "id": "gen_abc123",
  "userId": "abc123def456",
  "styleSlug": "boheme",
  "roomTypeSlug": "salon",
  "prompt": "bohemian interior design, natural textures, warm colors",
  "controlnetType": "canny",
  "inputImageUrl": "https://firebasestorage.googleapis.com/.../input.jpg",
  "outputImageUrl": "https://fal.media/.../output.jpg",
  "status": "completed",
  "falRequestId": "fal_xyz789",
  "generationTimeMs": 23450,
  "createdAt": "2026-01-16T10:10:00Z",
  "completedAt": "2026-01-16T10:10:23Z"
}
```

---

## 🎨 Collection: `styles`

**Path:** `/styles/{styleId}`  
**Document ID:** slug du style

```typescript
interface Style {
  id: string;                    // Slug (ex: 'boheme')
  slug: string;                  // URL-friendly
  name: string;
  description: string;
  thumbnailUrl: string;
  promptTemplate: string;        // Template pour Flux.1
  isActive: boolean;
  sortOrder: number;
  createdAt: Timestamp;
}
```

**Données initiales:**
```json
[
  {
    "id": "boheme",
    "slug": "boheme",
    "name": "Bohème Chic",
    "description": "Style hippie moderne avec textiles naturels",
    "thumbnailUrl": "/images/styles/boheme.jpg",
    "promptTemplate": "bohemian interior design, natural textures, warm colors, macramé, plants",
    "isActive": true,
    "sortOrder": 1,
    "createdAt": "2026-01-16T00:00:00Z"
  },
  {
    "id": "minimaliste",
    "slug": "minimaliste",
    "name": "Minimaliste Scandinave",
    "description": "Lignes épurées, tons neutres, bois clair",
    "promptTemplate": "minimalist scandinavian interior, clean lines, neutral colors, light wood",
    "isActive": true,
    "sortOrder": 2,
    "createdAt": "2026-01-16T00:00:00Z"
  }
]
```

---

## 🏠 Collection: `roomTypes`

**Path:** `/roomTypes/{roomTypeId}`  
**Document ID:** slug de la pièce

```typescript
interface RoomType {
  id: string;                    // Slug (ex: 'salon')
  slug: string;
  name: string;
  icon: string;                  // Emoji
  isActive: boolean;
  createdAt: Timestamp;
}
```

**Données initiales:**
```json
[
  {
    "id": "salon",
    "slug": "salon",
    "name": "Salon",
    "icon": "🛋️",
    "isActive": true,
    "createdAt": "2026-01-16T00:00:00Z"
  },
  {
    "id": "chambre",
    "slug": "chambre",
    "name": "Chambre",
    "icon": "🛏️",
    "isActive": true,
    "createdAt": "2026-01-16T00:00:00Z"
  }
]
```

---

## 🔒 Firestore Security Rules

**Fichier: `firestore.rules`**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Vérifier si l'utilisateur est authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Vérifier si l'utilisateur est propriétaire
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // ============================================
    // USERS
    // ============================================
    match /users/{userId} {
      // Lecture: uniquement son propre profil
      allow read: if isOwner(userId);
      
      // Création: uniquement lors de l'inscription (via Cloud Function)
      allow create: if isOwner(userId);
      
      // Mise à jour: uniquement son propre profil
      allow update: if isOwner(userId) 
        && request.resource.data.keys().hasAny(['fullName', 'avatarUrl', 'updatedAt'])
        && request.resource.data.credits == resource.data.credits; // Empêcher modification manuelle des crédits
    }
    
    // ============================================
    // CREDIT TRANSACTIONS
    // ============================================
    match /creditTransactions/{transactionId} {
      // Lecture: uniquement ses propres transactions
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Écriture: INTERDITE (géré par Cloud Functions uniquement)
      allow write: if false;
    }
    
    // ============================================
    // GENERATIONS
    // ============================================
    match /generations/{generationId} {
      // Lecture: uniquement ses propres générations
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Création: autorisée (validée côté API)
      allow create: if isOwner(resource.data.userId)
        && request.resource.data.status == 'pending';
      
      // Mise à jour: INTERDITE côté client (géré par API)
      allow update: if false;
      
      // Suppression: autorisée pour ses propres générations
      allow delete: if isOwner(resource.data.userId);
    }
    
    // ============================================
    // STYLES (lecture seule publique)
    // ============================================
    match /styles/{styleId} {
      allow read: if resource.data.isActive == true;
      allow write: if false; // Admin uniquement
    }
    
    // ============================================
    // ROOM TYPES (lecture seule publique)
    // ============================================
    match /roomTypes/{roomTypeId} {
      allow read: if resource.data.isActive == true;
      allow write: if false; // Admin uniquement
    }
  }
}
```

---

## 🔥 Firebase Storage Rules

**Fichier: `storage.rules`**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper: Vérifier si authentifié
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper: Vérifier taille de fichier (max 10MB)
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Helper: Vérifier type de fichier (images uniquement)
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // ============================================
    // UPLOADS UTILISATEURS
    // ============================================
    match /uploads/{userId}/{imageId} {
      // Upload: uniquement pour son propre dossier
      allow create: if isAuthenticated() 
        && request.auth.uid == userId
        && isValidSize()
        && isImage();
      
      // Lecture: uniquement ses propres fichiers
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // Suppression: uniquement ses propres fichiers
      allow delete: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // ============================================
    // GENERATIONS (résultats Fal.ai copiés ici)
    // ============================================
    match /generations/{userId}/{generationId} {
      // Lecture: uniquement ses propres générations
      allow read: if isAuthenticated() && request.auth.uid == userId;
      
      // Écriture: INTERDITE côté client (géré par Cloud Functions)
      allow write: if false;
    }
  }
}
```

---

## 🚀 Commandes d'initialisation

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter
firebase login

# Initialiser le projet
firebase init

# Déployer les rules
firebase deploy --only firestore:rules,storage:rules

# Importer les données initiales (styles, roomTypes)
firebase firestore:import ./firestore-seed-data
```

---

**Dernière mise à jour:** 16 janvier 2026
