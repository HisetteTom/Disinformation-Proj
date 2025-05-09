const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase client SDK
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// Initialize Firebase Admin SDK with the same service account used for Storage
try {
  // Read service account file contents instead of passing the path
  const serviceAccountPath = path.join(__dirname, '..', process.env.GCP_KEY_FILE);
  console.log('Loading service account from:', serviceAccountPath);
  
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found: ${serviceAccountPath}`);
  }
  
  // Read the service account file directly
  const serviceAccountContent = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountContent),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase admin initialization error:', error);
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

module.exports = {
  auth,
  db,
  adminAuth,
  adminDb
};