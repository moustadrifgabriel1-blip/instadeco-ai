const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'instantdecor-ai.firebasestorage.app',
  });
}

const bucket = admin.storage().bucket();
console.log('Bucket name:', bucket.name);

bucket.getFiles({ maxResults: 1 }).then(([files]) => {
  console.log('Bucket accessible! Files count:', files.length);
  process.exit(0);
}).catch(err => {
  console.error('Bucket error:', err.message);
  process.exit(1);
});
