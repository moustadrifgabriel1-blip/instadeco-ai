const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkGenerations() {
  console.log('=== GÉNÉRATIONS DANS FIRESTORE ===\n');
  
  const snap = await db.collection('generations')
    .orderBy('createdAt', 'desc')
    .limit(15)
    .get();
  
  console.log('Total trouvé:', snap.size);
  
  snap.docs.forEach(doc => {
    const data = doc.data();
    console.log('\n---');
    console.log('ID:', doc.id);
    console.log('userId:', data.userId);
    console.log('Status:', data.status);
    console.log('Style:', data.styleSlug);
    console.log('Room:', data.roomTypeSlug);
    console.log('Output URL:', data.outputImageUrl ? 'OUI ✅' : 'NON ❌');
    console.log('Created:', data.createdAt?.toDate?.());
  });
  
  process.exit(0);
}

checkGenerations().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
