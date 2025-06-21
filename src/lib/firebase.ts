
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import type { FirebaseApp } from "firebase/app";

// Your web app's Firebase configuration will be loaded from environment variables
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// We check for the projectId to ensure the config is at least partially present.
// This is to avoid crashing on the server during build or startup if env vars are missing.
if (firebaseConfig.projectId) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Let app and db remain null if initialization fails.
    // The app will throw a more specific error downstream when `db` is used.
  }
} else {
    // This message is helpful for local development.
    console.log("Firebase projectId not found, skipping Firebase initialization.");
}

export { app, db };
