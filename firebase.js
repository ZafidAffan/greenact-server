// firebase.js
const admin = require('firebase-admin');

// Ambil key dari environment variable di Railway
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Buat bucket untuk akses storage
const bucket = admin.storage().bucket();

module.exports = bucket;
