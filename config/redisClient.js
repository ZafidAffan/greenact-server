const { createClient } = require('redis');

// Buat client Redis
const redisClient = createClient({
  url: 'redis://localhost:6379' // Sesuaikan jika pakai Redis online/cloud
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));

// Hubungkan ke server Redis
(async () => {
  await redisClient.connect();
  console.log('✅ Terhubung ke Server Redis!');
})();

module.exports = redisClient;