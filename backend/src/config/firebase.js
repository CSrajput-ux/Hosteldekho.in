// ─────────────────────────────────────────────────────────────
// Config — Firebase Admin SDK
// Verifies Google ID tokens sent from the frontend
// ─────────────────────────────────────────────────────────────

const admin = require('firebase-admin');
const path = require('path');
const logger = require('../utils/logger');

// To use Firebase Admin, you must download your service account JSON 
// from Firebase Console -> Project Settings -> Service Accounts
// and save it as 'firebaseServiceAccount.json' in the backend root directory.

try {
  const serviceAccountPath = path.resolve(__dirname, '../../firebaseServiceAccount.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });

  logger.info('🔥 Firebase Admin initialized successfully');
} catch (error) {
  logger.warn('⚠️ Firebase Admin initialization failed: Please ensure firebaseServiceAccount.json exists in the root directory. Google login verification will fail until this is fixed.');
  
  // Initialize with dummy data in dev mode to avoid total crash, 
  // though verification will still fail.
  if (process.env.NODE_ENV !== 'production') {
    admin.initializeApp({
      projectId: 'hosteldekho-c8eca' // Fallback for some basic operations
    });
  }
}

module.exports = admin;
