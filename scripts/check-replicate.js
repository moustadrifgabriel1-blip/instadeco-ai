const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const replicateIds = [
  'ezde4egct9rmt0cvtv18p8ry6m',
  'vmm94w9qw5rmy0cvtw3t9d0dzr', 
  '0e22z8dn8xrmt0cvtv3vz2h88m',
  'd61zxhm51drmw0cvtvzsvv3at0'
];

async function checkReplicateStatus() {
  for (const id of replicateIds) {
    try {
      const prediction = await replicate.predictions.get(id);
      console.log(`\n=== Replicate ID: ${id} ===`);
      console.log('Status:', prediction.status);
      console.log('Output:', prediction.output ? 'OUI' : 'NON');
      if (prediction.error) {
        console.log('Erreur:', prediction.error);
      }
      if (prediction.output) {
        console.log('Output URL:', prediction.output);
      }
    } catch (err) {
      console.error(`Erreur pour ${id}:`, err.message);
    }
  }
}

checkReplicateStatus().then(() => process.exit(0));
