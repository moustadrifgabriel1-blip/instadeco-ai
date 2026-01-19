const admin = require('firebase-admin');
const path = require('path');
const Replicate = require('replicate');

const serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'instantdecor-ai.firebasestorage.app'
  });
}

const db = admin.firestore();

// Les générations réussies sur Replicate
const successfulGenerations = [
  {
    firestoreId: 'bSwwfDqUWjdBoAFKbei7',
    replicateId: 'vmm94w9qw5rmy0cvtw3t9d0dzr',
    outputUrl: 'https://replicate.delivery/xezq/zYuSGFGwvGZ5DZJ6tjGt6Tpe4mpLy6h42aon3f7fARkWPBeXB/tmpjcebov_r.jpg'
  },
  {
    firestoreId: 'wH34hvmLvV4NgvPRY4SV',
    replicateId: 'd61zxhm51drmw0cvtvzsvv3at0',
    outputUrl: 'https://replicate.delivery/xezq/I1e0w6FfTFm6fIxUIZCWuffWtxnBWcNifWyKlehlSSQg5PgfVA/tmpcxqnsqlc.jpg'
  }
];

// Les générations échouées (sans output)
const failedGenerations = [
  { firestoreId: 'YZpWhM5DO74MS6rW4hCb', replicateId: 'ezde4egct9rmt0cvtv18p8ry6m' },
  { firestoreId: 'ivm0JTNa7DYbGTHdrPpo', replicateId: '0e22z8dn8xrmt0cvtv3vz2h88m' }
];

async function fixGenerationsAndCredits() {
  const userId = 'y4m1wfl8daZkDw8Ox26cN110Zls1';
  
  console.log('=== CORRECTION DES GÉNÉRATIONS ===\n');
  
  // 1. Mettre à jour les générations réussies
  for (const gen of successfulGenerations) {
    await db.collection('generations').doc(gen.firestoreId).update({
      status: 'completed',
      outputImageUrl: gen.outputUrl,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ ${gen.firestoreId} → completed (image disponible)`);
  }
  
  // 2. Marquer les générations échouées et rembourser
  for (const gen of failedGenerations) {
    await db.collection('generations').doc(gen.firestoreId).update({
      status: 'failed',
      errorMessage: 'Génération échouée - crédit remboursé'
    });
    console.log(`❌ ${gen.firestoreId} → failed`);
  }
  
  // 3. Rembourser les crédits des générations échouées
  const refundAmount = failedGenerations.length;
  
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const currentCredits = userDoc.data().credits;
  
  await userRef.update({
    credits: currentCredits + refundAmount
  });
  
  // Enregistrer la transaction de remboursement
  await db.collection('creditTransactions').add({
    userId,
    amount: refundAmount,
    type: 'refund',
    metadata: { reason: 'Générations échouées', generationIds: failedGenerations.map(g => g.firestoreId) },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`\n💰 Remboursement: +${refundAmount} crédits`);
  console.log(`📊 Nouveau solde: ${currentCredits + refundAmount} crédits`);
  
  console.log('\n=== RÉSUMÉ ===');
  console.log(`✅ ${successfulGenerations.length} générations récupérées (images disponibles)`);
  console.log(`❌ ${failedGenerations.length} générations échouées (crédits remboursés)`);
}

fixGenerationsAndCredits().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
