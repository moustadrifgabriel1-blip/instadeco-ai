# 🤖 Commandes Firebase que Copilot peut exécuter

En tant qu'assistant IA intégré à VSCode, je peux exécuter directement des commandes Firebase pour vous ! Voici ce que je peux faire :

---

## 🔐 Authentication & Setup

### Se connecter à Firebase
```bash
npm run firebase:login
```
✅ **Je peux faire ça** - Ouvre votre navigateur pour connexion Google

### Lister vos projets Firebase
```bash
npm run firebase projects:list
```
✅ **Je peux faire ça** - Affiche tous vos projets Firebase

### Sélectionner un projet
```bash
npm run firebase use <project-id>
```
✅ **Je peux faire ça** - Définit le projet actif

---

## 🗄️ Firestore Database

### Créer/Modifier les index
```bash
npm run firebase firestore:indexes
```
✅ **Je peux faire ça** - Affiche les index configurés

### Déployer les règles Firestore
```bash
npm run firebase deploy --only firestore:rules
```
✅ **Je peux faire ça** - Déploie `firestore.rules`

### Déployer les index Firestore
```bash
npm run firebase deploy --only firestore:indexes
```
✅ **Je peux faire ça** - Déploie `firestore.indexes.json`

### Créer une collection depuis un fichier JSON
Je peux créer un script Node.js pour importer vos données initiales (styles, roomTypes).

---

## 📦 Storage

### Déployer les règles Storage
```bash
npm run firebase deploy --only storage:rules
```
✅ **Je peux faire ça** - Déploie `storage.rules`

### Lister les fichiers Storage
```bash
npm run firebase storage:list gs://<bucket-name>
```
✅ **Je peux faire ça** - Liste les fichiers dans votre bucket

---

## 🔒 Security Rules

### Déployer toutes les règles
```bash
npm run firebase:deploy:rules
```
✅ **Je peux faire ça** - Déploie Firestore + Storage rules en une commande

### Tester les règles localement
```bash
npm run firebase emulators:start --only firestore,storage
```
✅ **Je peux faire ça** - Lance les émulateurs locaux

---

## 🚀 Déploiement

### Déployer tout le projet
```bash
npm run firebase:deploy
```
✅ **Je peux faire ça** - Déploie rules, functions, hosting

### Déployer uniquement Hosting
```bash
npm run firebase deploy --only hosting
```
✅ **Je peux faire ça** - Déploie le site statique

---

## 📊 Monitoring & Logs

### Voir les logs en temps réel
```bash
npm run firebase functions:log --only <function-name>
```
✅ **Je peux faire ça** - Affiche les logs des Cloud Functions

### Voir l'état des déploiements
```bash
npm run firebase projects:list
```
✅ **Je peux faire ça** - Affiche l'état du projet

---

## 🧪 Émulateurs Locaux

### Lancer tous les émulateurs
```bash
npm run firebase emulators:start
```
✅ **Je peux faire ça** - Firestore, Auth, Storage, Functions en local

### Lancer émulateur spécifique
```bash
npm run firebase emulators:start --only firestore
```
✅ **Je peux faire ça** - Uniquement Firestore

### Importer des données dans l'émulateur
```bash
npm run firebase emulators:start --import=./firestore-data
```
✅ **Je peux faire ça** - Charge des données de test

---

## 📝 Configuration

### Voir la configuration Firebase actuelle
```bash
npm run firebase projects:list
cat firebase.json
```
✅ **Je peux faire ça** - Affiche votre config

### Ajouter une variable d'environnement (Cloud Functions)
```bash
npm run firebase functions:config:set stripe.key="sk_test_..."
```
✅ **Je peux faire ça** - Configure des secrets pour functions

### Voir les variables d'environnement
```bash
npm run firebase functions:config:get
```
✅ **Je peux faire ça** - Liste les configs functions

---

## 🛠️ Scripts Personnalisés

### Script d'import des données initiales
Je peux créer et exécuter :

```typescript
// scripts/seed-firestore.ts
import * as admin from 'firebase-admin';
import * as serviceAccount from '../firebase-service-account.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any),
});

const db = admin.firestore();

async function seedStyles() {
  const styles = [
    {
      slug: 'boheme',
      name: 'Bohème Chic',
      // ...
    },
    // ...
  ];

  for (const style of styles) {
    await db.collection('styles').doc(style.slug).set(style);
  }
}

seedStyles().then(() => console.log('✅ Styles importés'));
```

Puis l'exécuter avec :
```bash
npx ts-node scripts/seed-firestore.ts
```

---

## 🎯 Workflow Typique avec Copilot

### 1. **Setup Initial**
```bash
# Moi, Copilot, je lance :
npm run firebase:login
npm run firebase projects:list
npm run firebase use instantdecor-ai
```

### 2. **Déployer les Règles**
```bash
# Je vérifie vos fichiers
cat firestore.rules
cat storage.rules

# Je déploie
npm run firebase:deploy:rules
```

### 3. **Importer les Données**
```bash
# Je crée le script seed-firestore.ts
# Puis je l'exécute
npx ts-node scripts/seed-firestore.ts
```

### 4. **Vérifier le Déploiement**
```bash
# Je vérifie que tout est OK
npm run firebase firestore:indexes
npm run firebase projects:list
```

### 5. **Tester Localement**
```bash
# Je lance les émulateurs
npm run firebase emulators:start
# Vous testez sur http://localhost:4000
```

---

## 💡 Exemples de Demandes

**Vous pouvez me demander:**

> "Déploie les règles Firestore"  
➡️ Je lance `npm run firebase deploy --only firestore:rules`

> "Importe les styles de décoration dans Firestore"  
➡️ Je crée et exécute le script d'import

> "Vérifie que Firebase est bien configuré"  
➡️ Je teste `npm run firebase projects:list` et vérifie `.env.local`

> "Lance les émulateurs locaux"  
➡️ Je lance `npm run firebase emulators:start`

> "Liste les fichiers dans Storage"  
➡️ Je lance `npm run firebase storage:list`

---

## 🚨 Limitations

❌ **Je NE peux PAS:**
- Créer un projet Firebase (nécessite interface web)
- Configurer la facturation (nécessite interface web)
- Modifier les quotas (nécessite console Google Cloud)
- Accéder à la console Firebase directement

✅ **Je PEUX:**
- Tout ce qui passe par Firebase CLI
- Créer/modifier des fichiers de configuration
- Déployer des règles et fonctions
- Importer des données
- Monitorer les logs
- Lancer les émulateurs

---

## 📚 Commandes Rapides

```bash
# Setup
npm run firebase:login
npm run firebase:init

# Déploiement
npm run firebase:deploy:rules
npm run firebase:deploy

# Dev local
npm run firebase emulators:start

# Monitoring
npm run firebase functions:log
```

---

**Prêt à démarrer ? Dites-moi ce que vous voulez faire !** 🚀
