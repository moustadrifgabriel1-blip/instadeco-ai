const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function setupAdminAccount() {
  const adminEmail = 'moustadrifgabriel1@gmail.com';
  const adminUserId = 'y4m1wfl8daZkDw8Ox26cN110Zls1';
  
  console.log('=== CONFIGURATION COMPTE ADMIN ===\n');
  console.log('Email:', adminEmail);
  console.log('UserId:', adminUserId);
  
  try {
    // 1. Mettre à jour le document utilisateur avec le rôle admin et crédits illimités
    await db.collection('users').doc(adminUserId).update({
      role: 'admin',
      credits: 9999,
      isTestAccount: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log('\n✅ Compte mis à jour:');
    console.log('   - Role: admin');
    console.log('   - Crédits: 9999');
    console.log('   - isTestAccount: true');
    
    // 2. Vérifier les générations
    const genSnap = await db.collection('generations')
      .where('userId', '==', adminUserId)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log(`\n📸 Générations trouvées: ${genSnap.size}`);
    
    genSnap.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n   ${index + 1}. ID: ${doc.id}`);
      console.log(`      Status: ${data.status}`);
      console.log(`      Style: ${data.styleSlug}`);
      console.log(`      Output URL: ${data.outputImageUrl ? 'OUI ✅' : 'NON ❌'}`);
    });
    
    // 3. Afficher le document utilisateur final
    const userDoc = await db.collection('users').doc(adminUserId).get();
    console.log('\n=== COMPTE FINAL ===');
    console.log(JSON.stringify(userDoc.data(), null, 2));
    
  } catch (error) {
    console.error('Erreur:', error);
  }
  
  process.exit(0);
}

setupAdminAccount();
