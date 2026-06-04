import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ============================================
// IMPORTANT: Replace this with your Firebase config
// ============================================
// Get your firebaseConfig from Firebase Console:
// 1. Go to https://console.firebase.google.com
// 2. Select your project
// 3. Click the gear icon (⚙️) → Project settings
// 4. Scroll down to "Your apps" section
// 5. Copy the config object from "Firebase SDK snippet"
// ============================================

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY_HERE',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: 'your-messaging-sender-id',
  appId: 'your-app-id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
