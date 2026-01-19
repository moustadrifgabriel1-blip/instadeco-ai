const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

db.collection('generations').where('status', '==', 'completed').limit(2).get().then(snap => {
  snap.docs.forEach(doc => {
    console.log('ID:', doc.id);
    console.log('Output URL:', doc.data().outputImageUrl);
    console.log('---');
  });
  process.exit(0);
});
