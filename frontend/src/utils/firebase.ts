import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Check if Firebase environment variables are properly configured
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN', 
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => 
  !import.meta.env[varName] || import.meta.env[varName] === `your-${varName.toLowerCase().replace('vite_firebase_', '').replace('_', '-')}`
);

if (missingVars.length > 0) {
  console.error('❌ Firebase configuration is missing or using placeholder values:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('Please create a .env file in the frontend directory with your Firebase credentials.');
  console.error('See: https://firebase.google.com/docs/web/setup#config-object');
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to emulators in development mode
if (import.meta.env.DEV) {
  console.log('🔧 Connecting to Firebase emulators...');
  
  // Connect to Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  
  // Connect to Firestore emulator
  connectFirestoreEmulator(db, 'localhost', 8080);
  
  // Connect to Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199);
  
  console.log('✅ Connected to Firebase emulators');
} 