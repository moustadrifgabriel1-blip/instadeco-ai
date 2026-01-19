const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkStatus() {
  // 1. Vérifier les crédits de l'utilisateur
  const usersSnapshot = await db.collection('users').where('email', '==', 'moustadrifgabriel1@gmail.com').get();
  
  if (usersSnapshot.empty) {
    console.log('❌ Utilisateur non trouvé');
    return;
  }
  
  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  
  console.log('=== UTILISATEUR ===');
  console.log('User ID:', userId);
  console.log('Email:', userData.email);
  console.log('Crédits actuels:', userData.credits);
  console.log('');
  
  // 2. Vérifier les dernières générations (sans orderBy pour éviter l'index)
  console.log('=== DERNIÈRES GÉNÉRATIONS ===');
  const generationsSnapshot = await db.collection('generations')
    .where('userId', '==', userId)
    .limit(10)
    .get();
  
  if (generationsSnapshot.empty) {
    console.log('Aucune génération trouvée');
  } else {
    generationsSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`\n[${i + 1}] ID: ${doc.id}`);
      console.log(`    Status: ${data.status}`);
      console.log(`    Style: ${data.styleSlug}`);
      console.log(`    Replicate ID: ${data.replicateRequestId || 'N/A'}`);
      console.log(`    Erreur: ${data.errorMessage || 'Aucune'}`);
      console.log(`    Output URL: ${data.outputImageUrl ? 'OUI' : 'NON'}`);
      console.log(`    Créé le: ${data.createdAt?.toDate?.() || 'N/A'}`);
    });
  }
  
  // 3. Vérifier les transactions de crédits (sans orderBy)
  console.log('\n=== TRANSACTIONS DE CRÉDITS ===');
  const transactionsSnapshot = await db.collection('creditTransactions')
    .where('userId', '==', userId)
    .limit(10)
    .get();
  
  if (transactionsSnapshot.empty) {
    console.log('Aucune transaction trouvée');
  } else {
    transactionsSnapshot.docs.forEach((doc, i) => {
      const data = doc.data();
      console.log(`[${i + 1}] ${data.amount > 0 ? '+' : ''}${data.amount} crédits (${data.type}) - ${data.createdAt?.toDate?.() || 'N/A'}`);
    });
  }
}

checkStatus().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
