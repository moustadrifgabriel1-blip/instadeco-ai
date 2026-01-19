const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/seed',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('🔄 Appel de POST http://localhost:3001/api/seed...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}\n`);
    try {
      const json = JSON.parse(data);
      console.log('📦 Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('📄 Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});

req.end();
