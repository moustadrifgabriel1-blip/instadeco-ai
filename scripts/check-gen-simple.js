const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkGenerations() {
  const adminUserId = 'y4m1wfl8daZkDw8Ox26cN110Zls1';
  
  console.log('=== VÉRIFICATION GÉNÉRATIONS ===\n');
  console.log('UserId:', adminUserId);
  
  try {
    // Récupérer TOUTES les générations sans tri (pour contourner l'index)
    const genSnap = await db.collection('generations')
      .where('userId', '==', adminUserId)
      .get();
    
    console.log(`\n📸 Générations trouvées: ${genSnap.size}`);
    
    const generations = [];
    genSnap.docs.forEach((doc) => {
      const data = doc.data();
      generations.push({
        id: doc.id,
        status: data.status,
        style: data.styleSlug,
        room: data.roomTypeSlug,
        hasOutput: !!data.outputImageUrl,
        outputUrl: data.outputImageUrl?.substring(0, 80) + '...',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || 'N/A'
      });
    });
    
    // Trier manuellement
    generations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    generations.forEach((gen, index) => {
      console.log(`\n${index + 1}. ${gen.id}`);
      console.log(`   Status: ${gen.status}`);
      console.log(`   Style: ${gen.style} | Pièce: ${gen.room}`);
      console.log(`   Output: ${gen.hasOutput ? '✅' : '❌'}`);
      if (gen.hasOutput) {
        console.log(`   URL: ${gen.outputUrl}`);
      }
      console.log(`   Date: ${gen.createdAt}`);
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
  
  process.exit(0);
}

checkGenerations();
