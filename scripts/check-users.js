const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkUsers() {
  // Récupérer tous les utilisateurs
  const usersSnapshot = await db.collection('users').get();
  
  console.log('=== UTILISATEURS DANS FIRESTORE ===\n');
  
  usersSnapshot.forEach(doc => {
    const user = doc.data();
    console.log('ID:', doc.id);
    console.log('Email:', user.email);
    console.log('Crédits:', user.credits);
    console.log('Nom:', user.fullName || 'Non défini');
    console.log('Créé le:', user.createdAt?.toDate?.() || user.createdAt);
    console.log('---');
  });
  
  console.log('\nTotal utilisateurs:', usersSnapshot.size);
  
  // Vérifier les transactions de crédits
  const transactionsSnapshot = await db.collection('creditTransactions').get();
  
  if (transactionsSnapshot.size > 0) {
    console.log('\n=== TRANSACTIONS DE CRÉDITS ===\n');
    transactionsSnapshot.forEach(doc => {
      const tx = doc.data();
      console.log('ID:', doc.id);
      console.log('User:', tx.userId);
      console.log('Amount:', tx.amount);
      console.log('Type:', tx.type);
      console.log('Date:', tx.createdAt?.toDate?.() || tx.createdAt);
      console.log('---');
    });
  }
}

checkUsers().then(() => process.exit(0)).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
