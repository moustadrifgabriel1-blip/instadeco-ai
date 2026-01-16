# 🔥 Guide de Configuration Firebase

## 1. Prérequis

- Compte Google
- Node.js installé
- Projet Next.js initialisé

---

## 2. Créer un Projet Firebase

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquer sur **"Ajouter un projet"**
3. Nom du projet: `instantdecor-ai` (ou votre choix)
4. Accepter les conditions
5. **Désactiver Google Analytics** (optionnel pour le MVP)
6. Cliquer sur **"Créer le projet"**

---

## 3. Activer les Services Firebase

### 3.1 Authentication

1. Dans la console Firebase, aller dans **Authentication**
2. Cliquer sur **"Commencer"**
3. Activer **Email/Password**:
   - Cliquer sur "Email/Password"
   - Activer le premier switch (Email/mot de passe)
   - Enregistrer
4. Activer **Google**:
   - Cliquer sur "Google"
   - Activer le switch
   - Choisir un email d'assistance
   - Enregistrer

### 3.2 Firestore Database

1. Aller dans **Firestore Database**
2. Cliquer sur **"Créer une base de données"**
3. Choisir **"Démarrer en mode production"**
4. Choisir une région proche (ex: `europe-west1` pour l'Europe)
5. Cliquer sur **"Activer"**

### 3.3 Storage

1. Aller dans **Storage**
2. Cliquer sur **"Commencer"**
3. Accepter les règles de sécurité par défaut
4. Choisir la même région que Firestore
5. Cliquer sur **"Terminé"**

---

## 4. Récupérer les Clés de Configuration

### 4.1 Configuration Web (Client-side)

1. Dans la console Firebase, aller dans **Paramètres du projet** (⚙️ > Project Settings)
2. Scroller jusqu'à **"Vos applications"**
3. Cliquer sur l'icône **Web** (`</>`)
4. Nom de l'app: `InstantDecor Web`
5. **NE PAS** cocher Firebase Hosting pour l'instant
6. Cliquer sur **"Enregistrer l'application"**
7. Copier la configuration affichée:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "instantdecor-ai.firebaseapp.com",
  projectId: "instantdecor-ai",
  storageBucket: "instantdecor-ai.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

8. **Coller ces valeurs dans `.env.local`**:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=instantdecor-ai.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=instantdecor-ai
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=instantdecor-ai.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### 4.2 Service Account (Server-side)

1. Toujours dans **Paramètres du projet**
2. Aller dans l'onglet **"Comptes de service"**
3. Cliquer sur **"Générer une nouvelle clé privée"**
4. Confirmer et télécharger le fichier JSON
5. **Renommer le fichier** en `firebase-service-account.json`
6. **Placer le fichier à la racine du projet** (même niveau que `package.json`)
7. ⚠️ **IMPORTANT:** Ajouter ce fichier dans `.gitignore` (déjà fait)

---

## 5. Se Connecter à Firebase CLI

```bash
# Se connecter avec votre compte Google
npm run firebase:login

# Vérifier la connexion
npm run firebase projects:list
```

---

## 6. Initialiser Firebase dans le Projet

```bash
# Initialiser Firebase (sélectionner les services)
npm run firebase:init
```

**Configuration interactive:**
- **Services à activer:**
  - ✅ Firestore
  - ✅ Storage
  - ✅ Hosting (optionnel)

- **Firestore Rules:**
  - File: `firestore.rules` (déjà créé)
  - Indexes: `firestore.indexes.json` (déjà créé)

- **Storage Rules:**
  - File: `storage.rules` (déjà créé)

- **Hosting:** (si activé)
  - Public directory: `out` (Next.js static export)
  - Single-page app: **Non**
  - GitHub auto-deploys: **Non** (on utilisera Vercel)

---

## 7. Déployer les Règles de Sécurité

```bash
# Déployer Firestore Rules + Storage Rules
npm run firebase:deploy:rules
```

**Vérification:**
- Aller dans **Firestore Database > Règles**
- Vérifier que les règles sont bien déployées
- Aller dans **Storage > Règles**
- Vérifier idem

---

## 8. Importer les Données Initiales

### 8.1 Créer les Collections Manuellement

**Via la Console Firebase:**

1. Aller dans **Firestore Database**
2. Cliquer sur **"Commencer une collection"**

#### Collection: `styles`

Document ID: `boheme`
```json
{
  "slug": "boheme",
  "name": "Bohème Chic",
  "description": "Style hippie moderne avec textiles naturels",
  "thumbnailUrl": "/images/styles/boheme.jpg",
  "promptTemplate": "bohemian interior design, natural textures, warm colors, macramé, plants",
  "isActive": true,
  "sortOrder": 1,
  "createdAt": <timestamp auto>
}
```

Répéter pour:
- `minimaliste`
- `industriel`
- `moderne`
- `classique`

#### Collection: `roomTypes`

Document ID: `salon`
```json
{
  "slug": "salon",
  "name": "Salon",
  "icon": "🛋️",
  "isActive": true,
  "createdAt": <timestamp auto>
}
```

Répéter pour:
- `chambre`
- `cuisine`
- `salle-de-bain`
- `bureau`
- `salle-a-manger`

---

## 9. Tester l'Application

```bash
# Créer le fichier .env.local avec vos clés
cp .env.example .env.local

# Éditer .env.local avec vos vraies valeurs
# (voir section 4.1 et 4.2)

# Lancer le projet
npm run dev
```

**Accéder à:** [http://localhost:3000](http://localhost:3000)

---

## 10. Vérifications de Sécurité

### ✅ Firestore Rules
```bash
# Tester les règles
npm run firebase emulators:start --only firestore
```

### ✅ Storage Rules
```bash
# Tester les règles
npm run firebase emulators:start --only storage
```

### ✅ Fichiers à NE JAMAIS commiter
- ❌ `firebase-service-account.json`
- ❌ `.env.local`
- ❌ `.env`

---

## 11. Commandes Firebase Utiles

```bash
# Voir les projets
npm run firebase projects:list

# Déployer tout
npm run firebase:deploy

# Déployer uniquement les règles
npm run firebase:deploy:rules

# Voir les logs
npm run firebase functions:log

# Émulateurs locaux (dev)
npm run firebase emulators:start
```

---

## 🚨 Troubleshooting

### Erreur: "Permission denied"
➡️ Vérifier que les règles Firestore/Storage sont bien déployées

### Erreur: "Firebase not initialized"
➡️ Vérifier que `.env.local` contient toutes les clés

### Erreur: "Service account not found"
➡️ Vérifier que `firebase-service-account.json` existe à la racine

### Erreur: "Invalid API key"
➡️ Vérifier les restrictions d'API dans Google Cloud Console

---

## 📚 Ressources

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

**Dernière mise à jour:** 16 janvier 2026
